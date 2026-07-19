---
name: summary
description: Generate a factual, blog-ready summary of the episode from the saved transcript of a Stream Producer project. Use when the user asks to "summarize the stream", "write a recap", or "create a blog summary" after a transcript exists. Requires /transcribe to have run first.
---

## Instructions

Produce a factual, blog-ready summary for project `$ARGUMENTS` (project name,
optionally followed by additional focus instructions).

## Workflow

1. Resolve the project name (see `topic-ideas` skill for the resolution rule).
2. **Require** `projects/<name>/05_transcription_transcript.md` to exist. If it's
   missing, STOP and tell the user to run `/transcribe` first — do not guess or
   fabricate a summary from anything else.
3. Read the transcript, `00_project.md`, and the other context files listed in
   `references/context-map.md` for `summary`. If `$ARGUMENTS` included additional
   focus instructions beyond the project name, treat them as extra guidance appended
   after the transcript content.
4. Focus on what was actually said, not interpretation. Include: main points with
   clear speaker attribution where available, what each speaker argued/proposed/
   explained, where speakers agreed, where speakers disagreed (and about what), what
   the audience asked/suggested/challenged, and concrete outcomes/decisions/unresolved
   questions.
5. Stay neutral and evidence-based — do not add advice, speculation, or extra
   conclusions beyond the source. If attribution is unclear, say so instead of
   guessing.
6. Write `projects/<name>/06_wrapup_summary.md` — a single set, no `## Strategy`
   sections needed.
7. Report back a short summary and the file path.
