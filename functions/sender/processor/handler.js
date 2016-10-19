'use strict';

const axios = require('axios');
const striptags = require('striptags');
const fbGraphApi = process.env.FB_GRAPH_API;
const maxEvents = process.env.MAX_EVENTS;
const genericImg = process.env.GENERIC_IMAGE;
const genericUrl = process.env.GENERIC_URL;


const prepareFbPayload = (fbPayload, allEvents) => {
  if (allEvents.length === 0) {
    fbPayload.message.text = 'Sorry, we cannot find any event';
  } else {
    delete fbPayload.message['text'];
    fbPayload.message.attachment = {
      type: 'template',
      payload: {
        template_type: 'generic'
      }
    };
    const max = (allEvents.length < maxEvents) ? allEvents.length : maxEvents;
    console.log(max);
    let allEventElements = [];
    for (let i = 0; i < max; i++) {
      let eventName = '';
      if (allEvents[i].name.en === undefined || allEvents[i].name.en === '') {
        eventName = allEvents[i].name.fi;
      } else {
        eventName = allEvents[i].name.en;
      }
      let infoUrl = genericUrl;
      if (allEvents[i].info_url !== null) {
        infoUrl = (allEvents[i].info_url.en !== undefined) ? allEvents[i].info_url.en : allEvents[i].info_url.fi;
      }
      let imageUrl = genericImg;
      if (allEvents[i].images.length > 0) {
        imageUrl = allEvents[i].images[0].url;
      }
      const singleEventElement = {
        title: eventName,
        image_url: imageUrl,
        subtitle: eventName,
        buttons: [
          {
            type: 'web_url',
            url: (infoUrl === '') ? genericUrl : infoUrl,
            title: 'More details'
          }
        ]
      };
      allEventElements.push(singleEventElement);
    }
    console.info('all event elements:', JSON.stringify(allEventElements, null, 2));
    fbPayload.message.attachment.payload.elements = allEventElements;
  }
  return fbPayload;
};


module.exports.handler = (event, context, callback) => {
  console.info('invoke lambda function processor');
  console.info('event:', JSON.stringify(event, null, 2));
  const apiEndpoint = (event.city === 'helsinki') ? process.env.HKI_LINKEDEVENT_API : process.env.TKU_LINKEDEVENT_API;
  let queryApi = `${apiEndpoint}q=${event.type}&start=${event.time}`;
  if (event.endtime !== undefined) {
    queryApi += `&end=${event.endtime}`;
  }
  let fbPayload = event.payload;
  console.info(`query api: ${queryApi}`);
  axios.get(queryApi)
    .then(response => {
      const allEvents = response.data.data;
      fbPayload = prepareFbPayload(fbPayload, allEvents);
      console.info('FB payload:', JSON.stringify(fbPayload, null, 2));
      console.info(`FB api: ${fbGraphApi}`);
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
