---
name: transcribe
description: Transcribe a local media file or a YouTube URL into a saved transcript for a Stream Producer project, using OpenAI Whisper directly via a standalone Python script (no Java/server dependency). Use when the user asks to "transcribe", "transcribe this recording", "transcribe a YouTube video", or wants a transcript before generating chapters or a summary.
allowed-tools: [Read, Write, Bash, Glob]
---

## Instructions

Transcribe a local file or YouTube URL for project `$ARGUMENTS` (project name,
followed by either a local file path or a YouTube URL).

## Workflow

1. Resolve the project name (see `topic-ideas` skill for the resolution rule). Create
   `projects/<name>/` if new (the script also creates it, but do this first so you
   can report the right path even on failure).
2. Determine the input from `$ARGUMENTS`: a local file path or a YouTube URL. If
   neither was given, ask the user. Optionally ask for a `--language` hint (ISO code)
   if the content isn't in English and they want better accuracy.
3. Confirm prerequisites: `.env` in the repo root has `OPENAI_API_KEY` set (point the
   user at `.env.example` if not), and `ffmpeg`/`yt-dlp` are reachable — the script
   will fail clearly if they aren't, just relay that message.
4. Run one of:
   ```
   python scripts/transcribe.py --project <name> --file <path> [--language <code>]
   python scripts/transcribe.py --project <name> --youtube-url <url> [--language <code>]
   ```
   This writes directly to `projects/<name>/05_transcription_transcript.md` — do not
   read the whole transcript back into context, it can be long. The script only
   prints a short summary line (segment count, character count, output path).
5. Relay the script's stdout summary to the user. On a non-zero exit, surface the
   script's stderr message verbatim and stop — do not attempt to fabricate a
   transcript or retry silently.
6. Note: transcript entries show `Speaker: Unknown` for every line — plain OpenAI
   Whisper does not diarize speakers. This is expected, not a bug.
