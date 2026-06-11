import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, describe, expect, test } from "vitest";

import { healthResponseSchema } from "../../../packages/shared/src/index.js";
import { initializeRuntimeDatabase } from "./db/init.js";
import { startRuntimeServer } from "./server.js";

describe("runtime", () => {
  const databaseDir = mkdtempSync(join(tmpdir(), "clear402-runtime-"));
  const databasePath = join(databaseDir, "runtime.sqlite");

  test("initializes the schema", () => {
    const handle = initializeRuntimeDatabase({ databasePath });
    const tables = handle.database
      .prepare(
        `select name, type from sqlite_master where type in ('table', 'view') order by name`
      )
      .all() as Array<{ name: string; type: string }>;

    expect(tables.some((entry) => entry.name === "missions" && entry.type === "table")).toBe(
      true
    );
    expect(
      tables.some((entry) => entry.name === "quotes" && entry.type === "view")
    ).toBe(true);

    handle.database.close();
  });

  test("serves health JSON", async () => {
    const server = await startRuntimeServer({
      host: "127.0.0.1",
      port: 0,
      databasePath
    });

    try {
      const response = await fetch(`http://127.0.0.1:${server.port}/health`);
      expect(response.ok).toBe(true);

      const payload = healthResponseSchema.parse(await response.json());
      expect(payload.service).toBe("runtime");
      expect(payload.evidenceMode).toBe("live");
      expect(payload.details?.databasePath).toBe(databasePath);
    } finally {
      await server.close();
    }
  });
});
