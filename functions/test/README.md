#test/benchmark
This function is used to simulate the chat messages between FB users and the chatbot. Purpose is to track whether the chatbot misses to answer user's messages.

It is currently set to pick a random number (1-100) as number of test replies sent to FB users. Change it by modifying this line:

```
const maxReplies = Math.floor(Math.random()*99) + 1;	//pick a random number between 1-100
```
