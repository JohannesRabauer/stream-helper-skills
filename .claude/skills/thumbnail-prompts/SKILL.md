---
name: thumbnail-prompts
description: Turn a chosen thumbnail idea into image-generation prompt variants (high-contrast, clean-professional, bold-hype) for a Stream Producer project. Use when the user asks to "write a thumbnail prompt", "turn this idea into an image prompt", or is preparing input for /thumbnail-image.
---

## Instructions

Produce a thumbnail design prompt per strategy for project `$ARGUMENTS` (project
name, optionally followed by which idea from `03_thumbnail_ideas.md` to use).

## Workflow

1. Resolve the project name (see `topic-ideas` skill for the resolution rule). Create
   `projects/<name>/` + seed `00_project.md` if new.
2. Read `00_project.md` and the context files listed in `references/context-map.md`
   for `thumbnail-prompts`, including `03_thumbnail_ideas.md` if present — if the
   user didn't specify which idea to base this on, pick the most fitting one (or ask).
3. Generate ONE image-generation prompt per strategy — `high-contrast`,
   `clean-professional`, `bold-hype` — each including: composition, foreground
   subject, background style, text overlay guidance, color cues. Keep title words
   concise and high impact.
4. Write `projects/<name>/03_thumbnail_prompts.md` following the multi-variant format
   in `references/file-naming.md`.
5. Report back a short summary, the file path, and mention that `/thumbnail-image`
   can now be run with one of these prompts to generate the actual PNG.
