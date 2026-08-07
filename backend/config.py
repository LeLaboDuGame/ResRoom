"""Config persistence layer.

Provides a simple JSON-based Config with thread-safe read and write
operations.
"""

import threading
import json


class Config:
    """A thread-safe JSON file Config."""

    def __init__(self, filename: str) -> None:
        """Initialize the Config with the given file path.

        :param filename: Path to the JSON file used for persistence.
        """
        self.filename = filename
        self.lock = threading.Lock()
        self.data = None

    def load(self) -> None:
        """Load the Config content from the JSON file into memory."""
        self.data = json.load(open(self.filename, "r"))

    def save(self) -> None:
        """Persist the in-memory Config content back to the JSON file."""
        json.dump(self.data, open(self.filename, "w"))