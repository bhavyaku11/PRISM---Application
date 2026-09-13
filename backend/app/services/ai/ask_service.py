import logging
import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.core.config import settings
from app.core.supabase import get_supabase_client, get_admin_supabase_client
from app.services.retrieval.service import RetrievalService
from app.services.ai import get_ai_provider, AIProvider
from app.services.ai.prompts import (
    PRISM_SYSTEM_INSTRUCTION,
    format_evidence_context,
    format_user_prompt,
)

logger = logging.getLogger("prism.ai.ask")

INSUFFICIENT_EVIDENCE_ANSWER = (
    "I couldn't find enough information in your policy to answer that confidently."
)


class AskService:
    """Orchestrates policy question answering using Step 9 retrieval and Grok LLM."""

    def __init__(
        self,
        retrieval_service: Optional[RetrievalService] = None,
        ai_provider: Optional[AIProvider] = None,
        user_token: Optional[str] = None,
    ):
        self.user_token = user_token
        self.retrieval = retrieval_service or RetrievalService(user_token=user_token)
        self.ai = ai_provider or get_ai_provider()
        self.client = get_supabase_client(token=user_token)

    def ask(
        self,
        user_id: str,
        question: str,
        policy_id: Optional[str] = None,
        document_id: Optional[str] = None,
        conversation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Execute grounded AI answer pipeline strictly scoped to the user."""
        clean_question = question.strip() if question else ""
        if not clean_question:
            raise ValueError("Question cannot be empty.")

        if len(clean_question) > 1000:
            raise ValueError("Question exceeds the 1000-character limit.")

        logger.info(
            "Ask request: user_id=%s, question='%s', policy_id=%s, doc_id=%s, conv_id=%s",
            user_id,
            clean_question[:80],
            policy_id,
            document_id,
            conversation_id,
        )

        # 1. Verify policy/document ownership if provided
        self._verify_scope_ownership(user_id=user_id, policy_id=policy_id, document_id=document_id)

        # 2. Get or create conversation record
        conv_id = self._resolve_conversation(
            user_id=user_id,
            conversation_id=conversation_id,
            title=clean_question,
            policy_id=policy_id,
            document_id=document_id,
        )

        # 3. Retrieve relevant chunks using existing Step 9 retrieval service
        chunks = self.retrieval.retrieve_relevant_chunks(
            user_id=user_id,
            query=clean_question,
            policy_id=policy_id,
            document_id=document_id,
            top_k=settings.RETRIEVAL_DEFAULT_TOP_K,
        )

        # 4. Evidence sufficiency check
        is_sufficient, has_weak_evidence = self._evaluate_evidence_sufficiency(chunks)

        if not is_sufficient:
            logger.info("Insufficient evidence for question '%s' (chunks=%d)", clean_question[:60], len(chunks))
            return self._record_and_return_insufficient_evidence(
                user_id=user_id,
                conv_id=conv_id,
                question=clean_question,
                policy_id=policy_id,
                document_id=document_id,
                sources=chunks,
            )

        # 5. Fetch prior conversation history if continuing an existing thread
        history = self._load_conversation_history(user_id=user_id, conv_id=conv_id)

        # 6. Format context and user prompt
        evidence_context = format_evidence_context(chunks)
        user_prompt = format_user_prompt(
            question=clean_question,
            evidence_context=evidence_context,
            has_weak_evidence=has_weak_evidence,
        )

        # 7. Generate answer with Grok
        ai_response = self.ai.generate_answer(
            prompt=user_prompt,
            system_instruction=PRISM_SYSTEM_INSTRUCTION,
            history=history,
            temperature=0.1,
        )

        answer = ai_response.get("answer") or INSUFFICIENT_EVIDENCE_ANSWER
        grounded = bool(ai_response.get("grounded", False))
        confidence = str(ai_response.get("confidence", "low")).lower()

        # 8. Server-side citation validation
        validated_citations = self._validate_citations(
            raw_citations=ai_response.get("citations", []),
            retrieved_chunks=chunks,
            grounded=grounded,
        )

        # If answer says evidence is insufficient, mark grounded=False
        if "couldn't find enough information" in answer.lower() or "insufficient" in answer.lower():
            grounded = False
            confidence = "low"
            validated_citations = []

        # 9. Persist user and assistant messages
        asst_msg_id = self._persist_interaction(
            user_id=user_id,
            conv_id=conv_id,
            question=clean_question,
            answer=answer,
            citations=validated_citations,
            grounded=grounded,
            confidence=confidence,
            policy_id=policy_id,
            document_id=document_id,
            sources_count=len(chunks),
        )

        # 10. Construct formatted response
        sources_payload = [
            {
                "chunk_id": c.get("chunk_id") or c.get("id"),
                "document_id": c.get("document_id"),
                "policy_id": c.get("policy_id"),
                "page_number": c.get("page_number"),
                "section_title": c.get("section_title"),
                "content": c.get("content"),
                "similarity": c.get("similarity"),
            }
            for c in chunks
        ]

        return {
            "answer": answer,
            "grounded": grounded,
            "confidence": confidence,
            "conversation_id": conv_id,
            "message_id": asst_msg_id,
            "citations": validated_citations,
            "sources": sources_payload,
        }

    def _verify_scope_ownership(
        self,
        user_id: str,
        policy_id: Optional[str] = None,
        document_id: Optional[str] = None,
    ) -> None:
        """Ensure policy_id and document_id belong to the authenticated user."""
        if policy_id:
            res = (
                self.client.table("policies")
                .select("id")
                .eq("id", policy_id)
                .eq("user_id", user_id)
                .execute()
            )
            if not res.data:
                raise ValueError("Selected policy was not found or access is unauthorized.")

        if document_id:
            res = (
                self.client.table("documents")
                .select("id, policy_id")
                .eq("id", document_id)
                .eq("user_id", user_id)
                .execute()
            )
            if not res.data:
                raise ValueError("Selected document was not found or access is unauthorized.")

    def _resolve_conversation(
        self,
        user_id: str,
        conversation_id: Optional[str],
        title: str,
        policy_id: Optional[str],
        document_id: Optional[str],
    ) -> str:
        """Validate existing conversation ownership or create a new one."""
        if conversation_id:
            res = (
                self.client.table("conversations")
                .select("id")
                .eq("id", conversation_id)
                .eq("user_id", user_id)
                .execute()
            )
            if res.data:
                return conversation_id
            logger.warning("Conversation %s not found for user %s; creating a new one", conversation_id, user_id)

        # Create new conversation
        short_title = title[:50] + ("..." if len(title) > 50 else "")
        new_conv = {
            "user_id": user_id,
            "title": short_title,
            "policy_id": policy_id,
            "document_id": document_id,
            "context_type": "policy",
        }
        res = self.client.table("conversations").insert(new_conv).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]["id"]

        # Fallback local UUID if DB insert doesn't return data (e.g. testing)
        return str(uuid.uuid4())

    def _evaluate_evidence_sufficiency(
        self, chunks: List[Dict[str, Any]]
    ) -> tuple[bool, bool]:
        """Evaluate whether retrieved chunks provide sufficient evidence.
        
        Returns:
            (is_sufficient, has_weak_evidence)
        """
        if not chunks:
            return False, False

        top_similarity = float(chunks[0].get("similarity", 0.0))
        threshold = settings.RETRIEVAL_MIN_CONFIDENCE_THRESHOLD  # 0.40

        if top_similarity < threshold:
            return False, False

        # Borderline evidence between 0.40 and 0.55
        has_weak = top_similarity < 0.55
        return True, has_weak

    def _validate_citations(
        self,
        raw_citations: List[Dict[str, Any]],
        retrieved_chunks: List[Dict[str, Any]],
        grounded: bool,
    ) -> List[Dict[str, Any]]:
        """Validate every citation against actual retrieved chunks from the database.
        
        CRITICAL SECURITY & INTEGRITY REQUIREMENT:
        - Rejects any chunk ID that was not retrieved.
        - Enforces authentic page numbers, section titles, and document IDs from the DB.
        """
        if not grounded or not retrieved_chunks:
            return []

        # Map candidate chunks by both chunk_id and id
        chunk_map: Dict[str, Dict[str, Any]] = {}
        for c in retrieved_chunks:
            c_id = c.get("chunk_id") or c.get("id")
            if c_id:
                chunk_map[str(c_id)] = c

        validated: List[Dict[str, Any]] = []
        seen_chunks = set()

        for cit in raw_citations:
            target_id = str(cit.get("chunk_id", ""))
            if not target_id or target_id not in chunk_map:
                logger.warning("Dropping fabricated or un-retrieved citation chunk_id: '%s'", target_id)
                continue

            if target_id in seen_chunks:
                continue
            seen_chunks.add(target_id)

            db_chunk = chunk_map[target_id]
            validated.append({
                "chunk_id": target_id,
                "document_id": db_chunk.get("document_id"),
                "policy_id": db_chunk.get("policy_id"),
                "page_number": db_chunk.get("page_number"),
                "section_title": db_chunk.get("section_title"),
            })

        # Server-side fallback: if model grounded answer in chunks but omitted citations list
        if grounded and not validated and len(retrieved_chunks) > 0:
            top_chunk = retrieved_chunks[0]
            top_id = str(top_chunk.get("chunk_id") or top_chunk.get("id"))
            validated.append({
                "chunk_id": top_id,
                "document_id": top_chunk.get("document_id"),
                "policy_id": top_chunk.get("policy_id"),
                "page_number": top_chunk.get("page_number"),
                "section_title": top_chunk.get("section_title"),
            })

        return validated

    def _load_conversation_history(self, user_id: str, conv_id: str) -> List[Dict[str, str]]:
        """Load prior message turns for conversational continuity."""
        try:
            res = (
                self.client.table("messages")
                .select("role, content")
                .eq("conversation_id", conv_id)
                .eq("user_id", user_id)
                .order("created_at", ascending=True)
                .limit(6)
                .execute()
            )
            return [{"role": r["role"], "content": r["content"]} for r in (res.data or []) if r.get("content")]
        except Exception as exc:
            logger.debug("Failed to load conversation history: %s", exc)
            return []

    def _record_and_return_insufficient_evidence(
        self,
        user_id: str,
        conv_id: str,
        question: str,
        policy_id: Optional[str],
        document_id: Optional[str],
        sources: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Handle cases where retrieved evidence is insufficient without invoking LLM."""
        asst_msg_id = self._persist_interaction(
            user_id=user_id,
            conv_id=conv_id,
            question=question,
            answer=INSUFFICIENT_EVIDENCE_ANSWER,
            citations=[],
            grounded=False,
            confidence="low",
            policy_id=policy_id,
            document_id=document_id,
            sources_count=len(sources),
        )

        sources_payload = [
            {
                "chunk_id": c.get("chunk_id") or c.get("id"),
                "document_id": c.get("document_id"),
                "policy_id": c.get("policy_id"),
                "page_number": c.get("page_number"),
                "section_title": c.get("section_title"),
                "content": c.get("content"),
                "similarity": c.get("similarity"),
            }
            for c in sources
        ]

        return {
            "answer": INSUFFICIENT_EVIDENCE_ANSWER,
            "grounded": False,
            "confidence": "low",
            "conversation_id": conv_id,
            "message_id": asst_msg_id,
            "citations": [],
            "sources": sources_payload,
        }

    def _persist_interaction(
        self,
        user_id: str,
        conv_id: str,
        question: str,
        answer: str,
        citations: List[Dict[str, Any]],
        grounded: bool,
        confidence: str,
        policy_id: Optional[str],
        document_id: Optional[str],
        sources_count: int,
    ) -> str:
        """Persist user and assistant messages into Supabase messages table."""
        asst_id = str(uuid.uuid4())
        try:
            # 1. Insert user message
            self.client.table("messages").insert({
                "conversation_id": conv_id,
                "user_id": user_id,
                "role": "user",
                "content": question,
                "citations": [],
                "metadata": {
                    "policy_id": policy_id,
                    "document_id": document_id,
                },
            }).execute()

            # 2. Insert assistant response
            res_asst = self.client.table("messages").insert({
                "conversation_id": conv_id,
                "user_id": user_id,
                "role": "assistant",
                "content": answer,
                "citations": citations,
                "metadata": {
                    "grounded": grounded,
                    "confidence": confidence,
                    "sources_count": sources_count,
                    "policy_id": policy_id,
                    "document_id": document_id,
                },
            }).execute()

            if res_asst.data and len(res_asst.data) > 0:
                asst_id = res_asst.data[0]["id"]

            # 3. Update conversation updated_at
            now_iso = datetime.now(timezone.utc).isoformat()
            self.client.table("conversations").update({"updated_at": now_iso}).eq("id", conv_id).execute()

        except Exception as persist_err:
            logger.warning("Failed to persist conversation message: %s", persist_err)

        return asst_id
