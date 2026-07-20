// Shared helpers for stream-helper-skills scripts: .env loading, project paths, errors.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const REPO_ROOT = path.resolve(__dirname, '..');
export const PROJECTS_DIR = path.join(REPO_ROOT, 'projects');

let envLoaded = false;

/** Load .env from the repo root once. Real environment variables always win. */
export function loadEnv() {
  if (envLoaded) return;
  const envPath = path.join(REPO_ROOT, '.env');
  if (fs.existsSync(envPath)) {
    // process.loadEnvFile() never overwrites a variable already present in
    // process.env, matching the old Python side's load_dotenv(..., override=False).
    process.loadEnvFile(envPath);
  }
  envLoaded = true;
}

export function env(name, defaultValue = '') {
  loadEnv();
  const value = (process.env[name] ?? '').trim();
  return value || defaultValue;
}

export function requireEnv(name) {
  const value = env(name);
  if (!value) {
    fail(`${name} is not set. Copy .env.example to .env and fill it in, or export ${name}.`);
  }
  return value;
}

/** Print to stderr and exit non-zero. */
export function fail(message, code = 1) {
  console.error(`error: ${message}`);
  process.exit(code);
}

/** Resolve (and create) projects/<name>/. */
export function projectDir(name) {
  if (!name || !name.trim()) {
    fail('No project name given (--project is required).');
  }
  const dir = path.join(PROJECTS_DIR, name.trim());
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function openaiConfig() {
  return {
    apiKey: requireEnv('OPENAI_API_KEY'),
    baseUrl: env('OPENAI_BASE_URL', 'https://api.openai.com').replace(/\/+$/, ''),
    imageModel: env('OPENAI_IMAGE_MODEL', 'gpt-image-1'),
    transcriptionModel: env('OPENAI_TRANSCRIPTION_MODEL', 'whisper-1'),
  };
}
