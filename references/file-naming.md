# File naming convention

Every skill operates on `projects/<name>/` and writes exactly one output artifact,
prefixed with its workflow-stage number (matching the order a stream is actually
produced in, not alphabetical-by-task-name):

| Stage | Skill | Output file |
|---|---|---|
| 1 Plan | `topic-ideas` | `01_plan_topic-ideas.md` |
| 1 Plan | `guest-ideas` | `01_plan_guest-ideas.md` |
| 2 Titles | `youtube-titles` | `02_titles_youtube-titles.md` |
| 2 Titles | `youtube-description` | `02_titles_youtube-description.md` |
| 2 Titles | `youtube-tags` | `02_titles_youtube-tags.md` |
| 3 Thumbnail | `thumbnail-ideas` | `03_thumbnail_ideas.md` |
| 3 Thumbnail | `thumbnail-prompts` | `03_thumbnail_prompts.md` |
| 3 Thumbnail | `thumbnail-image` | `03_thumbnail_image.png` + sidecar `03_thumbnail_image.md` |
| 4 Announce | `linkedin-post` | `04_announce_linkedin.md` |
| 4 Announce | `social-post` | `04_announce_social.md` |
| 4 Announce | `hashtags` | `04_announce_hashtags.md` |
| 5 Transcribe | `transcribe` | `05_transcription_transcript.md` |
| 6 Wrap-up | `chapters` | `06_wrapup_chapters.md` |
| 6 Wrap-up | `summary` | `06_wrapup_summary.md` |

`00_project.md` is the one file that isn't stage-numbered (it sorts first anyway) —
see below.

## Multi-variant files

Most tasks generate 2-3 variants (different strategies/angles). Write ALL of them into
the single output file as separate sections, rather than separate files per variant —
simpler to read and git-diff. Format:

```markdown
# <Task title>

## Strategy: <name>
**Selected: yes**

<content>

## Strategy: <name 2>
**Selected: no**

<content>
```

Default the FIRST variant to `**Selected: yes**`, all others `no` — this mirrors the
old app's "first variant is recommended by default" behavior. The user (or Claude,
on request) can flip which one is selected by editing the marker directly; there is
no separate "finalize" step or command.

`youtube-titles` and `thumbnail-ideas` are exceptions: each is a single call producing
many items in one strict native format (15 titles / 10 ideas). Write that native
format directly — don't wrap it in `## Strategy` sections.

## Regenerating

Re-running a skill overwrites its file with a completely fresh result by default. If
the user wants to keep the old content, they can ask Claude to append/refine instead —
that's a normal edit, not a special skill behavior.

## `00_project.md`

Created automatically by whichever skill runs first for a new project. Template:

```markdown
# Project: <name>

## Participants
- Host: <display name, optional>
- Guest: <display name, optional — leave blank if solo>

## Brand profile
- Preferred colors:
- Required words:
- Banned words:
- Thumbnail max overlay words: 4

## Notes
<freeform notes>
```

Every skill reads this file (if present) for host/guest names, brand constraints, and
notes — same idea as the old app's global+project config, collapsed into one file.
