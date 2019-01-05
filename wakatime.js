const request = require('request-promise-native');

const options = {
  method: 'GET',
  json: true,
  url: 'https://wakatime.com/api/v1/users/current/summaries',
  qs: { api_key: process.env.WAKATIME_APIKEY },
};

const DATE_CONST = {
  DAY: 1,
  WEEK: 6,
  MONTH: 30,
  YEAR: 365,
};

const localize = date => date.toLocaleString('en', { year: 'numeric', month: '2-digit', day: '2-digit' });

/**
 * Request
 * @param {string} end (date in ISO 8601 YYYY-MM-DD)
 * @param {string} timeSpan (enum TODAY, YESTERDAY, WEEK, MONTH, YEAR)
 */
module.exports = (timeSpan, end = localize(new Date())) => {
  const date = new Date(end);
  const endDate = localize(date);
  const time = isNaN(timeSpan) ? DATE_CONST[timeSpan] : timeSpan;
  date.setDate(date.getDate() - time);
  const startDate = localize(date);
  console.log(`Requesting data from "${startDate}" to "${endDate}"`);
  const range = { end: endDate, start: startDate };
  return request({ ...options, qs: { ...options.qs, ...range } }).then(res => ({ res, range }));
};
