const request = require('request-promise-native');

const options = {
  method: 'GET',
  json: true,
  url: 'https://wakatime.com/api/v1/users/current/summaries',
  qs: { api_key: process.env.WAKATIME_APIKEY },
};

/**
 * Request
 * @param {string} start (date in ISO 8601 YYYY-MM-DD)
 * @param {string} end (date in ISO 8601 YYYY-MM-DD)
 */
module.exports = (start, end) => {
  const range = { start, end };
  return request({ ...options, qs: { ...options.qs, ...range } });
};
