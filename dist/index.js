"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_yoga_1 = require("graphql-yoga");
const uuid_1 = require("uuid");
const cards = [];
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
const subscribers = [];
const onCardUpdate = (fn) => subscribers.push(fn);
const resolvers = {
    Query: {
        cards: () => cards,
    },
    Mutation: {
        postCard: (parent, { user, content, type }) => {
            const id = uuid_1.v4();
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
        deleteCard: (parent, { id }) => {
            const card = cards.find(card => card.id === id);
            if (card) {
                const cardIndex = cards.indexOf(card);
                cards.splice(cardIndex, 1);
                subscribers.forEach(fn => fn());
            }
            return id;
        },
        increaseLikes: (parent, { id }) => {
            const card = cards.find(card => card.id === id);
            if (card) {
                const cardIndex = cards.indexOf(card);
                const incresedLikes = card.likes + 1;
                cards[cardIndex] = Object.assign(Object.assign({}, card), { likes: incresedLikes });
                subscribers.forEach(fn => fn());
            }
            return id;
        },
    },
    Subscription: {
        cards: {
            subscribe: (parent, args, { pubsub }) => {
                const channel = Math.random().toString(36).slice(2, 15);
                onCardUpdate(() => pubsub.publish(channel, { cards }));
                setTimeout(() => pubsub.publish(channel, { cards }), 0);
                return pubsub.asyncIterator(channel);
            },
        },
    },
};
const pubsub = new graphql_yoga_1.PubSub();
const server = new graphql_yoga_1.GraphQLServer({ typeDefs, resolvers, context: { pubsub } });
server.start(({ port }) => {
    console.log(`Server on http://localhost:${port}/`);
});
//# sourceMappingURL=index.js.map