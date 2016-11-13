'use strict';

const axios = require('axios');
const fbGraphApi = process.env.FB_GRAPH_API;
const validator = require('validator');
const aws = require('aws-sdk');
const lambda = new aws.Lambda({
  apiVersion: '2015-03-31',
  region: process.env.SERVERLESS_REGION
});


const getRequest = event => {
  console.info('start getRequest(event)');
  return new Promise((resolve, reject) => {
    event.payload.entry.map(entry => {
      entry.messaging.map(messageItem => {
        const text = messageItem.message.text.toLowerCase();
        const textArray = text.split(' ');
        const reqMsg = {
          senderId: messageItem.sender.id
        };
        if (textArray[0] !== undefined && textArray[1] !== undefined && textArray[2] !== undefined) {
          if (textArray[0] === 'helsinki' || textArray[0] === 'turku' || textArray[0] === 'espoo') {
            reqMsg.city = textArray[0];
            reqMsg.eventType = textArray[1];
            if (textArray[2] === 'today') {
              reqMsg.time = 'today';
            } else if (textArray[2] !== 'today' && validator.isISO8601(textArray[2])) {
              reqMsg.time = textArray[2];
            } else {
              reject({
                sender: reqMsg.senderId,
                reason: 'Sorry, the date format is invalid. Please use yyyy-mm-dd'
              });
            }
            if (textArray[3] !== undefined && validator.isISO8601(textArray[3])) {
              reqMsg.endtime = textArray[3];
            }
          } else {
            reject({
              sender: reqMsg.senderId,
              reason: `Sorry, the service is not available in ${textArray[0]}`
            });
          }
          resolve(reqMsg);
        } else {
          reject({
            sender: reqMsg.senderId,
            reason: 'Sorry, you sent message in invalid format'
          });
        }
      });
    });
  });
};


const invokeLambda = payload => {
  console.info('call lambda function sender processor');
  return new Promise((resolve, reject) => {
    const params = {
      FunctionName: process.env.LAMBDA_SENDER_PROCESSOR,
      Payload: JSON.stringify(payload, null, 2),
      Qualifier: process.env.SERVERLESS_STAGE
    };
    lambda.invoke(params, (err, data) => {
      if (err) {
        console.error('failure:', JSON.stringify(err));
        reject({
          sender: payload.recipient.id,
          reason: 'Sorry, we have some technical problems'
        });
      } else {
        console.info('success:', JSON.stringify(data));
        resolve(data);
      }
    });
  });
};


module.exports.handler = (event, context, callback) => {
  console.info('invoke lambda function receiver');
  console.info('event:', JSON.stringify(event, null, 2));

  // verify fb app token
  if (event.method === 'GET') {
    if (event.hubVerifyToken === process.env.FB_APP_VERIFY_TOKEN && event.hubChallenge) {
      callback(null, parseInt(event.hubChallenge));
    } else {
      callback('Invalid token');
    }
  }

  getRequest(event)
    .then(usrMsg => {
      console.info('usrMsg:', JSON.stringify(usrMsg));

      /* reply with sending action */
      axios.post(fbGraphApi, {
        recipient: {
          id: usrMsg.senderId
        },
        sender_action: 'typing_on'
      });
      /* end sending action */

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
      if (usrMsg.endtime !== undefined) {
        lambdaPayload.endtime = usrMsg.endtime;
      }
      console.info('lambda payload:', JSON.stringify(lambdaPayload));
      return invokeLambda(lambdaPayload);
    })
    .catch(error => {
      console.error('failure', JSON.stringify(error, null, 2));
      const payload = {
        recipient: {
          id: error.sender
        },
        message: {
          text: error.reason
        }
      };
      console.info(`FB api: ${fbGraphApi}`);
      console.info('FB send payload:', JSON.stringify(payload));
      axios.post(fbGraphApi, payload)
        .catch(error => {
          console.error('FB send error:', JSON.stringify(error));
        });
    });
};
