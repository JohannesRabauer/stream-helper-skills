---
name: hashtags
description: Generate a single line of relevant, de-duplicated hashtags for YouTube and LinkedIn for a Stream Producer project. Use when the user asks to "generate hashtags", "suggest hashtags", or needs hashtags for an episode announcement.
---

## Instructions

Generate one line of relevant hashtags for project `$ARGUMENTS` (project name,
optionally followed by a brief).

## Workflow

1. Resolve the project name (see `topic-ideas` skill for the resolution rule). Create
   `projects/<name>/` + seed `00_project.md` if new.
2. Read `00_project.md` and the context files listed in `references/context-map.md`
   for `hashtags`.
3. Generate one line of relevant hashtags for YouTube and LinkedIn. Avoid duplicates.
4. Apply the normalize/validate rules from `references/validation-rules.md` for
   hashtags (every token starts with `#`, de-duplicate case-insensitively, join with
   single spaces, must not be empty).
5. Write `projects/<name>/04_announce_hashtags.md` — a single set, no `## Strategy`
   sections needed.
6. Report back the hashtag line and the file path.
