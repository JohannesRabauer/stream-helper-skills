---
name: linkedin-post
description: Generate LinkedIn post variants (thought-leadership, story-driven, technical insights) for a Stream Producer project. Use when the user asks to "write a LinkedIn post", "announce on LinkedIn", or needs LinkedIn copy for an episode.
---

## Instructions

Write a professional LinkedIn post per strategy for project `$ARGUMENTS` (project
name, optionally followed by a brief).

## Workflow

1. Resolve the project name (see `topic-ideas` skill for the resolution rule). Create
   `projects/<name>/` + seed `00_project.md` if new.
2. Read `00_project.md` and the context files listed in `references/context-map.md`
   for `linkedin-post`.
3. Generate ONE post per strategy — `thought-leadership`, `story-driven`,
   `technical insights` — each a LinkedIn post that feels professional and clear.
4. Write `projects/<name>/04_announce_linkedin.md` following the multi-variant format
   in `references/file-naming.md`.
5. Report back a short summary and the file path.
