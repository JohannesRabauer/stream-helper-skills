---
name: youtube-tags
description: Generate comma-separated YouTube tags (single set, under 500 characters, no duplicates) for a Stream Producer project. Use when the user asks to "generate YouTube tags", "suggest video tags", or "add SEO tags" for an episode.
---

## Instructions

Generate one comma-separated set of YouTube tags for project `$ARGUMENTS` (project
name, optionally followed by a brief).

## Workflow

1. Resolve the project name (see `topic-ideas` skill for the resolution rule). Create
   `projects/<name>/` + seed `00_project.md` if new.
2. Read `00_project.md` and the context files listed in `references/context-map.md`
   for `youtube-tags`.
3. Generate a single comma-separated line of relevant tags — no duplicates.
4. Apply the normalize/validate rules from `references/validation-rules.md` for
   YouTube tags (trim each tag, keep total length ≤500 chars by dropping trailing
   tags that don't fit, never truncate mid-tag, must not be empty).
5. Write `projects/<name>/02_titles_youtube-tags.md` — a single set, no `## Strategy`
   sections needed (there's only one `default` strategy for this task).
6. Report back the tag line and the file path.
