'use strict';

const axios = require('axios');
var striptags = require('striptags');
const fbGraphApi = process.env.FB_GRAPH_API;
const helApi = process.env.HKI_LINKEDEVENT_API;


module.exports.handler = (event, context, callback) => {
  const time = event.time;
  const eventType = event.type;
  const resPayload = event.payload;
  const queryApi = `${helApi}&q=${eventType}&start=${time}`;
  axios.get(queryApi)
    .then(response => {
      const data = response.data.data;
      const max = (data.length < 3) ? data.length : 3;
      let replyMsg = 'List of events:\n';
      for (let i = 0; i < max; i++) {
        const name = (data[i].name.en === undefined) ? data[i].name.fi : data[i].name.en;
        // const description = (data[i].description.en === undefined) ? data[i].description.fi : data[i].description.en;
        let infoUrl;
        if (data[i].info_url !== null) {
          infoUrl = (data[i].info_url.en !== undefined) ? data[i].info_url.en : 'n/a';
        } else {
          infoUrl = 'n/a';
        }
        // replyMsg += `${i + 1}. ${name}: ${description}. More: ${infoUrl}\n`; //with description
        replyMsg += `${i + 1}. ${name}. More: ${infoUrl}\n`;
      }
      resPayload.message.text = striptags(replyMsg);
      return axios.post(fbGraphApi, resPayload);
    })
    .catch(error => {
      resPayload.message.text = 'Sorry, we cannot find any event';
      axios.post(fbGraphApi, resPayload);
      callback(error);
    });
};
