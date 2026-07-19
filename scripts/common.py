"""Shared helpers for stream-producer scripts: .env loading, project paths, errors."""
import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

REPO_ROOT = Path(__file__).resolve().parent.parent
PROJECTS_DIR = REPO_ROOT / "projects"

_env_loaded = False


def load_env():
    """Load .env from the repo root once. Real environment variables always win."""
    global _env_loaded
    if _env_loaded:
        return
    if load_dotenv is not None:
        env_path = REPO_ROOT / ".env"
        if env_path.exists():
            load_dotenv(dotenv_path=env_path, override=False)
    _env_loaded = True


def env(name: str, default: str = "") -> str:
    load_env()
    return os.environ.get(name, default).strip() or default


def require_env(name: str) -> str:
    value = env(name)
    if not value:
        fail(f"{name} is not set. Copy .env.example to .env and fill it in, or export {name}.")
    return value


def fail(message: str, code: int = 1):
    print(f"error: {message}", file=sys.stderr)
    sys.exit(code)


def project_dir(name: str) -> Path:
    """Resolve (and create) projects/<name>/."""
    if not name or not name.strip():
        fail("No project name given (--project is required).")
    path = PROJECTS_DIR / name.strip()
    path.mkdir(parents=True, exist_ok=True)
    return path


def openai_config() -> dict:
    return {
        "api_key": require_env("OPENAI_API_KEY"),
        "base_url": env("OPENAI_BASE_URL", "https://api.openai.com").rstrip("/"),
        "image_model": env("OPENAI_IMAGE_MODEL", "gpt-image-1"),
        "transcription_model": env("OPENAI_TRANSCRIPTION_MODEL", "whisper-1"),
    }
