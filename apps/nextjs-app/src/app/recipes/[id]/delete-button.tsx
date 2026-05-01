"use client";

import { useRouter } from "next/navigation";
import { trpc } from "@/trpc/client";

export function DeleteRecipeButton({ id }: { id: string }) {
  const router = useRouter();
  const deleteRecipe = trpc.recipe.delete.useMutation({
    onSuccess: () => {
      router.push("/");
      router.refresh();
    },
  });

  return (
    <button
      type="button"
      disabled={deleteRecipe.isPending}
      onClick={() => deleteRecipe.mutate({ id })}
      className="w-full rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
    >
      {deleteRecipe.isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
