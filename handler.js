'use strict';

const poll = require('./wakatime');
const { reduceResponse, parseReduced } = require('./lib');
const { upsert } = require('./dynamodb');

module.exports.poll = async (event = {}) => {
  const { pathParameters = {} } = event;

  console.log({ event });

  const { timespan = 2, enddate } = pathParameters;

  try {
    const { res, range } = await poll(timespan, enddate);
    const reduced = reduceResponse(res.data);
    const upserts = await Promise.all(reduced.map(upsert));
    console.log(upserts.map(({ Item: { date, total_seconds } }) => ({ date, total_seconds })));
    return {
      statusCode: 200,
      body: JSON.stringify({ range, upserts }),
    };
  } catch ({ statusCode = 400, ...error }) {
    console.error({ error });
    return {
      statusCode,
      body: JSON.stringify(error),
    };
  }
};

module.exports.query = async (event = {}) => {
  const { pathParameters = {} } = event;
  const { timespan = 'DAY', enddate } = pathParameters;

  try {
    const { res, range } = await poll(timespan, enddate);
    const reduced = reduceResponse(res.data);
    const parsed = parseReduced(reduced);
    return {
      statusCode: 200,
      body: JSON.stringify({ range, parsed }),
    };
  } catch ({ statusCode = 400, ...error }) {
    return {
      statusCode,
      body: JSON.stringify(error),
    };
  }
};
