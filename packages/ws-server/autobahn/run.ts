import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { AUTOBAHN_LIMITS, startEchoServer } from "./echo-server";
import { DEFAULT_LIMITS } from "../src/types";

const strict = process.argv.includes("strict");
const here = dirname(fileURLToPath(import.meta.url));
const reportsDir = resolve(here, strict ? "reports-strict" : "reports");
const specFile = strict ? "fuzzingclient-strict.json" : "fuzzingclient.json";

interface CaseResult {
  behavior: string;
  behaviorClose: string;
  duration: number;
  remoteCloseCode: number | null;
}

function runDocker(): Promise<number> {
  return new Promise((resolveExit, rejectExit) => {
    const child = spawn(
      "docker",
      [
        "run",
        "--rm",
        "--network",
        "host",
        "--user",
        `${process.getuid?.() ?? 0}:${process.getgid?.() ?? 0}`,
        "-v",
        `${here}:/config:ro`,
        "-v",
        `${reportsDir}:/reports`,
        "crossbario/autobahn-testsuite",
        "wstest",
        "-m",
        "fuzzingclient",
        "-s",
        `/config/${specFile}`,
      ],
      { stdio: ["ignore", "inherit", "inherit"] },
    );
    child.on("error", rejectExit);
    child.on("exit", (code) => resolveExit(code ?? 1));
  });
}

async function main(): Promise<void> {
  rmSync(reportsDir, { recursive: true, force: true });
  mkdirSync(reportsDir, { recursive: true });

  const { server } = await startEchoServer(9001, strict ? DEFAULT_LIMITS : AUTOBAHN_LIMITS);
  process.stdout.write(
    `echo server listening on 127.0.0.1:9001 (${strict ? "shipping limits" : "relaxed limits"})\n`,
  );

  const exitCode = await runDocker();
  server.stop();

  if (exitCode !== 0) {
    process.stdout.write(`wstest exited with ${exitCode}\n`);
  }

  const index = JSON.parse(readFileSync(resolve(reportsDir, "index.json"), "utf8")) as Record<
    string,
    Record<string, CaseResult>
  >;
  const agent = Object.keys(index)[0];
  if (agent === undefined) {
    process.stdout.write("no autobahn agent results\n");
    process.exit(1);
  }
  const results = index[agent]!;

  const buckets = new Map<string, Map<string, number>>();
  const failures: string[] = [];

  for (const caseId of Object.keys(results)) {
    const result = results[caseId]!;
    const section = caseId.split(".")[0]!;
    const bucket = buckets.get(section) ?? new Map<string, number>();
    const behavior =
      result.behavior === "OK" && result.behaviorClose !== "OK" && result.behaviorClose !== "INFORMATIONAL"
        ? `CLOSE_${result.behaviorClose}`
        : result.behavior;
    bucket.set(behavior, (bucket.get(behavior) ?? 0) + 1);
    buckets.set(section, bucket);
    if (behavior === "FAILED" || behavior === "CLOSE_FAILED" || behavior === "WRONG CODE") {
      failures.push(`${caseId}: behavior=${result.behavior} close=${result.behaviorClose}`);
    }
  }

  const sections = [...buckets.keys()].sort((a, b) => Number(a) - Number(b));
  process.stdout.write("\nAutobahn results by section\n");
  for (const section of sections) {
    const bucket = buckets.get(section)!;
    const parts = [...bucket.entries()].map(([behavior, count]) => `${behavior}=${count}`);
    process.stdout.write(`  ${section}: ${parts.join(" ")}\n`);
  }

  if (failures.length > 0) {
    process.stdout.write(`\n${failures.length} failing cases\n`);
    for (const failure of failures) process.stdout.write(`  ${failure}\n`);
    process.exit(1);
  }

  process.stdout.write("\nno failing cases\n");
  process.exit(0);
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exit(1);
});
