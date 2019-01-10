'use strict';

const { APIGateway } = require('aws-sdk');
const fs = require('fs');
const poll = require('./lib/wakatime');
const { upsert, scan } = require('./lib/dynamodb');
const { reduceResponse, parseReduced, parseRange } = require('./lib');

module.exports.poll = async (event = {}) => {
  const { pathParameters = {}, timespan: ts = 1, enddate: ed } = event;
  const { timespan = ts, enddate = ed } = pathParameters;

  try {
    const { start, end } = parseRange(timespan, enddate);
    console.log(`Requesting data from wakatime between "${start}" to "${end}"`);
    const res = await poll(start, end);
    const reduced = reduceResponse(res.data);
    const upserts = await Promise.all(reduced.map(upsert));
    console.log(upserts.map(({ Item: { date, total_seconds } }) => ({ date, total_seconds })));

    return {
      statusCode: 200,
      body: JSON.stringify({ range: { start, end }, upserts }),
    };
  } catch (error) {
    console.error({ error });
    return {
      statusCode: error.statusCode || 400,
      body: JSON.stringify({ err: error.message || error }),
    };
  }
};

module.exports.query = async (event = {}) => {
  const { pathParameters = {} } = event;
  const { timespan = 'DAY', enddate } = pathParameters;

  try {
    const { start, end } = parseRange(timespan, enddate);
    console.log(`Requesting data from dynamoDb table "${process.env.DYNAMODB_TABLE}" between "${start}" to "${end}"`);
    const response = await scan(start, end);
    const parsed = parseReduced(response.Items);

    return {
      statusCode: 200,
      body: JSON.stringify({ range: { start, end }, parsed, response: response }),
    };
  } catch (error) {
    console.error({ error });
    return {
      statusCode: error.statusCode || 400,
      body: JSON.stringify({ err: error.message || error }),
    };
  }
};

module.exports.visualize = async () => {
  const apiGateway = new APIGateway();
  try {
    const { items } = await apiGateway
      .getApiKeys({
        includeValues: true,
        nameQuery: process.env.X_APIKEY,
      })
      .promise();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/html' },
      body: fs
        .readFileSync('./templates/query.html', 'utf-8')
        .replace('{{DOMAIN}}', process.env.DOMAIN)
        .replace('{{X_APIKEY}}', items[0].value)
        .replace('{{MOCK_DATA}}', process.env.IS_OFFLINE ? JSON.stringify(JSON.parse(fs.readFileSync('./data/mockdata.json', 'utf-8'))) : '{}')
        .replace('{{IS_OFFLINE}}', process.env.IS_OFFLINE ? '1' : ''),
    };
  } catch (error) {
    console.error({ error });
    return {
      statusCode: error.statusCode || 400,
      body: JSON.stringify({ err: error.message || error }),
    };
  }
};
