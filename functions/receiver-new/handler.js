'use strict';

const axios = require('axios');
const fbGraphApi = process.env.FB_GRAPH_API;


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
              title: 'Theatre',
              payload: `{"city":"${city}","event":"theatre"}`
            }
          ]
        }
      }
    }
  };
}

function prepareDatePicker(usrId, city, event) {
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
              type: 'web_url',
              url: process.env.DATE_PICKER_URL,
              title: 'Select a date',
              webview_height_ratio: 'compact',
              messenger_extensions: true,
              fallback_url: ''
            }
          ]
        }
      }
    }
  };
}


module.exports.handler = (event, context, callback) => {
  console.info('invoke lambda function receiver-new');
  console.info('event:', JSON.stringify(event, null, 2));

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
        const city = prepareCityPicker(msgItem.sender.id);
        axios.post(fbGraphApi, city)
          .then(error => {
            console.error('FB send error:', JSON.stringify(error));
          });
      }
    } else if (msgItem.hasOwnProperty('postback')) {
      const payload = JSON.parse(msgItem.postback.payload);
      const event = prepareEventPicker(msgItem.sender.id, payload.city);
      if (!payload.hasOwnProperty('event') && !payload.hasOwnProperty('date')) {
        const event = prepareEventPicker(msgItem.sender.id, payload.city);
        axios.post(fbGraphApi, event)
          .then(error => {
            console.error('FB send error:', JSON.stringify(error));
          });
      } else if (payload.hasOwnProperty('event') && !payload.hasOwnProperty('date')) {
        const date = prepareDatePicker(msgItem.sender.id, payload.city, payload.event);
        console.info('datePicker', JSON.stringify(date, null, 2));
        axios.post(fbGraphApi, date)
          .catch(error => {
            console.error('FB send error:', JSON.stringify(error));
          });
      } else {
        console.info('collect enough information');
      }
    }
  }
};
