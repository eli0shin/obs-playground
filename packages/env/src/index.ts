export function getGraphqlUrl(): string {
  if (!process.env.GRAPHQL_BASE_URL) {
    throw new Error("GRAPHQL_BASE_URL environment variable is required");
  }
  return `${process.env.GRAPHQL_BASE_URL}/graphql`;
}

export function getExpressUrl(): string {
  if (!process.env.EXPRESS_BASE_URL) {
    throw new Error("EXPRESS_BASE_URL environment variable is required");
  }
  return process.env.EXPRESS_BASE_URL;
}

export function getPublicGraphqlUrl(): string {
  if (!process.env.NEXT_PUBLIC_GRAPHQL_BASE_URL) {
    throw new Error(
      "NEXT_PUBLIC_GRAPHQL_BASE_URL environment variable is required",
    );
  }
  return `${process.env.NEXT_PUBLIC_GRAPHQL_BASE_URL}/graphql`;
}
