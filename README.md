# Stream Helper Skills

A dynamic, skill-based alternative to the Stream Helper web app. Instead of clicking
through a rigid multi-page UI, each production task (topic ideas, titles, thumbnails,
transcription, ...) is a Claude Code skill you invoke directly, in whatever order suits
the moment. Every skill writes its result to a numbered, human-readable file inside a
per-project folder under `projects/`.

## Install via npm

Add these skills to an existing project with one command:

```
npx stream-helper-skills [target-dir]
```

This copies `.claude/skills/`, `scripts/`, `references/`, and `.env.example` into
`target-dir` (defaults to the current directory). Re-running it later skips files
that already exist (so it won't clobber edits you've made) unless you pass `--force`.

Alternatively, clone this repo directly and open it in Claude Code — both are
equivalent ways to get the same skills.

## Setup

1. **Node.js ≥20.12** on PATH. That's it — this package has zero npm dependencies.
2. **ffmpeg** and **yt-dlp** on PATH (only needed for `/transcribe`).
3. Copy `.env.example` to `.env` and fill in your OpenAI credentials:
   ```
   cp .env.example .env
   ```

## Usage

Open this repo in Claude Code and invoke any skill, optionally passing a project name:

```
/topic-ideas my-spring-ai-episode
/youtube-titles my-spring-ai-episode
/transcribe my-spring-ai-episode --file ./recording.mp4
/chapters my-spring-ai-episode
```

If you omit the project name, Claude will infer it from your current directory (if
you're inside `projects/<name>/`) or ask you.

A project's first skill run creates `projects/<name>/00_project.md` — fill in host/guest
names, brand notes, and preferences there; every skill reads it for context.

## Output files

Each task writes to one file, prefixed with its workflow-stage number:

| Stage | Files |
|---|---|
| 1 Plan | `01_plan_topic-ideas.md`, `01_plan_guest-ideas.md` |
| 2 Titles | `02_titles_youtube-titles.md`, `02_titles_youtube-description.md`, `02_titles_youtube-tags.md` |
| 3 Thumbnail | `03_thumbnail_ideas.md`, `03_thumbnail_prompts.md`, `03_thumbnail_image.png` (+ `.md` sidecar) |
| 4 Announce | `04_announce_linkedin.md`, `04_announce_social.md`, `04_announce_hashtags.md` |
| 5 Transcribe | `05_transcription_transcript.md` |
| 6 Wrap-up | `06_wrapup_chapters.md`, `06_wrapup_summary.md` |

See `references/file-naming.md` for details, `references/context-map.md` for what each
skill reads before generating, and `references/validation-rules.md` for the formatting
rules applied to tags/hashtags/social posts/chapters.

## Regenerating

Re-running a skill overwrites its output file with a fresh result. To keep a prior
version, just ask Claude to refine or append instead — it's a normal file edit, no
special skill needed.
