import { spawn } from "node:child_process";

const concurrency = Number(process.env.MEAL_PLAN_HEAVY_CONCURRENCY ?? 10);
const runsPerWorker = Number(process.env.MEAL_PLAN_HEAVY_RUNS_PER_WORKER ?? 10);

type RunResult = {
  workerId: number;
  runNumber: number;
  exitCode: number | null;
};

function runMealPlan(workerId: number, runNumber: number) {
  return new Promise<RunResult>((resolve) => {
    const label = `[meal-plan-heavy worker=${workerId} run=${runNumber}]`;
    const child = spawn("npm", ["run", "playwright:meal-plan"], {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PLAYWRIGHT_HTML_REPORT: `playwright-report/meal-plan-heavy-${workerId}-${runNumber}`,
        PLAYWRIGHT_OUTPUT_DIR: `test-results/meal-plan-heavy-${workerId}-${runNumber}`,
      },
    });

    child.stdout.on("data", (chunk) => {
      process.stdout.write(`${label} ${chunk}`);
    });

    child.stderr.on("data", (chunk) => {
      process.stderr.write(`${label} ${chunk}`);
    });

    child.on("error", (error) => {
      process.stderr.write(`${label} failed to start: ${error.message}\n`);
      resolve({ workerId, runNumber, exitCode: -1 });
    });

    child.on("close", (exitCode) => {
      if (exitCode !== 0) {
        process.stderr.write(`${label} exited with code ${exitCode}; continuing heavy run\n`);
      }

      resolve({ workerId, runNumber, exitCode });
    });
  });
}

async function runWorker(workerId: number) {
  const results: RunResult[] = [];

  for (let runNumber = 1; runNumber <= runsPerWorker; runNumber += 1) {
    results.push(await runMealPlan(workerId, runNumber));
  }

  return results;
}

const totalRuns = concurrency * runsPerWorker;
console.log(
  `Starting meal-plan heavy run: ${concurrency} concurrent workers × ${runsPerWorker} sequential runs = ${totalRuns} invocations`,
);

const results = (
  await Promise.all(
    Array.from({ length: concurrency }, (_, index) => runWorker(index + 1)),
  )
).flat();

const failedRuns = results.filter((result) => result.exitCode !== 0);
console.log(
  `Completed meal-plan heavy run: ${results.length - failedRuns.length}/${results.length} invocations passed, ${failedRuns.length} failed`,
);

if (failedRuns.length > 0) {
  console.log(
    `Failed invocations: ${failedRuns
      .map((result) => `worker=${result.workerId}/run=${result.runNumber}/exit=${result.exitCode}`)
      .join(", ")}`,
  );
  process.exitCode = 1;
}
