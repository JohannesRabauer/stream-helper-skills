---
name: guest-ideas
description: Generate guest candidate profile variants (deep-technical, community-builder, pragmatic practitioner) for a Stream Producer project. Use when the user asks to "find a guest", "suggest guests", "who should I invite", or is planning a co-hosted stream episode.
---

## Instructions

Recommend one guest candidate profile per strategy for project `$ARGUMENTS` (project
name, optionally followed by a brief).

## Workflow

1. Resolve the project name (see `topic-ideas` skill for the resolution rule). Create
   `projects/<name>/` + seed `00_project.md` if new.
2. Read `00_project.md` and the context files listed in `references/context-map.md`
   for `guest-ideas`.
3. If no brief was given, ask what kind of guest they're looking for, or proceed on
   project context alone if told to.
4. Generate ONE guest candidate profile per strategy — `deep-technical`,
   `community-builder`, `pragmatic practitioner` — each including: guest archetype,
   fit reason, conversation angle, outreach hook.
5. Write `projects/<name>/01_plan_guest-ideas.md` following the multi-variant format
   in `references/file-naming.md`.
6. Report back a short summary and the file path.
