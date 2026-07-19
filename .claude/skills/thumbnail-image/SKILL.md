---
name: thumbnail-image
description: Generate the actual thumbnail PNG from a chosen prompt using the OpenAI Images API directly via a standalone Python script (no Java/server dependency). Use when the user asks to "generate the thumbnail image", "create the thumbnail", or wants to turn a /thumbnail-prompts variant into a real image.
allowed-tools: [Read, Write, Bash, Glob]
---

## Instructions

Generate the thumbnail PNG for project `$ARGUMENTS` (project name, optionally
followed by which prompt/strategy to use).

## Workflow

1. Resolve the project name (see `topic-ideas` skill for the resolution rule).
2. Determine the prompt text: if `$ARGUMENTS` names a strategy (e.g.
   "high-contrast"), read `projects/<name>/03_thumbnail_prompts.md` and extract that
   variant's prompt text. If no prompt file exists yet or none was specified, ask the
   user for prompt text directly, or suggest running `/thumbnail-prompts` first.
3. Confirm `.env` in the repo root has `OPENAI_API_KEY` and `OPENAI_IMAGE_MODEL` set.
4. Run:
   ```
   python scripts/generate_thumbnail.py --project <name> --prompt "<the chosen prompt text>"
   ```
   This writes the PNG directly to `projects/<name>/03_thumbnail_image.png` and a
   sidecar `03_thumbnail_image.md` (prompt/model/timestamp) — never read the image
   bytes into context.
5. Relay the script's stdout summary to the user. On a non-zero exit, surface the
   script's stderr message verbatim and stop.
6. Note: the real API call uses 1536x1024 — the thumbnail-idea/prompt text is framed
   around 16:9 1280x720 as creative direction, not an API parameter; this is expected.
