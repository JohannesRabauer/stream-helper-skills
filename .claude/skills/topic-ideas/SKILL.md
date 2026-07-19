---
name: topic-ideas
description: Generate stream topic idea variants (pragmatic, beginner-friendly, hype) for a Stream Producer project. Use when the user asks to "generate topic ideas", "brainstorm stream topics", "what should I stream", or is starting to plan a new coding livestream episode.
---

## Instructions

Generate one stream topic idea per strategy for project `$ARGUMENTS` (project name,
optionally followed by a brief describing the episode).

## Workflow

1. Resolve the project name (first token of `$ARGUMENTS`, else infer from cwd if
   inside `projects/<name>/`, else ask). If `projects/<name>/` doesn't exist, create
   it and seed `00_project.md` from the template in `references/file-naming.md`.
2. Read `00_project.md` and the context files listed in
   `references/context-map.md` for `topic-ideas`.
3. If no brief was given in `$ARGUMENTS`, ask the user briefly what kind of episode
   they have in mind (tech stack, format, etc.) — or proceed on project context alone
   if they say to just go.
4. Generate ONE topic idea per strategy — `pragmatic`, `beginner-friendly`, `hype` —
   each including: title, why it matters now, expected audience, concrete coding
   deliverable.
5. Write `projects/<name>/01_plan_topic-ideas.md` following the multi-variant format
   in `references/file-naming.md` (one `## Strategy: <name>` section per variant,
   first one `**Selected: yes**`, others `no`).
6. Report back a short summary (the three titles) and the file path.
