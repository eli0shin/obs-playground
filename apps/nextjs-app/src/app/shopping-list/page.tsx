import Link from 'next/link';

const EXPRESS_URL = process.env.EXPRESS_URL || 'http://localhost:3001';

type ShoppingListItem = {
  ingredientId: string;
  name: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalCost: number;
  inStock: boolean;
};

type ShoppingListResponse = {
  items: ShoppingListItem[];
  totalCost: number;
  outOfStock: string[];
  recipeCount: number;
};

async function generateShoppingList(recipeIds: string[]) {
  try {
    const response = await fetch(`${EXPRESS_URL}/shopping-list/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipeIds }),
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to generate shopping list: ${response.status}`);
    }

    const data = await response.json();

    if ('error' in data) {
      throw new Error(data.error);
    }

    return data as ShoppingListResponse;
  } catch (error) {
    console.error('Error generating shopping list:', error);
    // Return empty shopping list on error
    return {
      items: [],
      totalCost: 0,
      outOfStock: [],
      recipeCount: 0,
    };
  }
}

export default async function ShoppingListPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const params = await searchParams;
  const ids = params.ids ? params.ids.split(',') : ['1', '2'];
  const shoppingList = await generateShoppingList(ids);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          &larr; Back to home
        </Link>

        <div className="mb-4 rounded-lg border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-950">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <strong>Call Chain:</strong> Next.js &rarr; Express &rarr; GraphQL
          </p>
          <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">
            Express API fetches recipe ingredients from GraphQL, then aggregates and adds pricing
          </p>
        </div>

        <article className="rounded-lg border border-zinc-200 bg-white p-8 dark:border-zinc-700 dark:bg-zinc-800">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              Shopping List
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              Aggregated ingredients for {shoppingList.recipeCount} recipe
              {shoppingList.recipeCount !== 1 ? 's' : ''}
            </p>
          </header>

          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-green-50 p-4 dark:bg-green-950">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                Total Cost
              </h3>
              <p className="mt-1 text-3xl font-bold text-green-900 dark:text-green-100">
                ${shoppingList.totalCost.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Items
              </h3>
              <p className="mt-1 text-3xl font-bold text-blue-900 dark:text-blue-100">
                {shoppingList.items.length}
              </p>
            </div>
          </div>

          {shoppingList.outOfStock.length > 0 && (
            <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
              <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                Out of Stock Items
              </h3>
              <ul className="mt-2 list-inside list-disc text-sm text-orange-800 dark:text-orange-200">
                {shoppingList.outOfStock.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          <section>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Items to Buy
            </h2>
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              <table className="w-full">
                <thead className="bg-zinc-100 dark:bg-zinc-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Item
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Price/Unit
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Stock
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {shoppingList.items.map((item) => (
                    <tr
                      key={item.ingredientId}
                      className={!item.inStock ? 'bg-orange-50 dark:bg-orange-950/20' : ''}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-600 dark:text-zinc-400">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-zinc-600 dark:text-zinc-400">
                        ${item.pricePerUnit.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        ${item.totalCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.inStock ? (
                          <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                            In Stock
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                            Out
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-8 rounded-lg bg-zinc-100 p-6 dark:bg-zinc-700">
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Try Different Combinations
            </h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/shopping-list?ids=1"
                className="rounded-lg bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-600"
              >
                Pancakes only
              </Link>
              <Link
                href="/shopping-list?ids=1,2"
                className="rounded-lg bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-600"
              >
                Pancakes + Fried Rice
              </Link>
              <Link
                href="/shopping-list?ids=1,2,3"
                className="rounded-lg bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-600"
              >
                All 3 Recipes
              </Link>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
