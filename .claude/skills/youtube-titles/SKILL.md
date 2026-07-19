---
name: youtube-titles
description: Generate exactly 15 YouTube title options spanning different angles, with one marked as recommended, for a Stream Producer project. Use when the user asks to "generate titles", "suggest a YouTube title", "brainstorm video titles", or wants title options for an episode.
---

## Instructions

Generate exactly 15 YouTube title options for project `$ARGUMENTS` (project name,
optionally followed by a brief).

## Workflow

1. Resolve the project name (see `topic-ideas` skill for the resolution rule). Create
   `projects/<name>/` + seed `00_project.md` if new.
2. Read `00_project.md` and the context files listed in `references/context-map.md`
   for `youtube-titles`.
3. Generate exactly 15 titles for the same video. Every title must use a clearly
   different angle so the set spans very different areas — include a spread such as:
   contrarian take, practical tutorial, beginner framing, advanced deep dive, case
   study, myth-busting, trend/prediction, comparison, mistakes to avoid, storytelling.
4. Apply the strict output format from `references/validation-rules.md` (one title
   per line, exactly one `⭐ RECOMMENDED: <title>`, other 14 as `- <title>`, no extra
   lines, de-duplicated case-insensitively).
5. Write `projects/<name>/02_titles_youtube-titles.md` — this is one of the skills
   that keeps its native single-call format rather than `## Strategy` sections (see
   `references/file-naming.md`).
6. Report back the recommended title and the file path.
