const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

AWS.config.update({
  region: 'local',
  endpoint: 'http://localhost:8000',
  accessKeyId: 'fakeMyKeyId',
  secretAccessKey: 'fakeSecrectAccessKey',
});

const dynamodb = new AWS.DynamoDB();
const documentClient = new AWS.DynamoDB.DocumentClient();

const tableName = 'items';

const deleteTable = async () => {
  try {
    await dynamodb
      .deleteTable({
        TableName: tableName,
      })
      .promise();
    console.log(`Table '${tableName}' deleted.`);
  } catch (error) {
    if (error.code === 'ResourceNotFoundException') {
      console.log(`Table '${tableName}' does not exist.`);
    } else {
      console.error('Error deleting table:', error);
    }
  }
};

const createTable = async () => {
  const params = {
    TableName: tableName,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' },
      { AttributeName: 'createdAt', KeyType: 'RANGE' },
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' },
      { AttributeName: 'createdAt', AttributeType: 'N' },
      // Add a dummy attribute
      { AttributeName: 'dummy', AttributeType: 'S' },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
    GlobalSecondaryIndexes: [
      {
        IndexName: 'createdAtIndex',
        KeySchema: [
          { AttributeName: 'dummy', KeyType: 'HASH' }, // Use dummy as partition key
          { AttributeName: 'createdAt', KeyType: 'RANGE' },
        ],
        Projection: {
          ProjectionType: 'ALL',
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
    ],
  };

  try {
    await dynamodb.createTable(params).promise();
    console.log(`Table '${tableName}' created.`);
  } catch (error) {
    console.error('Error creating table:', error);
  }
};

const populateTable = async () => {
  let index = 0;
  const items = Array.from({ length: 50 }, () => ({
    id: uuidv4(),
    name: `Item ${++index}`,
    createdAt: index,
    dummy: 'dummy',
  }));

  for (const item of items) {
    const params = {
      TableName: tableName,
      Item: item,
    };

    try {
      await documentClient.put(params).promise();
      console.log('Item added:', item);
    } catch (error) {
      console.error('Error adding item:', error);
    }
  }
};

const main = async () => {
  await deleteTable();
  await createTable();
  await populateTable();
};

main().catch((error) => {
  console.error('Error:', error);
});
