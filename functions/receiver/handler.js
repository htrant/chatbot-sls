'use strict';

const axios = require('axios');
const fbGraphApi = process.env.FB_GRAPH_API;
const aws = require('aws-sdk');
const lambda = new aws.Lambda({
  apiVersion: '2015-03-31',
  region: process.env.SERVERLESS_REGION
});


const getRequest = event => {
  return new Promise((resolve, reject) => {
    event.payload.entry.map(entry => {
      entry.messaging.map(messageItem => {
        const text = messageItem.message.text.toLowerCase();
        const textArray = text.split(" ");
        const reqMsg = {
          senderId: messageItem.sender.id
        };
        if (textArray[0] !== undefined && textArray[1] !== undefined && textArray[2] !== undefined) {
          reqMsg.city = textArray[0];
          reqMsg.eventType = textArray[1];
          reqMsg.time = textArray[2];
          resolve(reqMsg);
        } else {
          reqMsg.text = 'Sorry, you sent message in invalid format';
          reject(reqMsg);
        }
      });
    });
  });
};


module.exports.handler = (event, context, callback) => {
  getRequest(event)
    .then(usrMsg => {
      const reply = `City is ${usrMsg.city}, event type is ${usrMsg.eventType}, time is ${usrMsg.time}`;
      const payload = {
        recipient: {
          id: usrMsg.senderId
        },
        message: {
          text: reply
        }
      };
      axios.post(fbGraphApi, payload)
        .then(response => {
          callback(null, response);
        });
    })
    .catch(exception => {
      const payload = {
        recipient: {
          id: exception.senderId
        },
        message: {
          text: exception.text
        }
      };
      axios.post(fbGraphApi, payload)
        .then(response => {
          callback(exception);
        });
    });
};
