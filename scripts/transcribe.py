#!/usr/bin/env python3
"""
Transcribe a local media file or a YouTube URL into a plain-text transcript,
using the OpenAI Whisper API directly (no Java/server dependency).

Usage:
    python scripts/transcribe.py --project <name> --file <path> [--language en]
    python scripts/transcribe.py --project <name> --youtube-url <url> [--language en]
    python scripts/transcribe.py --project <name> --file <path> --out <custom/path.md>

Writes the transcript directly to disk (default:
projects/<project>/05_transcription_transcript.md) and prints a short summary to
stdout. Never prints the transcript itself to stdout.
"""
import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import requests

from common import openai_config, project_dir, fail

OPENAI_MAX_AUDIO_BYTES = 25 * 1024 * 1024
OPENAI_CHUNK_SECONDS = 540
YOUTUBE_EXTRACTOR_ARGS = "youtube:player_client=android,web"
YTDLP_TIMEOUT_SECONDS = 15 * 60
FFMPEG_TIMEOUT_SECONDS = 10 * 60
WHISPER_TIMEOUT_SECONDS = 5 * 60


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--project", required=True, help="Project name under projects/")
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--file", help="Path to a local media file (audio or video)")
    source.add_argument("--youtube-url", help="A YouTube URL to download and transcribe")
    parser.add_argument("--language", default=None, help="ISO language code hint, e.g. en")
    parser.add_argument("--out", default=None, help="Output path (default: projects/<project>/05_transcription_transcript.md)")
    return parser.parse_args()


def run(command, timeout, log_path, description):
    with open(log_path, "wb") as log_file:
        try:
            process = subprocess.run(
                command,
                stdout=log_file,
                stderr=subprocess.STDOUT,
                timeout=timeout,
            )
        except subprocess.TimeoutExpired:
            fail(f"{description} timed out after {timeout}s")
        except FileNotFoundError:
            fail(f"{description} failed: '{command[0]}' not found on PATH")
    if process.returncode != 0:
        tail = log_tail(log_path)
        fail(f"{description} failed (exit {process.returncode}):\n{tail}")


def log_tail(log_path, lines=40):
    try:
        text = Path(log_path).read_text(encoding="utf-8", errors="replace")
    except OSError as exc:
        return f"<failed to read log: {exc}>"
    return "\n".join(text.splitlines()[-lines:])


def download_youtube_audio(url: str, tmp_dir: Path) -> Path:
    if shutil.which("yt-dlp") is None:
        fail("yt-dlp is not on PATH. Install it (pip install yt-dlp) and retry.")
    log_path = tmp_dir / "yt-dlp.log"
    command = [
        "yt-dlp",
        "--no-update",
        "--no-progress",
        "--retries", "3",
        "--fragment-retries", "3",
        "--retry-sleep", "2",
        "--force-ipv4",
        "--js-runtimes", "node,deno",
        "--extractor-args", YOUTUBE_EXTRACTOR_ARGS,
        "-x",
        "--audio-format", "mp3",
        "-o", str(tmp_dir / "%(id)s.%(ext)s"),
        url,
    ]
    run(command, YTDLP_TIMEOUT_SECONDS, log_path, "yt-dlp download")
    downloaded = [p for p in tmp_dir.iterdir() if p.name not in ("yt-dlp.log",) and p.is_file()]
    if not downloaded:
        fail("yt-dlp reported success but produced no audio file")
    downloaded.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return downloaded[0]


def chunk_audio(input_path: Path, tmp_dir: Path) -> list[Path]:
    if shutil.which("ffmpeg") is None:
        fail("ffmpeg is not on PATH. Install it and retry (needed to split audio over 25MB).")
    chunk_dir = tmp_dir / "chunks"
    chunk_dir.mkdir(exist_ok=True)
    log_path = tmp_dir / "ffmpeg-split.log"
    output_pattern = chunk_dir / "chunk-%03d.mp3"
    command = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-i", str(input_path),
        "-vn",
        "-ac", "1",
        "-ar", "16000",
        "-codec:a", "libmp3lame",
        "-b:a", "48k",
        "-f", "segment",
        "-segment_time", str(OPENAI_CHUNK_SECONDS),
        str(output_pattern),
    ]
    run(command, FFMPEG_TIMEOUT_SECONDS, log_path, "ffmpeg chunking")
    chunks = sorted(chunk_dir.glob("chunk-*.mp3"))
    if not chunks:
        fail("ffmpeg reported success but produced no chunk files")
    return chunks


def transcribe_chunk(cfg: dict, data: bytes, filename: str, language: str | None) -> list[dict]:
    if len(data) > OPENAI_MAX_AUDIO_BYTES:
        fail(f"{filename} is {len(data)} bytes, still over the 25MB OpenAI limit after chunking")
    fields = {
        "model": (None, cfg["transcription_model"]),
        "response_format": (None, "verbose_json"),
        "timestamp_granularities[]": (None, "segment"),
        "file": (filename, data, "audio/mpeg"),
    }
    if language:
        fields["language"] = (None, language)
    url = f"{cfg['base_url']}/v1/audio/transcriptions"
    try:
        response = requests.post(
            url,
            headers={"Authorization": f"Bearer {cfg['api_key']}"},
            files=fields,
            timeout=WHISPER_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        fail(f"OpenAI transcription request failed: {exc}")
    if response.status_code >= 400:
        fail(f"OpenAI transcription failed (HTTP {response.status_code}): {extract_error(response)}")
    body = response.json()
    segments = body.get("segments")
    if not segments:
        text = (body.get("text") or "").strip()
        return [{"start": 0.0, "end": 0.0, "speaker": "Unknown", "text": text}] if text else []
    entries = []
    for segment in segments:
        text = (segment.get("text") or "").strip()
        if not text:
            continue
        entries.append({
            "start": float(segment.get("start", 0.0)),
            "end": float(segment.get("end", segment.get("start", 0.0))),
            "speaker": segment.get("speaker", "Unknown"),
            "text": text,
        })
    return entries


def extract_error(response) -> str:
    try:
        body = response.json()
        return body.get("error", {}).get("message", response.text[:300])
    except ValueError:
        return response.text[:300]


def format_timestamp(seconds_value: float) -> str:
    total_seconds = max(0, int(seconds_value // 1))
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    return f"{minutes:02d}:{seconds:02d}"


def render_transcript(entries: list[dict]) -> str:
    lines = [
        f"[{format_timestamp(e['start'])} - {format_timestamp(e['end'])}] {e['speaker']}: {e['text']}"
        for e in entries
    ]
    return "\n".join(lines) + ("\n" if lines else "")


def main():
    args = parse_args()
    cfg = openai_config()
    proj_dir = project_dir(args.project)
    out_path = Path(args.out) if args.out else proj_dir / "05_transcription_transcript.md"

    with tempfile.TemporaryDirectory(prefix="stream-producer-transcribe-") as tmp:
        tmp_dir = Path(tmp)

        if args.youtube_url:
            audio_path = download_youtube_audio(args.youtube_url, tmp_dir)
        else:
            audio_path = Path(args.file)
            if not audio_path.is_file():
                fail(f"File not found: {audio_path}")

        size = audio_path.stat().st_size
        if size > OPENAI_MAX_AUDIO_BYTES:
            chunk_paths = chunk_audio(audio_path, tmp_dir)
        else:
            chunk_paths = [audio_path]

        all_entries = []
        for index, chunk_path in enumerate(chunk_paths):
            data = chunk_path.read_bytes()
            entries = transcribe_chunk(cfg, data, chunk_path.name, args.language)
            offset = index * OPENAI_CHUNK_SECONDS
            for entry in entries:
                entry["start"] += offset
                entry["end"] += offset
            all_entries.extend(entries)

    if not all_entries:
        fail("Transcription produced no text. Check the input file/URL and try again.")

    transcript_text = render_transcript(all_entries)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(transcript_text, encoding="utf-8")

    print(f"Transcribed {len(all_entries)} segments ({len(transcript_text)} chars) -> {out_path}")


if __name__ == "__main__":
    main()
