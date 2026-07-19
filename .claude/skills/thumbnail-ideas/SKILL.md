---
name: thumbnail-ideas
description: Generate exactly 10 distinct YouTube thumbnail concept ideas (composition, background, colors, text overlay, mood) for a Stream Producer project. Use when the user asks to "brainstorm thumbnail ideas", "generate thumbnail concepts", or wants visual direction before writing image prompts.
---

## Instructions

Generate exactly 10 very different YouTube thumbnail concept ideas for project
`$ARGUMENTS` (project name, optionally followed by a brief).

## Workflow

1. Resolve the project name (see `topic-ideas` skill for the resolution rule). Create
   `projects/<name>/` + seed `00_project.md` if new.
2. Read `00_project.md` (for Host/Guest names and brand profile) and the context
   files listed in `references/context-map.md` for `thumbnail-ideas`.
3. Determine the subject rule from `00_project.md`:
   - If a guest is configured: "the host and the guest must both be clearly visible",
     and use the literal placeholder `{GUEST_NAME}` in any text overlay that names
     the guest (e.g. "Java AI with {GUEST_NAME}").
   - If solo (no guest): "the host must be clearly visible".
4. Generate exactly 10 ideas, each in the strict format from
   `references/validation-rules.md` (`IDEA 01:` block with Composition, Background,
   Color palette, Text overlay, Mood). Every idea needs a short punchy text overlay
   incorporating a simplified version of the project title, respecting the brand
   profile's max overlay word count. Each of the 10 must differ in visual style,
   emotional tone, color palette, and composition.
5. Write `projects/<name>/03_thumbnail_ideas.md` — this keeps its native single-call
   format rather than `## Strategy` sections (see `references/file-naming.md`).
6. Report back a short summary and the file path.
