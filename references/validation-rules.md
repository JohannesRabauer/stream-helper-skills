# Validation & formatting rules

Ported exactly from the old app's `OutputValidationService` / `AssistantService` so
generated output stays consistent with what the team is used to. Apply these rules
to the content BEFORE writing the output file.

## YouTube tags (`youtube-tags`)

- Format: a single comma-separated line.
- Trim each tag.
- Total length after rebuilding (comma+space joined) must not exceed 500 characters.
  If it would exceed 500, drop trailing tags one at a time until it fits — no
  ellipsis, no truncating mid-tag.
- Must not be empty.

## Hashtags (`hashtags`)

- Every token must start with `#` — add it if missing.
- De-duplicate case-insensitively (keep first occurrence).
- Join with single spaces (not commas).
- Must not be empty.

## Social post (`social-post`)

- Each variant must be ≤280 characters.
- If a generated variant is over 280 characters, truncate it to the first 277
  characters and append `...` (277 + 3 = 280 total). Do this truncation as a
  separate, final step per variant — don't try to write a shorter draft directly,
  truncate whatever was generated.

## YouTube titles (`youtube-titles`)

Single call producing exactly 15 titles, not wrapped in `## Strategy` sections
(see `file-naming.md`). Output format is strict:

- One title per line.
- Exactly one line marked `⭐ RECOMMENDED: <title>`.
- The other 14 lines formatted as `- <title>`.
- No blank lines, no extra commentary.
- Titles must span clearly different angles: contrarian take, practical tutorial,
  beginner framing, advanced deep dive, case study, myth-busting, trend/prediction,
  comparison, mistakes to avoid, storytelling — vary across as many of these as
  possible across the 15.
- De-duplicate case-insensitively; if fewer than 15 unique titles come out, generate
  more rather than padding with near-duplicates.

## Thumbnail ideas (`thumbnail-ideas`)

Single call producing exactly 10 ideas, strict format per idea:

```
IDEA 01: <short memorable idea name>
Composition: <subjects' pose, framing, layout>
Background: <color, scene, or graphic style>
Color palette: <2-4 dominant colors>
Text overlay: <exact overlay text, use {GUEST_NAME} placeholder if a guest is configured in 00_project.md>
Mood: <one adjective>
```

- Aspect ratio target: 16:9 (1280x720) — mention this in Composition notes, it's a
  framing instruction for the human/artist, not an API parameter (see `thumbnail-image`
  skill notes for the real image API's actual size).
- Every idea needs a short, punchy text overlay — respect `Thumbnail max overlay words`
  from `00_project.md` if set (default 4).
- Each of the 10 must be clearly distinct in visual style, emotional tone, color
  palette, and composition — vary across styles like bold graphic, minimalist,
  cinematic, meme-style, split-screen, reaction, dark dramatic, bright energetic,
  text-heavy, icon/emoji-driven.

## Chapters (`chapters`)

- If there's nothing to generate from (shouldn't happen since a transcript is
  required — see `context-map.md`), output must be exactly `00:00 Introduction`.
- If the generated output doesn't already start with `00:00`, prepend
  `00:00 Introduction\n` to it.
- Each non-blank line must match `MM:SS <title>` or `HH:MM:SS <title>`.
- Timestamps must be strictly ascending line-to-line.
- The first line must start at `00:00`.
- Fix and re-check the output against these rules before writing the file — don't
  write output that fails them.

## Everything else

`topic-ideas`, `guest-ideas`, `youtube-description`, `linkedin-post`,
`thumbnail-prompts`, `summary`: no special formatting rules beyond trimming
whitespace — write clean, well-formatted markdown.
