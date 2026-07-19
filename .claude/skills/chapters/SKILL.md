---
name: chapters
description: Generate YouTube chapter timestamps from the saved transcript of a Stream Producer project. Use when the user asks to "generate chapters", "add timestamps", or "create a chapter list" after a transcript exists. Requires /transcribe to have run first.
---

## Instructions

Generate YouTube chapters from the transcript for project `$ARGUMENTS` (project name,
optionally followed by additional focus instructions).

## Workflow

1. Resolve the project name (see `topic-ideas` skill for the resolution rule).
2. **Require** `projects/<name>/05_transcription_transcript.md` to exist. If it's
   missing, STOP and tell the user to run `/transcribe` first — do not guess or
   fabricate chapters from anything else.
3. Read the transcript, `00_project.md`, and the other context files listed in
   `references/context-map.md` for `chapters`. If `$ARGUMENTS` included additional
   focus instructions beyond the project name, treat them as extra guidance appended
   after the transcript content.
4. Create chapters from the transcript: one chapter per line, format
   `MM:SS Chapter Title`. First chapter must start at `00:00`, timestamps must ascend.
5. Apply the normalize/validate rules from `references/validation-rules.md` for
   chapters (default to `00:00 Introduction` if nothing else fits; prepend
   `00:00 Introduction` if the output doesn't already start there; fix any line that
   doesn't match `MM:SS `/`HH:MM:SS ` format or breaks ascending order before writing).
6. Write `projects/<name>/06_wrapup_chapters.md` — a single set, no `## Strategy`
   sections needed.
7. Report back the chapter list and the file path.
