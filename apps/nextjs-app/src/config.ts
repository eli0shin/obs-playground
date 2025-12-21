export const GRAPHQL_URL = process.env.GRAPHQL_BASE_URL
  ? `${process.env.GRAPHQL_BASE_URL}/graphql`
  : "http://localhost:4000/graphql";
