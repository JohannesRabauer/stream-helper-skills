#!/usr/bin/env node
// Transcribe a local media file or a YouTube URL into a plain-text transcript,
// using the OpenAI Whisper API directly (no Python dependency).
//
// Usage:
//   node scripts/transcribe.js --project <name> --file <path> [--language en]
//   node scripts/transcribe.js --project <name> --youtube-url <url> [--language en]
//   node scripts/transcribe.js --project <name> --file <path> --out <custom/path.md>
//
// Writes the transcript directly to disk (default:
// projects/<project>/05_transcription_transcript.md) and prints a short summary to
// stdout. Never prints the transcript itself to stdout.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { openaiConfig, projectDir, fail } from './common.js';

const OPENAI_MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const OPENAI_CHUNK_SECONDS = 540;
const YOUTUBE_EXTRACTOR_ARGS = 'youtube:player_client=android,web';
const YTDLP_TIMEOUT_MS = 15 * 60 * 1000;
const FFMPEG_TIMEOUT_MS = 10 * 60 * 1000;
const WHISPER_TIMEOUT_MS = 5 * 60 * 1000;

function parseCliArgs() {
  const { values } = parseArgs({
    options: {
      project: { type: 'string' },
      file: { type: 'string' },
      'youtube-url': { type: 'string' },
      language: { type: 'string' },
      out: { type: 'string' },
    },
  });

  if (!values.project) {
    fail('--project is required.');
  }
  // XOR: exactly one of --file / --youtube-url must be given.
  if (!values.file === !values['youtube-url']) {
    fail('Exactly one of --file or --youtube-url is required.');
  }

  return {
    project: values.project,
    file: values.file ?? null,
    youtubeUrl: values['youtube-url'] ?? null,
    language: values.language ?? null,
    out: values.out ?? null,
  };
}

function commandExists(cmd) {
  const checker = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(checker, [cmd], { encoding: 'utf8' });
  return result.status === 0;
}

function tail(text, lines) {
  return text.split('\n').slice(-lines).join('\n');
}

/** Runs a subprocess synchronously, capturing combined stdout+stderr in memory
 *  (no temp log file needed — the tempdir this runs inside is discarded either way). */
function run(command, args, timeoutMs, description) {
  const result = spawnSync(command, args, { timeout: timeoutMs, encoding: 'utf8' });

  if (result.error) {
    if (result.error.code === 'ENOENT') {
      fail(`${description} failed: '${command}' not found on PATH`);
    }
    if (result.error.code === 'ETIMEDOUT') {
      fail(`${description} timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
    fail(`${description} failed: ${result.error.message}`);
  }

  const combined = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.status !== 0) {
    fail(`${description} failed (exit ${result.status}):\n${tail(combined, 40)}`);
  }
}

function downloadYoutubeAudio(url, tmpDir) {
  if (!commandExists('yt-dlp')) {
    fail('yt-dlp is not on PATH. Install it (pip install yt-dlp) and retry.');
  }
  const args = [
    '--no-update', '--no-progress', '--retries', '3', '--fragment-retries', '3',
    '--retry-sleep', '2', '--force-ipv4', '--js-runtimes', 'node,deno',
    '--extractor-args', YOUTUBE_EXTRACTOR_ARGS, '-x', '--audio-format', 'mp3',
    '-o', path.join(tmpDir, '%(id)s.%(ext)s'), url,
  ];
  run('yt-dlp', args, YTDLP_TIMEOUT_MS, 'yt-dlp download');

  const downloaded = fs.readdirSync(tmpDir)
    .map((name) => path.join(tmpDir, name))
    .filter((p) => fs.statSync(p).isFile());
  if (downloaded.length === 0) {
    fail('yt-dlp reported success but produced no audio file');
  }
  downloaded.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return downloaded[0];
}

function chunkAudio(inputPath, tmpDir) {
  if (!commandExists('ffmpeg')) {
    fail('ffmpeg is not on PATH. Install it and retry (needed to split audio over 25MB).');
  }
  const chunkDir = path.join(tmpDir, 'chunks');
  fs.mkdirSync(chunkDir, { recursive: true });
  const outputPattern = path.join(chunkDir, 'chunk-%03d.mp3');
  const args = [
    '-hide_banner', '-loglevel', 'error', '-y', '-i', inputPath, '-vn',
    '-ac', '1', '-ar', '16000', '-codec:a', 'libmp3lame', '-b:a', '48k',
    '-f', 'segment', '-segment_time', String(OPENAI_CHUNK_SECONDS), outputPattern,
  ];
  run('ffmpeg', args, FFMPEG_TIMEOUT_MS, 'ffmpeg chunking');

  const chunks = fs.readdirSync(chunkDir)
    .filter((name) => name.startsWith('chunk-') && name.endsWith('.mp3'))
    .sort()
    .map((name) => path.join(chunkDir, name));
  if (chunks.length === 0) {
    fail('ffmpeg reported success but produced no chunk files');
  }
  return chunks;
}

async function extractError(response) {
  const raw = await response.text();
  try {
    const body = JSON.parse(raw);
    return body?.error?.message ?? raw.slice(0, 300);
  } catch {
    return raw.slice(0, 300);
  }
}

async function transcribeChunk(cfg, data, filename, language) {
  if (data.length > OPENAI_MAX_AUDIO_BYTES) {
    fail(`${filename} is ${data.length} bytes, still over the 25MB OpenAI limit after chunking`);
  }

  const form = new FormData();
  form.set('model', cfg.transcriptionModel);
  form.set('response_format', 'verbose_json');
  form.set('timestamp_granularities[]', 'segment');
  form.set('file', new Blob([data], { type: 'audio/mpeg' }), filename);
  if (language) {
    form.set('language', language);
  }

  const url = `${cfg.baseUrl}/v1/audio/transcriptions`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
      body: form,
      signal: AbortSignal.timeout(WHISPER_TIMEOUT_MS),
    });
  } catch (err) {
    fail(`OpenAI transcription request failed: ${err.message}`);
  }

  if (response.status >= 400) {
    fail(`OpenAI transcription failed (HTTP ${response.status}): ${await extractError(response)}`);
  }

  const body = await response.json();
  const segments = body.segments;
  if (!segments || segments.length === 0) {
    const text = (body.text ?? '').trim();
    return text ? [{ start: 0.0, end: 0.0, speaker: 'Unknown', text }] : [];
  }

  const entries = [];
  for (const segment of segments) {
    const text = (segment.text ?? '').trim();
    if (!text) continue;
    const start = Number(segment.start ?? 0.0);
    entries.push({
      start,
      end: Number(segment.end ?? start),
      speaker: segment.speaker ?? 'Unknown',
      text,
    });
  }
  return entries;
}

function formatTimestamp(secondsValue) {
  const totalSeconds = Math.max(0, Math.floor(secondsValue));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

function renderTranscript(entries) {
  const lines = entries.map(
    (e) => `[${formatTimestamp(e.start)} - ${formatTimestamp(e.end)}] ${e.speaker}: ${e.text}`,
  );
  return lines.length ? lines.join('\n') + '\n' : '';
}

async function main() {
  const args = parseCliArgs();
  const cfg = openaiConfig();
  const projDir = projectDir(args.project);
  const outPath = args.out
    ? path.resolve(args.out)
    : path.join(projDir, '05_transcription_transcript.md');

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stream-helper-skills-transcribe-'));
  const allEntries = [];
  try {
    let audioPath;
    if (args.youtubeUrl) {
      audioPath = downloadYoutubeAudio(args.youtubeUrl, tmpDir);
    } else {
      audioPath = path.resolve(args.file);
      if (!fs.existsSync(audioPath) || !fs.statSync(audioPath).isFile()) {
        fail(`File not found: ${audioPath}`);
      }
    }

    const size = fs.statSync(audioPath).size;
    const chunkPaths = size > OPENAI_MAX_AUDIO_BYTES ? chunkAudio(audioPath, tmpDir) : [audioPath];

    for (let index = 0; index < chunkPaths.length; index += 1) {
      const chunkPath = chunkPaths[index];
      const data = fs.readFileSync(chunkPath);
      const entries = await transcribeChunk(cfg, data, path.basename(chunkPath), args.language);
      const offset = index * OPENAI_CHUNK_SECONDS;
      for (const entry of entries) {
        entry.start += offset;
        entry.end += offset;
      }
      allEntries.push(...entries);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  if (allEntries.length === 0) {
    fail('Transcription produced no text. Check the input file/URL and try again.');
  }

  const transcriptText = renderTranscript(allEntries);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, transcriptText, 'utf8');
  console.log(
    `Transcribed ${allEntries.length} segments (${transcriptText.length} chars) -> ${outPath}`,
  );
}

main().catch((err) => {
  fail(err?.message ?? String(err));
});
