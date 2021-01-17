import { GraphQLServer, PubSub } from 'graphql-yoga';
import { v4 as uuid } from 'uuid';

const cards: Array<{
  id: string;
  user: string;
  content: string;
  type: 'good' | 'wondering' | 'bad';
  likes: number;
}> = [];

const typeDefs = `
  enum CardType {
    good,
    wondering,
    bad
  }
  type Card {
    id: ID!
    user: String!
    content: String!
    type: CardType
    likes: Int
  }
  type Query {
    cards: [Card!]
  }
  type Mutation {
    postCard(user: String!, content: String!, type: String!): ID!
    deleteCard(id: String!): ID!
    increaseLikes(id: String!): ID!
  }
  type Subscription {
    cards: [Card!]
  }
`;

const subscribers: Array<() => unknown> = [];
const onCardUpdate = (fn: () => unknown) => subscribers.push(fn);

const resolvers = {
  Query: {
    cards: () => cards,
  },
  Mutation: {
    postCard: (parent: any, { user, content, type }: any) => {
      const id = uuid();
      cards.push({
        id,
        user,
        content,
        type,
        likes: 0,
      });
      subscribers.forEach(fn => fn());
      return id;
    },
    deleteCard: (parent: any, { id }: any) => {
      const card = cards.find(card => card.id === id);

      if (card) {
        const cardIndex = cards.indexOf(card);
        cards.splice(cardIndex, 1);

        subscribers.forEach(fn => fn());
      }

      return id;
    },
    increaseLikes: (parent: any, { id }: any) => {
      const card = cards.find(card => card.id === id);

      if (card) {
        const cardIndex = cards.indexOf(card);

        const incresedLikes = card.likes + 1;

        cards[cardIndex] = { ...card, likes: incresedLikes };

        subscribers.forEach(fn => fn());
      }

      return id;
    },
  },
  Subscription: {
    cards: {
      subscribe: (parent: any, args: any, { pubsub }: any) => {
        const channel = Math.random().toString(36).slice(2, 15);
        onCardUpdate(() => pubsub.publish(channel, { cards }));
        setTimeout(() => pubsub.publish(channel, { cards }), 0);
        return pubsub.asyncIterator(channel);
      },
    },
  },
};

const pubsub = new PubSub();
const server = new GraphQLServer({ typeDefs, resolvers, context: { pubsub } });
server.start(({ port }) => {
  console.log(`Server on http://localhost:${port}/`);
});
