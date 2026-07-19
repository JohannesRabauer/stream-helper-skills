#!/usr/bin/env python3
"""
Generate a thumbnail PNG via the OpenAI Images API and write it directly to disk,
along with a small sidecar .md noting the prompt/model/timestamp used.

Usage:
    python scripts/generate_thumbnail.py --project <name> --prompt "<text>"
    python scripts/generate_thumbnail.py --project <name> --prompt-file <path> [--out <custom.png>]
"""
import argparse
import base64
import datetime
from pathlib import Path

import requests

from common import openai_config, project_dir, fail

IMAGE_TIMEOUT_SECONDS = 3 * 60
IMAGE_SIZE = "1536x1024"  # matches the old app's real API call; concepts are framed as 16:9 in prose only


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--project", required=True, help="Project name under projects/")
    prompt_source = parser.add_mutually_exclusive_group(required=True)
    prompt_source.add_argument("--prompt", help="Inline image prompt text")
    prompt_source.add_argument("--prompt-file", help="Path to a file containing the prompt text")
    parser.add_argument("--out", default=None, help="Output PNG path (default: projects/<project>/03_thumbnail_image.png)")
    return parser.parse_args()


def extract_error(response) -> str:
    try:
        body = response.json()
        return body.get("error", {}).get("message", response.text[:300])
    except ValueError:
        return response.text[:300]


def main():
    args = parse_args()
    cfg = openai_config()
    proj_dir = project_dir(args.project)

    if args.prompt_file:
        prompt = Path(args.prompt_file).read_text(encoding="utf-8").strip()
    else:
        prompt = args.prompt.strip()
    if not prompt:
        fail("Prompt is empty.")

    out_path = Path(args.out) if args.out else proj_dir / "03_thumbnail_image.png"
    sidecar_path = out_path.with_suffix(".md")

    url = f"{cfg['base_url']}/v1/images/generations"
    # No response_format param: gpt-image-1 rejects it (HTTP 400 "Unknown parameter")
    # and always returns b64_json by default, unlike older dall-e models.
    try:
        response = requests.post(
            url,
            headers={"Authorization": f"Bearer {cfg['api_key']}"},
            json={
                "model": cfg["image_model"],
                "prompt": prompt,
                "size": IMAGE_SIZE,
            },
            timeout=IMAGE_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        fail(f"OpenAI image request failed: {exc}")

    if response.status_code >= 400:
        fail(f"OpenAI image generation failed (HTTP {response.status_code}): {extract_error(response)}")

    body = response.json()
    b64 = (body.get("data") or [{}])[0].get("b64_json")
    if not b64:
        fail("OpenAI did not return image data")

    image_bytes = base64.b64decode(b64)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(image_bytes)

    timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    sidecar_path.write_text(
        "# Thumbnail image\n\n"
        f"- Model: {cfg['image_model']}\n"
        f"- Generated: {timestamp}\n"
        f"- Output: {out_path.name}\n\n"
        "## Prompt used\n\n"
        f"{prompt}\n",
        encoding="utf-8",
    )

    print(f"Generated {len(image_bytes)} bytes -> {out_path} (sidecar: {sidecar_path.name})")


if __name__ == "__main__":
    main()
