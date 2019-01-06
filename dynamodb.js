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

module.exports.scan = (start, end) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    FilterExpression: '#dt between :start_dt and :end_dt',
    ExpressionAttributeNames: {
      '#dt': 'date',
    },
    ExpressionAttributeValues: {
      ':start_dt': start,
      ':end_dt': end,
    },
  };

  return dynamoDb.scan(params).promise();
};
