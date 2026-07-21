import { spawn } from "node:child_process";

const concurrency = Number(process.env.MEAL_PLAN_FRUSTRATED_CONCURRENCY ?? 10);
const runsPerWorker = Number(process.env.MEAL_PLAN_FRUSTRATED_RUNS_PER_WORKER ?? 2);

type RunResult = {
  workerId: number;
  runNumber: number;
  exitCode: number | null;
};

function runFrustratedMealPlan(workerId: number, runNumber: number) {
  return new Promise<RunResult>((resolve) => {
    const label = `[meal-plan-frustrated worker=${workerId} run=${runNumber}]`;
    const child = spawn("npm", ["run", "playwright:meal-plan:frustrated"], {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PLAYWRIGHT_HTML_REPORT: `playwright-report/meal-plan-frustrated-${workerId}-${runNumber}`,
        PLAYWRIGHT_OUTPUT_DIR: `test-results/meal-plan-frustrated-${workerId}-${runNumber}`,
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
        process.stderr.write(`${label} exited with code ${exitCode}; continuing frustrated heavy run\n`);
      }

      resolve({ workerId, runNumber, exitCode });
    });
  });
}

async function runWorker(workerId: number) {
  const results: RunResult[] = [];

  for (let runNumber = 1; runNumber <= runsPerWorker; runNumber += 1) {
    results.push(await runFrustratedMealPlan(workerId, runNumber));
  }

  return results;
}

const totalRuns = concurrency * runsPerWorker;
console.log(
  `Starting frustrated meal-plan heavy run: ${concurrency} concurrent workers × ${runsPerWorker} sequential runs = ${totalRuns} invocations`,
);

const results = (
  await Promise.all(
    Array.from({ length: concurrency }, (_, index) => runWorker(index + 1)),
  )
).flat();

const failedRuns = results.filter((result) => result.exitCode !== 0);
console.log(
  `Completed frustrated meal-plan heavy run: ${results.length - failedRuns.length}/${results.length} invocations passed, ${failedRuns.length} failed`,
);

if (failedRuns.length > 0) {
  console.log(
    `Failed invocations: ${failedRuns
      .map((result) => `worker=${result.workerId}/run=${result.runNumber}/exit=${result.exitCode}`)
      .join(", ")}`,
  );
}
