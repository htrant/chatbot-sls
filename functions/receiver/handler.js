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
          reject(reqMsg.senderId);
        }
      });
    });
  });
};


const invokeLambda = payload => {
  console.log('invoking helsinki sender...');
  return new Promise((resolve, reject) => {
    const params = {
      FunctionName: process.env.HKI_SENDER,
      Payload: JSON.stringify(payload, null, 2)
    };
    lambda.invoke(params, (err, data) => {
      if (err) {
        console.log(err);
        reject(payload.recipient.id);
      } else {
        console.log(data);
        resolve(data);
      }
    });
  });
};


module.exports.handler = (event, context, callback) => {
  getRequest(event)
    .then(usrMsg => {
      const lambdaPayload = {
        city: usrMsg.city,
        time: usrMsg.time,
        type: usrMsg.eventType,
        payload: {
          recipient: {
            id: usrMsg.senderId
          },
          message: {
            text: ''
          }
        }
      };
      return invokeLambda(lambdaPayload);
    })
    .then(response => {
      callback(null, response);
    })
    .catch(senderId => {
      const payload = {
        recipient: {
          id: senderId
        },
        message: {
          text: 'Sorry, we are sufferring technical issues.'
        }
      };
      axios.post(fbGraphApi, payload)
        .then(response => {
          console.log(response);
        });
    });
};
