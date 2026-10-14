"""Shared JSON/stdin/stdout helpers for STDIO capabilities."""
import json
import sys
from pathlib import Path

def receive():
    try:
        value = json.load(sys.stdin)
        if not isinstance(value, dict):
            raise ValueError("expected a JSON object")
        return value
    except (ValueError, json.JSONDecodeError) as exc:
        fail(f"invalid STDIO input: {exc}")

def emit(value):
    print(json.dumps(value, ensure_ascii=False))

def fail(message):
    print(message, file=sys.stderr)
    sys.exit(1)

def read_document(path, encoding='utf-8'):
    try:
        location = Path(path).resolve()
        if not location.is_file():
            raise FileNotFoundError(str(location))
        return location.read_text(encoding=encoding)
    except (OSError, UnicodeError) as exc:
        fail(str(exc))
