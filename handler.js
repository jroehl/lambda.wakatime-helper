'use strict';

const fs = require('fs');
const poll = require('./wakatime');
const { reduceResponse, parseReduced, parseRange } = require('./lib');
const { upsert, scan } = require('./dynamodb');

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

module.exports.visualize = async (event = {}) => {
  // Get request and request headers
  // const request = event.Records[0].cf.request;
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: fs.readFileSync('./query.html', 'utf-8'),
  };
};
