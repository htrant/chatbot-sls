'use strict';

const FB_VERIFY_TOKEN = '';

module.exports.handler = (event, context, callback) => {
  if (event.method === 'GET') {
    if (event.hubVerifyToken == FB_VERIFY_TOKEN && event.hubChallenge) {
      return callback(null, parseInt(event.hubChallenge));
    } else {
      return callback('Invalid token');
    }
  }

  if (event.method === 'POST') {
    const data = req.body;
      return callback(data);
  }
};
