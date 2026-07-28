import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));

async function reservePort() {
  const server = createServer();
  server.unref();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const { port } = address;
  server.close();
  await once(server, "close");
  return port;
}

function sha256(data) {
  return createHash("sha256").update(data).digest("hex");
}

async function waitForStartup(child) {
  let output = "";

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error(`Standalone server did not start:\n${output}`)),
      10_000,
    );

    const inspect = (chunk) => {
      output += chunk.toString();
      if (!output.includes("Production server running")) return;
      clearTimeout(timeout);
      resolve();
    };

    child.stdout.on("data", inspect);
    child.stderr.on("data", inspect);
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("exit", (code, signal) => {
      if (output.includes("Production server running")) return;
      clearTimeout(timeout);
      reject(
        new Error(
          `Standalone server exited before startup (${code ?? signal}):\n${output}`,
        ),
      );
    });
  });
}

test(
  "standalone server delivers complete visual assets",
  { timeout: 30_000 },
  async () => {
    const port = await reservePort();
    const child = spawn(process.execPath, ["dist/standalone/server.js"], {
      cwd: projectRoot,
      env: {
        ...process.env,
        HOST: "127.0.0.1",
        NODE_ENV: "production",
        PORT: String(port),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    try {
      await waitForStartup(child);

      const assets = [
        {
          pathname: "/models/explorer-guitar.glb",
          source: "public/models/explorer-guitar.glb",
        },
        {
          pathname: "/images/guitar-poster.webp",
          source: "public/images/guitar-poster.webp",
        },
        {
          pathname: "/og.png",
          source: "public/og.png",
        },
      ];

      for (const asset of assets) {
        const [source, response] = await Promise.all([
          readFile(new URL(`../${asset.source}`, import.meta.url)),
          fetch(`http://127.0.0.1:${port}${asset.pathname}`),
        ]);

        assert.equal(response.status, 200, `${asset.pathname} did not return 200`);
        const body = Buffer.from(await response.arrayBuffer());
        assert.equal(
          Number(response.headers.get("content-length")),
          source.length,
          `${asset.pathname} has an incorrect content length`,
        );
        assert.equal(
          sha256(body),
          sha256(source),
          `${asset.pathname} was truncated or changed in transit`,
        );
      }
    } finally {
      child.kill("SIGTERM");
      await Promise.race([
        once(child, "exit"),
        new Promise((resolve) => setTimeout(resolve, 2_000)),
      ]);
    }
  },
);
