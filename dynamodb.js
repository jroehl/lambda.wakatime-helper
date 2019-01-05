const { DynamoDB } = require('aws-sdk');

const dynamoDb = new DynamoDB.DocumentClient();

module.exports.upsert = Item => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Item,
  };

  return dynamoDb
    .put(params)
    .promise()
    .then(response => ({ response, Item }));
};
