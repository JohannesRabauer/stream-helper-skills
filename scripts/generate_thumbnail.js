#!/usr/bin/env node
// Generate a thumbnail PNG via the OpenAI Images API and write it directly to disk,
// along with a small sidecar .md noting the prompt/model/timestamp used.
//
// Usage:
//   node scripts/generate_thumbnail.js --project <name> --prompt "<text>"
//   node scripts/generate_thumbnail.js --project <name> --prompt-file <path> [--out <custom.png>]
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { openaiConfig, projectDir, fail } from './common.js';

const IMAGE_TIMEOUT_MS = 3 * 60 * 1000;
const IMAGE_SIZE = '1536x1024'; // gpt-image-1's real size; thumbnail concepts are framed as 16:9 in prose only

function parseCliArgs() {
  const { values } = parseArgs({
    options: {
      project: { type: 'string' },
      prompt: { type: 'string' },
      'prompt-file': { type: 'string' },
      out: { type: 'string' },
    },
  });

  if (!values.project) {
    fail('--project is required.');
  }
  if (!values.prompt === !values['prompt-file']) {
    fail('Exactly one of --prompt or --prompt-file is required.');
  }

  return {
    project: values.project,
    prompt: values.prompt ?? null,
    promptFile: values['prompt-file'] ?? null,
    out: values.out ?? null,
  };
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

async function main() {
  const args = parseCliArgs();
  const cfg = openaiConfig();
  const projDir = projectDir(args.project);

  const rawPrompt = args.promptFile
    ? fs.readFileSync(args.promptFile, 'utf8')
    : args.prompt;
  const prompt = rawPrompt.trim();
  if (!prompt) {
    fail('Prompt is empty.');
  }

  const outPath = args.out ? path.resolve(args.out) : path.join(projDir, '03_thumbnail_image.png');
  const { dir: outDir, name: outName } = path.parse(outPath);
  const sidecarPath = path.join(outDir, `${outName}.md`);

  const url = `${cfg.baseUrl}/v1/images/generations`;
  // No response_format param: gpt-image-1 rejects it (HTTP 400 "Unknown parameter")
  // and always returns b64_json by default, unlike older dall-e models.
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: cfg.imageModel, prompt, size: IMAGE_SIZE }),
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });
  } catch (err) {
    fail(`OpenAI image request failed: ${err.message}`);
  }

  if (response.status >= 400) {
    fail(`OpenAI image generation failed (HTTP ${response.status}): ${await extractError(response)}`);
  }

  const body = await response.json();
  const b64 = body?.data?.[0]?.b64_json;
  if (!b64) {
    fail('OpenAI did not return image data');
  }

  const imageBytes = Buffer.from(b64, 'base64');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, imageBytes);

  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '+00:00');
  const sidecar = `# Thumbnail image\n\n- Model: ${cfg.imageModel}\n- Generated: ${timestamp}\n- Output: ${path.basename(outPath)}\n\n## Prompt used\n\n${prompt}\n`;
  fs.writeFileSync(sidecarPath, sidecar, 'utf8');

  console.log(
    `Generated ${imageBytes.length} bytes -> ${outPath} (sidecar: ${path.basename(sidecarPath)})`,
  );
}

main().catch((err) => {
  fail(err?.message ?? String(err));
});
