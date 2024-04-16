const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const AWS = require('aws-sdk');

AWS.config.update({
  region: 'local',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'fakeMyKeyId',
  secretAccessKey: 'fakeSecrectAccessKey',
});

const dynamodb = new AWS.DynamoDB.DocumentClient();

// Define the GraphQL schema
const schema = buildSchema(`
  type Item {
    id: ID!
    name: String!
    createdAt: Int!
  }

  type Query {
    items(createdAt: String, limit: Int): [Item]!
  }
`);

// Resolver functions
const resolvers = {
  items: async ({ createdAt, limit = 10 }) => {
    if (createdAt) {
      const queryParams = {
        TableName: 'items',
        IndexName: 'createdAtIndex', // Use the GSI
        KeyConditionExpression: '#dummy = :dummy AND #createdAt > :createdAt', // Use dummy as partition key
        ExpressionAttributeNames: {
          '#dummy': 'dummy',
          '#createdAt': 'createdAt',
        },
        ExpressionAttributeValues: {
          ':dummy': 'dummy', // Dummy value for the partition key
          ':createdAt': parseInt(createdAt, 10),
        },
        Limit: 10, // Limit to the x closest items
      };

      console.log('testing queryParams', queryParams);
      const queryResult = await dynamodb.query(queryParams).promise();
      console.log('testing after', queryResult);
      return queryResult.Items || [];
    }
    return [];
  },
};

// Create the GraphQL server
const app = express();
app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue: resolvers,
    graphiql: true,
  })
);

// Start the server
app.listen(4000, () => console.log('GraphQL server running on port 4000'));
