from abc import ABC, abstractmethod
from pathlib import Path
from dataclasses import dataclass


@dataclass
class RawHit:
    category: str
    file_path: str
    line: int
    snippet: str
    severity: str  # initial guess, LLM can adjust in explain phase


class Detector(ABC):
    category: str

    @abstractmethod
    def scan(self, file_path: Path, content: str) -> list[RawHit]:
        ...
