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

// /**
//  * [STEP2-ARRAY]
//  * Prepare array for dynamodb dump
//  * @param {array} data
//  * @param {array} [keys=['categories', 'editors', 'languages', 'operating_systems', 'projects']]
//  * @returns {object}
//  */
// const convertArray = array => ({ L: array.map(({ total_seconds, name }) => ({ M: { total_seconds: { N: total_seconds.toString() }, name: { S: name } } })) });

// /**
//  * [STEP2]
//  * Prepare data for dynamodb dump
//  * @param {array} data
//  * @param {array} [keys=['categories', 'editors', 'languages', 'operating_systems', 'projects']]
//  * @returns {object}
//  */
// module.exports.convertToDynamoDBdump = (data, keys = ['categories', 'editors', 'languages', 'operating_systems', 'projects']) => {
//   const res = {
//     'wakatime-data': data.map(({ total_seconds, date, projects, ...rest }) => {
//       return {
//         PutRequest: {
//           Item: {
//             ...keys.reduce((red, key) => {
//               const value = rest[key];
//               if (!value) return red;
//               return { ...red, [key]: convertArray(value) };
//             }, {}),
//             date: { S: date },
//             total_seconds: { N: total_seconds.toString() },
//           },
//         },
//       };
//     }),
//   };
//   return res;
// };

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
