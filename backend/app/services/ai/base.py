from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class AIProvider(ABC):
    """Abstract base class for LLM / AI providers (Grok / xAI)."""

    @abstractmethod
    def generate_answer(
        self,
        prompt: str,
        system_instruction: str,
        history: Optional[List[Dict[str, str]]] = None,
        temperature: float = 0.1,
    ) -> Dict[str, Any]:
        """Generate structured response from the LLM.
        
        Args:
            prompt: User prompt containing question and policy context.
            system_instruction: Core system persona and anti-hallucination rules.
            history: Optional list of prior conversation turns [{"role": "user"|"assistant", "content": "..."}].
            temperature: Sampling temperature (default 0.1 for high fidelity).
            
        Returns:
            Dictionary with keys:
                - answer (str)
                - grounded (bool)
                - confidence (str: 'high' | 'medium' | 'low')
                - citations (List[Dict[str, Any]])
        """
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Name of the underlying LLM model."""
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Identifier for the provider."""
        pass
