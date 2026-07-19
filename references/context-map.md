# Context map

Before generating, each skill should `Read` `projects/<name>/00_project.md` (if it
exists) plus the specific earlier files listed below for its skill — this replaces
the old app's database-driven "prior artifact" injection. Skip silently any file that
doesn't exist yet (a task can be run standalone before its usual predecessors).

Glob shorthand used below: `01_plan_*` = `01_plan_topic-ideas.md` +
`01_plan_guest-ideas.md`; `02_titles_*` = all three `02_titles_*.md` files;
`04_announce_*` = all three `04_announce_*.md` files; `06_wrapup_*` = both
`06_wrapup_*.md` files.

| Skill | Reads (besides `00_project.md`) |
|---|---|
| `topic-ideas` | `01_plan_*` (its own sibling, for cross-consistency between topic and guest ideas) |
| `guest-ideas` | `01_plan_*` |
| `youtube-titles` | `01_plan_*`, `02_titles_*` |
| `youtube-description` | `01_plan_*`, `02_titles_*` |
| `youtube-tags` | `01_plan_*`, `02_titles_*` |
| `thumbnail-ideas` | `01_plan_*`, `02_titles_*`, `04_announce_*` |
| `thumbnail-prompts` | `01_plan_*`, `02_titles_*`, `04_announce_*`, `03_thumbnail_ideas.md`, `03_thumbnail_prompts.md` (itself, for consistency across regenerations) |
| `thumbnail-image` | none — takes an explicit prompt (usually copied from a `03_thumbnail_prompts.md` variant) rather than reading context itself |
| `linkedin-post` | `01_plan_*`, `02_titles_*`, `04_announce_*` |
| `social-post` | `01_plan_*`, `02_titles_*`, `04_announce_*` |
| `hashtags` | `01_plan_*`, `02_titles_*`, `04_announce_*` |
| `transcribe` | none — pure audio/video-to-text, no text context needed |
| `chapters` | **required**: `05_transcription_transcript.md` (stop and tell the user to run `/transcribe` first if missing — never fabricate). Optional: `01_plan_*`, `02_titles_*`, `03_thumbnail_prompts.md`, `06_wrapup_*` |
| `summary` | same as `chapters` |

This is ported 1:1 from the old app's `InstructionComposer.relevantContextCategories`
switch (`stream-helper/src/main/java/com/streamhelper/app/service/InstructionComposer.java`),
minus the now-mechanical/no-context `transcribe` case (the old app injected topic/guest
idea context into transcript generation too, but that only mattered because the old
transcript flow was itself an LLM-mediated step; the new `transcribe` skill is a
straight script call with no text generation, so it's dropped here).
