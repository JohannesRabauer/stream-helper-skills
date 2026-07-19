---
name: youtube-description
description: Generate YouTube description variants (technical, beginner-friendly, hype) for a Stream Producer project. Use when the user asks to "write a YouTube description", "generate the video description", or needs description copy for an episode.
---

## Instructions

Write a polished YouTube description per strategy for project `$ARGUMENTS` (project
name, optionally followed by a brief).

## Workflow

1. Resolve the project name (see `topic-ideas` skill for the resolution rule). Create
   `projects/<name>/` + seed `00_project.md` if new.
2. Read `00_project.md` and the context files listed in `references/context-map.md`
   for `youtube-description`.
3. Generate ONE description per strategy — `technical`, `beginner-friendly`, `hype` —
   each a polished YouTube description with clear value, agenda, and call to action.
4. Write `projects/<name>/02_titles_youtube-description.md` following the
   multi-variant format in `references/file-naming.md`.
5. Report back a short summary and the file path.
