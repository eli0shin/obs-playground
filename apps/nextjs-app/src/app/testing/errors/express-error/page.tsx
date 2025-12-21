export const dynamic = "force-dynamic";

const EXPRESS_URL = process.env.EXPRESS_BASE_URL || "http://localhost:3001";

async function callFailingExpressEndpoint() {
  const response = await fetch(`${EXPRESS_URL}/api/error/test`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Express API returned ${response.status}: ${response.statusText}`,
    );
  }

  return await response.json();
}

export default async function ExpressErrorPage() {
  await callFailingExpressEndpoint();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            This page should never render
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            If you see this, something went wrong with the Express error test
          </p>
        </article>
      </div>
    </div>
  );
}
