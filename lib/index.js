/**
 * [STEP1-ARRAY]
 * Remove unnecessary values and sanitize data
 * @param {array} array
 * @returns {array}
 */
const reduceArray = array => array.map(({ total_seconds, name }) => ({ name, total_seconds }));

/**
 * [STEP1]
 * Remove unnecessary values and sanitize data
 * @param {array} data
 * @param {array} [keys=['categories', 'editors', 'languages', 'operating_systems']]
 * @returns {object}
 */
module.exports.reduceResponse = (data, keys = ['categories', 'editors', 'languages', 'operating_systems']) => {
  const res = data.map(({ grand_total, range, date, projects, ...rest }) => {
    return {
      ...keys.reduce((red, key) => ({ ...red, [key]: reduceArray(rest[key]) }), {}),
      projects: projects.map(({ name, grand_total, total_seconds }) => ({
        total_seconds: total_seconds !== undefined ? total_seconds : grand_total.total_seconds,
        name,
      })),
      total_seconds: grand_total.total_seconds,
      date: date || range.date,
    };
  });
  return res;
};

/**
 * Convert seconds to d,h,m,s and parse as human readable string
 * @param {number} total_seconds
 * @returns {object}
 */
const sanitizeTime = total_seconds => {
  let seconds = parseInt(total_seconds, 10);

  const days = Math.floor(seconds / (3600 * 24));
  seconds -= days * 3600 * 24;
  const hours = Math.floor(seconds / 3600);
  seconds -= hours * 3600;
  const minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;
  const times = { days, hours, minutes, seconds };
  const keys = ['days', 'hours', 'minutes', 'seconds'];
  return {
    total_string: keys
      .map(key => (times[key] ? `${times[key]} ${key}` : ''))
      .filter(x => x)
      .join(' '),
    total_seconds,
    times,
  };
};

/**
 * Sanitize time and sort entries by total_seconds
 * @param {object} object
 * @returns {array}
 */
const sanitizeAndSort = object =>
  Object.entries(object)
    .map(([name, value]) => ({ name, ...sanitizeTime(value) }))
    .sort((a, b) => b.total_seconds - a.total_seconds);
/**
 * [STEP2-ARRAY]
 * Prepare array for summary
 * @param {array} data
 * @param {array} [keys=['categories', 'editors', 'languages', 'operating_systems', 'projects']]
 * @returns {object}
 */
const parseArray = (array, initial) =>
  array.reduce((red, { name, total_seconds }) => {
    return { ...red, [name]: (red[name] || 0) + total_seconds };
  }, initial || {});

/**
 * [STEP2]
 * Parse data for summary
 * @param {array} data
 * @param {array} [keys=['categories', 'editors', 'languages', 'operating_systems', 'projects']]
 * @returns {object}
 */
module.exports.parseReduced = (data, keys = ['categories', 'editors', 'languages', 'operating_systems', 'projects']) => {
  let res = data.reduce(
    (red, { total_seconds = 0, ...rest }) => {
      return {
        ...keys.reduce((r, key) => {
          return { ...r, [key]: parseArray(rest[key], red[key]) };
        }, {}),
        total_seconds: red.total_seconds + total_seconds,
      };
    },
    { total_seconds: 0 }
  );

  return {
    total: sanitizeTime(res.total_seconds),
    ...keys.reduce((red, key) => ({ ...red, [key]: sanitizeAndSort(res[key]) }), {}),
  };
};

/**
 * Convert date to ISO-8601 string
 * @param {Date} date
 * @returns {string}
 */
const localize = date => date.toISOString().split('T')[0];

const DATE_CONST = {
  DAY: 1,
  WEEK: 6,
  MONTH: 30,
  YEAR: 364,
};

/**
 * Parse dates to range
 * @param {string} timeSpan (enum TODAY, YESTERDAY, WEEK, MONTH, YEAR or number or date in ISO 8601)
 * @param {string} [end=localize(new Date())] (date in ISO 8601 YYYY-MM-DD)
 * @returns {object} range
 */
module.exports.parseRange = (timeSpan, end = localize(new Date())) => {
  const date = new Date(end);
  const endDate = localize(date);
  // is ISO 8601 date string
  if (`${timeSpan}`.match(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])$/g)) {
    return { end: endDate, start: timeSpan };
  }
  const time = isNaN(timeSpan) ? DATE_CONST[timeSpan] : timeSpan;
  date.setDate(date.getDate() - time);
  const startDate = localize(date);
  return { end: endDate, start: startDate };
};
