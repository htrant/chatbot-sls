'use strict';

const _ = require('lodash');
const axios = require('axios');
const eventKeywords = ['dance', 'theatre', 'music', 'museum', 'food', 'culture', 'parade', 'sale', 'ballet'];
const cities = ['espoo', 'helsinki', 'turku'];
const fbUsers = [process.env.USER1_ID, process.env.USER2_ID];


// once function is invoked, various replies are sent to FB users
module.exports.handler = (event, context) => {
  const maxReplies = Math.floor(Math.random()*6) + 1; //get a random number between 1-5
  console.info('max replies', maxReplies);
  for (let i = 0; i < maxReplies; i++) {
    const msgCallback = {
      object: 'page',
      entry: []
    };
    const epochTime = new Date().valueOf();
    let msgText = `${_.sample(cities)} ${_.sample(eventKeywords)}`;
    if ((epochTime % 2) === 0) {
      msgText = `${msgText} today`;
    } else {
      const today = new Date().toISOString().slice(0, 10);
      msgText = `${msgText} ${today} 2016-12-31`;
    }
    const entryDetail = {
      id: process.env.PAGE_ID,
      messaging: [
        {
          sender: {
            id: _.sample(fbUsers)
          },
          recipient: {
            id: process.env.PAGE_ID
          },
          timestamp: epochTime,
          message: {
            text: msgText
          }
        }
      ]
    };
    msgCallback.entry.push(entryDetail);
    console.info('msgCallback', JSON.stringify(msgCallback, null, 2));
    console.info('receiver endpoint', process.env.APIGATEWAY_RECEIVER);
    axios.post(process.env.APIGATEWAY_RECEIVER, msgCallback)
      .then(res => {
        console.info('success');
        context.done(null);
      })
      .catch(err => {
        console.error('error');
      })
  }
};
