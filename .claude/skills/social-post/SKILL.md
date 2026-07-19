---
name: social-post
description: Generate short social post variants (technical, beginner-friendly, hype), each capped at 280 characters, for a Stream Producer project. Use when the user asks to "write a tweet", "post on X", "generate a social post", or needs short-form social copy for an episode.
---

## Instructions

Write a short X/Twitter-style social post per strategy for project `$ARGUMENTS`
(project name, optionally followed by a brief).

## Workflow

1. Resolve the project name (see `topic-ideas` skill for the resolution rule). Create
   `projects/<name>/` + seed `00_project.md` if new.
2. Read `00_project.md` and the context files listed in `references/context-map.md`
   for `social-post`.
3. Generate ONE post per strategy — `technical`, `beginner-friendly`, `hype` — each
   a short social post, max 280 characters.
4. Apply the truncation rule from `references/validation-rules.md`: if a generated
   variant is over 280 characters, cut it to the first 277 characters and append
   `...` as a final step (don't just aim short — truncate whatever came out).
5. Write `projects/<name>/04_announce_social.md` following the multi-variant format
   in `references/file-naming.md`.
6. Report back a short summary and the file path.
