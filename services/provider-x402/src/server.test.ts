import { afterAll, describe, expect, test } from "vitest";

import { healthResponseSchema } from "../../../packages/shared/src/index.js";
import { startProviderServer } from "./server.js";

describe("provider-x402", () => {
  test("serves health JSON", async () => {
    const server = await startProviderServer({
      host: "127.0.0.1",
      port: 0
    });

    try {
      const response = await fetch(`http://127.0.0.1:${server.port}/health`);
      expect(response.ok).toBe(true);

      const payload = healthResponseSchema.parse(await response.json());
      expect(payload.service).toBe("provider-x402");
      expect(payload.evidenceMode).toBe("live");
      expect(payload.details?.protocol).toBe("x402");
    } finally {
      await server.close();
    }
  });

  test("serves the paid report challenge through the dev entrypoint", async () => {
    const server = await startProviderServer({
      host: "127.0.0.1",
      port: 0
    });

    try {
      const response = await fetch(`http://127.0.0.1:${server.port}/paid/report`);
      expect(response.status).toBe(402);
      expect(response.headers.get("x-clear402-challenge-hash")).toMatch(/^[a-f0-9]{64}$/);

      const body = (await response.json()) as any;
      expect(body.code).toBe("PAYMENT_REQUIRED");
      expect(body.details.normalized.evidenceMode).toBe("live");
      expect(body.details.normalized.resource).toBe(`http://127.0.0.1:${server.port}/paid/report`);
      expect(body.details.fallbackDebugPaymentHeader).toBeDefined();
    } finally {
      await server.close();
    }
  });
});
