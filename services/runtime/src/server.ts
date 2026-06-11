import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { pathToFileURL } from "node:url";

import {
  healthResponseSchema,
  problemJsonSchema,
  type HealthResponse,
  type ProblemJSON
} from "../../../packages/shared/src/index.js";
import { initializeRuntimeDatabase } from "./db/init.js";

const runtimeVersion = "0.1.0";
const runtimeServiceName = "runtime";
const runtimePort = Number.parseInt(process.env.RUNTIME_PORT ?? "4000", 10);
const runtimeHost = process.env.RUNTIME_HOST ?? "127.0.0.1";
const runtimeDatabasePath = process.env.CLEAR402_RUNTIME_DATABASE_PATH;

function jsonResponse(
  response: ServerResponse,
  statusCode: number,
  payload: HealthResponse | ProblemJSON
) {
  const body = JSON.stringify(payload);
  response.statusCode = statusCode;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(body);
}

function buildRuntimeHealth(databasePath: string): HealthResponse {
  return healthResponseSchema.parse({
    service: runtimeServiceName,
    status: "ok",
    evidenceMode: "live",
    timestamp: new Date().toISOString(),
    version: runtimeVersion,
    details: {
      databasePath,
      schemaVersion: 1
    }
  });
}

function buildProblem(code: string, message: string, details?: Record<string, unknown>) {
  return problemJsonSchema.parse({
    code,
    message,
    details
  });
}

function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  databasePath: string
) {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (request.method === "GET" && url.pathname === "/health") {
    jsonResponse(response, 200, buildRuntimeHealth(databasePath));
    return;
  }

  jsonResponse(
    response,
    404,
    buildProblem("NOT_FOUND", "Route not found", { path: url.pathname })
  );
}

export function startRuntimeServer(options: {
  host?: string;
  port?: number;
  databasePath?: string;
} = {}) {
  const host = options.host ?? runtimeHost;
  const port = options.port ?? runtimePort;
  const databaseOptions: { databasePath?: string } = {};
  const selectedDatabasePath = options.databasePath ?? runtimeDatabasePath;

  if (selectedDatabasePath) {
    databaseOptions.databasePath = selectedDatabasePath;
  }

  const { database, databasePath } = initializeRuntimeDatabase(databaseOptions);

  const server = createServer((request, response) => {
    handleRequest(request, response, databasePath);
  });

  return new Promise<{
    server: ReturnType<typeof createServer>;
    databasePath: string;
    close: () => Promise<void>;
    port: number;
  }>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      const actualPort =
        typeof address === "object" && address !== null ? address.port : port;

      resolve({
        server,
        databasePath,
        port: actualPort,
        close: async () => {
          await new Promise<void>((closeResolve, closeReject) => {
            server.close((error) => {
              database.close();
              if (error) {
                closeReject(error);
                return;
              }

              closeResolve();
            });
          });
        }
      });
    });
  });
}

const mainPath = process.argv[1] ? pathToFileURL(process.argv[1]).href : null;
const isMainModule = mainPath !== null && import.meta.url === mainPath;

if (isMainModule) {
  const started = await startRuntimeServer();
  console.log(
    JSON.stringify(
      {
        service: runtimeServiceName,
        status: "listening",
        port: started.port,
        databasePath: started.databasePath
      },
      null,
      2
    )
  );
}
