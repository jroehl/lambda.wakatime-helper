const buildAllowAllPolicy = (event, principalId) => {
  const [, , , awsRegion, awsAccountId, apiGateway] = event.methodArn.split(':');
  const [restApiId, stage] = apiGateway.split('/');
  const apiArn = `arn:aws:execute-api:${awsRegion}:${awsAccountId}:${restApiId}/${stage}/*/*`;
  const policy = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: [apiArn],
        },
      ],
    },
  };
  return policy;
};

exports.handler = async event => {
  var authorizationHeader = event.headers.Authorization;

  const Unauthorized = {
    status: 401,
    statusDescription: 'Unauthorized',
    body: 'Unauthorized',
    headers: {
      'www-authenticate': [{ key: 'WWW-Authenticate', value: 'Basic' }],
    },
  };
  if (!authorizationHeader) return Unauthorized;

  const encodedCreds = authorizationHeader.split(' ')[1];
  const [username, password] = new Buffer(encodedCreds, 'base64').toString().split(':');

  if (!(username === 'admin' && password === 'secret')) return Unauthorized;

  const authResponse = buildAllowAllPolicy(event, username);

  return authResponse;
};
