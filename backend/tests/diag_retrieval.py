"""PRISM Retrieval Diagnostic — traces every pipeline layer."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.config import settings
from app.core.supabase import get_admin_supabase_client
from app.services.embeddings import get_embedding_provider
from app.services.retrieval.service import (
    RetrievalService, _parse_embedding, compute_lexical_score, cosine_similarity,
)

QUERY = "What is the waiting period for pre-existing diseases in my policy?"
PHRASES = ["waiting period", "pre-existing disease", "PED", "36 months"]
SEP = "=" * 72

# ── 1. Embedding model ──────────────────────────────────────────────────────
print(SEP); print("STEP 1: EMBEDDING MODEL"); print(SEP)
provider = get_embedding_provider()
print(f"  Model     : {provider.model_name}")
print(f"  Dimension : {provider.dimension}")
query_vec = provider.embed_text(QUERY)
print(f"  Vec type  : {type(query_vec).__name__}  len={len(query_vec)}")
print(f"  First 5   : {[round(x,5) for x in query_vec[:5]]}")

# ── 2. Raw chunk scan ───────────────────────────────────────────────────────
print(); print(SEP); print("STEP 2: RAW CHUNK SCAN"); print(SEP)
admin = get_admin_supabase_client()
res = admin.table("document_chunks").select(
    "id, document_id, policy_id, user_id, page_number, section_title, content, embedding"
).execute()
all_chunks = res.data or []
with_emb   = [c for c in all_chunks if c.get("embedding") is not None]
without_emb= [c for c in all_chunks if c.get("embedding") is None]
print(f"  Total chunks      : {len(all_chunks)}")
print(f"  With embedding    : {len(with_emb)}")
print(f"  Without embedding : {len(without_emb)}")

dim_mismatches = []
for c in with_emb:
    p = _parse_embedding(c["embedding"])
    if p and len(p) != provider.dimension:
        dim_mismatches.append((c["id"], len(p)))
print(f"  Dim mismatches    : {len(dim_mismatches)}")
for cid, d in dim_mismatches[:5]:
    print(f"    chunk {cid}: {d}d")

policies  = set(c.get("policy_id") for c in all_chunks)
documents = set(c.get("document_id") for c in all_chunks)
print(f"  Distinct policies : {policies}")
print(f"  Distinct docs     : {documents}")

# ── 3. Find PED chunk ───────────────────────────────────────────────────────
print(); print(SEP); print("STEP 3: FIND PED / WAITING PERIOD CHUNK"); print(SEP)
kws = ["pre-existing", "ped", "36 month", "waiting period"]
ped_chunks = [c for c in all_chunks
              if any(kw in (c.get("content","") + c.get("section_title","")).lower() for kw in kws)]
print(f"  Matching chunks: {len(ped_chunks)}")
for c in ped_chunks:
    emb = _parse_embedding(c.get("embedding"))
    print(f"\n  ID={c.get('id')}  policy={c.get('policy_id')}  doc={c.get('document_id')}")
    print(f"  page={c.get('page_number')}  section={c.get('section_title')}")
    print(f"  embedding={'dim='+str(len(emb)) if emb else 'MISSING'}")
    print(f"  content: {(c.get('content') or '')[:250].replace(chr(10),' ')}")

# ── 4. Dense-only ranking ───────────────────────────────────────────────────
print(); print(SEP); print("STEP 4: DENSE VECTOR (top 15)"); print(SEP)
dense = [(cosine_similarity(query_vec, _parse_embedding(c["embedding"])), c)
         for c in all_chunks if _parse_embedding(c.get("embedding"))]
dense.sort(key=lambda x: x[0], reverse=True)
print(f"  {'Rk':<3} {'Dense':>8}  {'Page':>4}  Section")
for i,(s,c) in enumerate(dense[:15],1):
    sec = (c.get("section_title") or "")[:48]
    pg  = c.get("page_number","?")
    mark = " ◄PED" if any(kw in (c.get("content","")+c.get("section_title","")).lower() for kw in kws) else ""
    print(f"  {i:<3} {s:>8.4f}  {str(pg):>4}  {sec}{mark}")

# ── 5. Lexical-only ranking ─────────────────────────────────────────────────
print(); print(SEP); print("STEP 5: LEXICAL (top 15)"); print(SEP)
lexs = [(compute_lexical_score(QUERY, c.get("content",""), c.get("section_title")), c)
        for c in all_chunks]
lexs.sort(key=lambda x: x[0], reverse=True)
print(f"  {'Rk':<3} {'Lex':>8}  {'Page':>4}  Section")
for i,(s,c) in enumerate(lexs[:15],1):
    sec = (c.get("section_title") or "")[:48]
    pg  = c.get("page_number","?")
    mark = " ◄PED" if any(kw in (c.get("content","")+c.get("section_title","")).lower() for kw in kws) else ""
    print(f"  {i:<3} {s:>8.4f}  {str(pg):>4}  {sec}{mark}")

# ── 6. Hybrid scores ────────────────────────────────────────────────────────
alpha = settings.HYBRID_RETRIEVAL_ALPHA
print(); print(SEP)
print(f"STEP 6: HYBRID (alpha={alpha:.2f} dense + {1-alpha:.2f} lexical)"); print(SEP)
hybrids = []
for c in all_chunks:
    emb = _parse_embedding(c.get("embedding"))
    if not emb: continue
    vec   = cosine_similarity(query_vec, emb)
    normv = max(0.0, min(1.0, (vec+1.0)/2.0 if vec < 0 else vec))
    lex   = compute_lexical_score(QUERY, c.get("content",""), c.get("section_title"))
    hyb   = alpha*normv + (1-alpha)*lex
    hybrids.append((hyb, vec, normv, lex, c))
hybrids.sort(key=lambda x: x[0], reverse=True)

print(f"  {'Rk':<3} {'Hybrid':>8} {'Dense':>8} {'NormD':>7} {'Lex':>8}  {'Pg':>3}  Section")
for i,(hyb,vec,normv,lex,c) in enumerate(hybrids[:15],1):
    sec  = (c.get("section_title") or "")[:36]
    pg   = c.get("page_number","?")
    mark = " ◄PED" if any(kw in (c.get("content","")+c.get("section_title","")).lower() for kw in kws) else ""
    print(f"  {i:<3} {hyb:>8.4f} {vec:>8.4f} {normv:>7.4f} {lex:>8.4f}  {str(pg):>3}  {sec}{mark}")

threshold = settings.RETRIEVAL_MIN_CONFIDENCE_THRESHOLD
above = [h for h,_,_,_,_ in hybrids if h >= threshold]
print(f"\n  Threshold: {threshold}")
print(f"  Chunks >= threshold: {len(above)}")

# ── 7. Per-phrase lexical ───────────────────────────────────────────────────
print(); print(SEP); print("STEP 7: PER-PHRASE LEXICAL"); print(SEP)
for phrase in PHRASES:
    scores = [(compute_lexical_score(phrase, c.get("content",""), c.get("section_title")),
               c.get("page_number"), (c.get("section_title") or "")[:40])
              for c in all_chunks]
    scores = [(s,p,t) for s,p,t in scores if s > 0]
    scores.sort(reverse=True)
    print(f"\n  '{phrase}' — {len(scores)} matching chunks")
    for s,p,t in scores[:5]:
        print(f"    lex={s:.4f}  pg={p}  section={t}")

# ── 8. RetrievalService end-to-end ─────────────────────────────────────────
print(); print(SEP); print("STEP 8: RETRIEVAL SERVICE E2E"); print(SEP)
user_ids = list({c.get("user_id") for c in all_chunks if c.get("user_id")})
if user_ids:
    uid = user_ids[0]
    print(f"  user_id: {uid}")
    svc = RetrievalService(provider=provider)
    results = svc.retrieve_relevant_chunks(uid, QUERY, top_k=10, min_score=0.0)
    print(f"  Results (min_score=0): {len(results)}")
    for i,r in enumerate(results,1):
        print(f"    {i}. sim={r['similarity']:.4f}  pg={r['page_number']}  {r.get('section_title','')[:45]}")
    above_t = [r for r in results if r["similarity"] >= threshold]
    print(f"\n  Above threshold {threshold}: {len(above_t)}")
    if not above_t:
        print(f"  → Insufficient Evidence will fire (top sim={results[0]['similarity']:.4f} if results else 0)")
else:
    print("  No user IDs in chunks — skipping")

print(); print(SEP); print("DONE"); print(SEP)
