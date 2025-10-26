import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

interface Book {
  title: string;
  author: string;
}

const books: Book[] = [
  {
    title: 'The Awakening',
    author: 'Kate Chopin',
  },
  {
    title: 'City of Glass',
    author: 'Paul Auster',
  },
];

const typeDefs = `#graphql
  type Book {
    title: String
    author: String
  }

  type Query {
    books: [Book]
  }
`;

const resolvers = {
  Query: {
    books: () => books,
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const PORT = Number(process.env.PORT) || 4000;

const { url } = await startStandaloneServer(server, {
  listen: { port: PORT },
});

console.log(`GraphQL Server ready at: ${url}`);
