"""
File storage abstraction.

Current implementation: local disk at UPLOAD_DIR.
To swap in S3, replace LocalStorage with an S3Storage class that implements
the same save() / delete() / url() interface and update get_storage().
"""

import os
import uuid
from pathlib import Path

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/uploads"))
BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")


class LocalStorage:
    def __init__(self, upload_dir: Path = UPLOAD_DIR):
        self.upload_dir = upload_dir
        self.upload_dir.mkdir(parents=True, exist_ok=True)

    def save(self, file_bytes: bytes, original_filename: str) -> str:
        ext = Path(original_filename).suffix.lower() or ".jpg"
        filename = f"{uuid.uuid4().hex}{ext}"
        dest = self.upload_dir / filename
        dest.write_bytes(file_bytes)
        return filename

    def delete(self, filename: str) -> None:
        target = self.upload_dir / filename
        if target.exists():
            target.unlink()

    def url(self, filename: str) -> str:
        return f"{BASE_URL}/uploads/{filename}"


_storage: LocalStorage | None = None


def get_storage() -> LocalStorage:
    global _storage
    if _storage is None:
        _storage = LocalStorage()
    return _storage
