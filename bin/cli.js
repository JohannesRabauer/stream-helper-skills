#!/usr/bin/env node
// Installer: copies the stream-helper-skills Claude Code skills, scripts, and
// reference docs into a target project directory.
//
// Usage:
//   npx stream-helper-skills [target-dir] [--dir <path>] [--force]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');

// Deliberately excludes projects/ — that's this repo's own demo content,
// not something an installed target should receive.
const INSTALL_ITEMS = [
  path.join('.claude', 'skills'),
  'scripts',
  'references',
  '.env.example',
];

function parseCliArgs() {
  const { values, positionals } = parseArgs({
    options: {
      dir: { type: 'string' },
      force: { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
    allowPositionals: true,
  });

  return {
    targetDir: path.resolve(values.dir ?? positionals[0] ?? process.cwd()),
    force: values.force,
    help: values.help,
  };
}

function printHelp() {
  console.log(`stream-helper-skills installer

Usage:
  npx stream-helper-skills [target-dir] [options]

Installs the Stream Helper Claude Code skills (.claude/skills), the
supporting scripts/, references/, and .env.example into a target project
directory (default: current directory).

Options:
  --dir <path>   Target directory (same as the positional argument)
  --force        Overwrite files that already exist in the target
  --help         Show this help message
`);
}

// Default is "warn and skip existing files" rather than silently overwriting:
// this may be an *update* of an already-installed project where the user has
// edited a SKILL.md, and clobbering that silently would be a nasty surprise.
// --force opts into overwrite explicitly.
function copyEntry(srcAbs, destAbs, { force, targetDir }) {
  fs.cpSync(srcAbs, destAbs, {
    recursive: true,
    filter: (source, destination) => {
      if (fs.statSync(source).isDirectory()) return true;
      if (!force && fs.existsSync(destination)) {
        console.warn(`  skip (exists): ${path.relative(targetDir, destination)}`);
        return false;
      }
      return true;
    },
  });
}

function main() {
  const { targetDir, force, help } = parseCliArgs();
  if (help) {
    printHelp();
    return;
  }

  console.log(`Installing stream-helper-skills into ${targetDir}`);
  fs.mkdirSync(targetDir, { recursive: true });

  for (const item of INSTALL_ITEMS) {
    const srcAbs = path.join(PACKAGE_ROOT, item);
    const destAbs = path.join(targetDir, item);
    if (!fs.existsSync(srcAbs)) {
      console.warn(`  warning: expected source missing, skipping: ${item}`);
      continue;
    }
    copyEntry(srcAbs, destAbs, { force, targetDir });
  }

  console.log('\nDone.\n');
  console.log('Next steps:');
  if (targetDir !== process.cwd()) {
    console.log(`  1. cd ${path.relative(process.cwd(), targetDir) || '.'}`);
  }
  console.log('  - Copy .env.example to .env and fill in OPENAI_API_KEY (adjust OPENAI_BASE_URL / model names if needed).');
  console.log('  - Install ffmpeg and yt-dlp on PATH if you plan to use /transcribe.');
  console.log('    (These remain required external binaries — this package itself has zero npm dependencies.)');
  console.log('  - Open the target directory in Claude Code and try a skill, e.g. /topic-ideas my-episode');
}

main();
