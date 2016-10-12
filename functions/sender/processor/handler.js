'use strict';

const axios = require('axios');
const striptags = require('striptags');
const fbGraphApi = process.env.FB_GRAPH_API;
const maxEvents = process.env.MAX_EVENTS;


module.exports.handler = (event, context, callback) => {
  console.info('invoke lambda function processor');
  console.info('event:', JSON.stringify(event, null, 2));
  const apiEndpoint = (event.city === 'helsinki') ? process.env.HKI_LINKEDEVENT_API : process.env.TKU_LINKEDEVENT_API;
  const queryApi = `${apiEndpoint}q=${event.type}&start=${event.time}`;
  const fbPayload = event.payload;
  console.info(`query api: ${queryApi}`);
  axios.get(queryApi)
    .then(response => {
      const allEvents = response.data.data;
      const max = (allEvents.length < maxEvents) ? allEvents.length : maxEvents;
      let replyMsg = '';
      for (let i = 0; i < max; i++) {
        let eventName = '';
        if (allEvents[i].name.en === undefined || allEvents[i].name.en === '') {
          eventName = allEvents[i].name.fi;
        } else {
          eventName = allEvents[i].name.en;
        }
        replyMsg += `${i + 1}- ${eventName}\n`;
      }
      console.info('reply message:', JSON.stringify(replyMsg, null, 2));
      fbPayload.message.text = striptags(replyMsg);
      console.info('FB payload:', JSON.stringify(fbPayload, null, 2));
      return axios.post(fbGraphApi, fbPayload);
    })
    .then(response => {
      console.info('success:', JSON.stringify(response, null, 2));
      callback(null, response);
    })
    .catch(error => {
      console.error('failure:', JSON.stringify(error, null, 2));
      callback(error);
    });
};
