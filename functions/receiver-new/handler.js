'use strict';

const axios = require('axios');
const fbGraphApi = process.env.FB_GRAPH_API;
const moment = require('moment');
const aws = require('aws-sdk');
const lambda = new aws.Lambda({
  apiVersion: '2015-03-31',
  region: process.env.SERVERLESS_REGION
});


function prepareCityPicker(usrId) {
  return {
    recipient: {
      id: usrId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: 'Which city do you want to ask for events?',
          buttons: [
            {
              type: 'postback',
              title: 'Helsinki',
              payload: '{"city":"helsinki"}'
            },
            {
              type: 'postback',
              title: 'Espoo',
              payload: '{"city":"espoo"}'
            },
            {
              type: 'postback',
              title: 'Turku',
              payload: '{"city":"turku"}'
            }
          ]
        }
      }
    }
  };
}

function prepareEventPicker(usrId, city) {
  return {
    recipient: {
      id: usrId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: `Which event type in ${city} do you look for?`,
          buttons: [
            {
              type: 'postback',
              title: 'Music',
              payload: `{"city":"${city}","event":"music"}`
            },
            {
              type: 'postback',
              title: 'Dance',
              payload: `{"city":"${city}","event":"dance"}`
            },
            {
              type: 'postback',
              title: 'Christmas',
              payload: `{"city":"${city}","event":"christmas"}`
            }
          ]
        }
      }
    }
  };
}

function prepareDatePicker(usrId, city, event) {
  const tmr = moment().add(1, 'days').format('YYYY-MM-DD');
  const next3days = moment().add(3, 'days').format('YYYY-MM-DD');
  return {
    recipient: {
      id: usrId
    },
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: `Which date in ${city} do you look for ${event} events?`,
          buttons: [
            {
              type: 'postback',
              title: 'Today',
              payload: `{"city":"${city}","type":"${event}","time":"today"}`
            },
            {
              type: 'postback',
              title: 'Tomorrow',
              payload: `{"city":"${city}","type":"${event}","time":"${tmr}"}`
            },
            {
              type: 'postback',
              title: 'Next 3 days',
              payload: `{"city":"${city}","type":"${event}","time":"${next3days}"}`
            }
          ]
        }
      }
    }
  };
}

function invokeLambda(payload) {
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
}


module.exports.handler = (event, context, callback) => {
  console.info('invoke lambda function receiver-new');

  // verify fb app token
  if (event.method === 'GET') {
    if (event.hubVerifyToken === process.env.FB_APP_VERIFY_TOKEN && event.hubChallenge) {
      callback(null, parseInt(event.hubChallenge));
    }
    callback('Invalid token');
  } else {
    let msgItem;
    event.payload.entry.map(entry => {
      entry.messaging.map(item => {
        msgItem = item;
      });
    });
    if (msgItem.hasOwnProperty('message')) {
      if (!msgItem.message.hasOwnProperty('attachments')) {
        /* reply with sending action */
        axios.post(fbGraphApi, {
          recipient: {
            id: msgItem.sender.id
          },
          sender_action: 'typing_on'
        });
        /* end sending action */

        const city = prepareCityPicker(msgItem.sender.id);
        axios.post(fbGraphApi, city)
          .then(error => {
            console.error('FB send error:', JSON.stringify(error));
          });
      }
    } else if (msgItem.hasOwnProperty('postback')) {
      const payload = JSON.parse(msgItem.postback.payload);
      const event = prepareEventPicker(msgItem.sender.id, payload.city);
      if (!payload.hasOwnProperty('event') && !payload.hasOwnProperty('time')) {
        const event = prepareEventPicker(msgItem.sender.id, payload.city);
        axios.post(fbGraphApi, event)
          .then(error => {
            console.error('FB send error:', JSON.stringify(error));
          });
      } else if (payload.hasOwnProperty('event') && !payload.hasOwnProperty('time')) {
        const date = prepareDatePicker(msgItem.sender.id, payload.city, payload.event);
        console.info('datePicker', JSON.stringify(date, null, 2));
        axios.post(fbGraphApi, date)
          .catch(error => {
            console.error('FB send error:', JSON.stringify(error));
          });
      } else {
        console.info('enough information, start to search for events');
        const lambdaPayload = payload;
        lambdaPayload.payload = {
          recipient: {
            id: msgItem.sender.id
          },
          message: {
            text: ''
          }
        };
        console.info('lambda payload:', JSON.stringify(lambdaPayload));
        invokeLambda(lambdaPayload)
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
      }
    }
  }
};
