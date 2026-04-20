"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getExpressUrl } from "@obs-playground/env";

function getFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

const ingredientSchema = z.array(
  z.object({
    ingredientId: z.string(),
    quantity: z.number(),
  }),
);

const createdRecipeSchema = z.object({
  id: z.string(),
});

function parseIngredients(raw: string) {
  return ingredientSchema.parse(JSON.parse(raw || "[]"));
}

function buildRecipePayload(formData: FormData) {
  return {
    title: getFormString(formData, "title"),
    description: getFormString(formData, "description"),
    prepTime: parseInt(getFormString(formData, "prepTime"), 10),
    cookTime: parseInt(getFormString(formData, "cookTime"), 10),
    difficulty: getFormString(formData, "difficulty"),
    servings: parseInt(getFormString(formData, "servings"), 10),
    categoryId: getFormString(formData, "categoryId"),
    ingredients: parseIngredients(getFormString(formData, "ingredients")),
  };
}

export async function createCommunityRecipeAction(formData: FormData) {
  const response = await fetch(`${getExpressUrl()}/community-recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildRecipePayload(formData)),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to create recipe: ${response.status}`);
  }

  const created = createdRecipeSchema.parse(await response.json());
  redirect(`/community-recipes/${created.id}`);
}

export async function updateCommunityRecipeAction(
  id: string,
  formData: FormData,
) {
  const response = await fetch(`${getExpressUrl()}/community-recipes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildRecipePayload(formData)),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to update recipe: ${response.status}`);
  }

  redirect(`/community-recipes/${id}`);
}

export async function deleteCommunityRecipeAction(
  id: string,
  _formData: FormData,
) {
  const response = await fetch(`${getExpressUrl()}/community-recipes/${id}`, {
    method: "DELETE",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete recipe: ${response.status}`);
  }

  redirect("/community-recipes");
}
