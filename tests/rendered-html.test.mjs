import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`https://songs.example${pathname}`, {
      headers: {
        accept: "text/html",
        host: "songs.example",
        "x-forwarded-host": "songs.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the complete gothic mixtape", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>The Songs Between Us<\/title>/i);
  assert.match(html, /The Songs/);
  assert.match(html, /Between Us/);
  assert.match(html, /Songs kept in the dark/);
  assert.match(html, /Protection/);
  assert.match(html, /Love You to Death/);
  assert.match(html, /For every song you trusted me with/);
  assert.match(html, /name="robots" content="[^"]*noindex/i);
  assert.match(html, /https:\/\/songs\.example\/og\.png/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("ships bounded, animated, and attributed visual assets", async () => {
  const guitar = new URL("../public/models/explorer-guitar.glb", import.meta.url);
  const social = new URL("../public/og.png", import.meta.url);
  const spiderWalk = new URL("../public/images/spider-walk.png", import.meta.url);
  const spiderIdle = new URL("../public/images/spider-idle.png", import.meta.url);

  const [guitarStats, socialStats, walkData, idleData, attribution] =
    await Promise.all([
      stat(guitar),
      stat(social),
      readFile(spiderWalk),
      readFile(spiderIdle),
      readFile(new URL("../ATTRIBUTIONS.md", import.meta.url), "utf8"),
    ]);

  assert.ok(guitarStats.size < 500_000, "guitar model exceeds 500 KB");
  assert.ok(socialStats.size < 1_500_000, "social image exceeds 1.5 MB");
  assert.ok(walkData.includes(Buffer.from("acTL")), "walk PNG is not animated");
  assert.ok(idleData.includes(Buffer.from("acTL")), "idle PNG is not animated");
  assert.match(attribution, /PixelMotion4096/);
  assert.match(attribution, /CC0 1\.0 Universal/);
  assert.match(attribution, /OpenAI ImageGen/);
});

test("does not expose starter preview or database surfaces", async () => {
  await Promise.all([
    assert.rejects(access(new URL("../app/_sites-preview", import.meta.url))),
    assert.rejects(access(new URL("../db", import.meta.url))),
    assert.rejects(access(new URL("../drizzle.config.ts", import.meta.url))),
    assert.rejects(access(new URL("../examples", import.meta.url))),
    access(new URL("../data/songs.ts", import.meta.url)),
    access(projectRoot),
  ]);
});
