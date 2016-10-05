'use strict';

module.exports.handler = (event, context, callback) => {
  const message = {
    inbound: event
  };
  callback(null, message);
};
