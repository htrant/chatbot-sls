#chatbot-sls
The project aims at utilizing [Linked Events APIs](https://dev.hel.fi/projects/linked-events/) provided by 3 Finnish cities (Helsinki, Espoo, Turku) on project [6aika](http://6aika.fi/). Chatbot (initial target is Facebook Messenger) is able to answer city's public events based on user's chat requests.

Chatbot is developed with [Serverless Framework v0.5.6](https://serverless.readme.io/v0.5.0/docs), Nodejs (ECMAScript 6), and deployed on Amazon Web Services. During development time, [Serverless Framework v1.x](https://serverless.com/framework/docs/) was officially released with new concepts and features.

##Get started
####Configure AWS
Serverless framework needs AWS credentials, check [setup guide](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html).


####Initialize Serverless project
```
$ npm install
$ sls project init
$ sls stage create -s prod  #create stage prod
$ sls resources deploy  #deploy resources on AWS
```

####Add Serverless ENV variables
```
### _meta/variables/s-variables-common.json
{
  "fbAppVerifyToken": "YOUR_FACEBOOK_APP_TOKEN"
}

### _meta/variables/s-variables-prod.json
{
  "fbGraphApi": "https://graph.facebook.com/v2.6/me/messages?access_token= YOUR_FACEBOOK_PAGE_ACCESS_TOKEN"
}
```

####Deploy Lambda functions and APIs
```
$ sls dash deploy   #select endpoints and functions to deploy
```
