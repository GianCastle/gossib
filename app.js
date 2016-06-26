/* jshint esversion: 6 */

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const emoji = require('node-emoji');
const Messenger =  require('./messenger');
const db = require('./db');
const app = express();


app.use(bodyParser.json());

app.get('/', (req, res) => res.send('Aqui no hay nada')); //Main route. Nothing there

//Verify Facebook App token route
app.get('/webhook', function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === 'stimulated345a6e047e') {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

//Messenger POST  entry route
app.post('/webhook', function(req, res) {
    const data = req.body;
    // Make sure this is a page subscription
    if (data.object == 'page') {
        // Iterate over each entry
        // There may be multiple if batched
        data.entry.forEach(function(pageEntry) {
            let pageID = pageEntry.id;
            let timeOfEvent = pageEntry.time;

            // Iterate over each messaging event
            pageEntry.messaging.forEach(function(messagingEvent) {
                if (messagingEvent.optin) {
                    receivedAuthentication(messagingEvent);
                } else if (messagingEvent.message) {
                    receivedMessage(messagingEvent);
                } else if (messagingEvent.delivery) {
                    receivedDeliveryConfirmation(messagingEvent);
                } else if (messagingEvent.postback) {
                    receivedPostback(messagingEvent);
                } else {
                    console.log(`Webhook received unknown messagingEvent: ${messagingEvent}`);
                }
            });
        });

        // send back a 200, within 20 seconds, to let us know you've
        // successfully received the callback. Otherwise, the request will time out.
        res.sendStatus(200);
    }
});



function receivedDeliveryConfirmation(event) {
    const senderID = event.sender.id;
    const recipientID = event.recipient.id;
    const delivery = event.delivery;
    const messageIDs = delivery.mids;
    const watermark = delivery.watermark;
    const sequenceNumber = delivery.seq;

    if (messageIDs) {
        messageIDs.forEach((messageID) => console.log(`Received delivery confirmation for message ID: ${messageID}`));
    }

    console.log("All message before %d were delivered.", watermark);
}


function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: "EAAEKT0pyDacBAP0oenjE5qaaAiDX6BRSo3NBEjOZCx72I4kVS20SAoQ2TJBT9P81pMYnxBE8WbZAlVzp1ZCKnFZALD1lwX8W7j5g3zozmTmr1AO6JII7sVVWmxZAbjiQHvXZAheZBDVBn5k1AA3dFLzJckZCauUiWV3Sbutgf1XfcwZDZD"
        },
        method: 'POST',
        json: messageData

    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            const recipientId = body.recipient_id;
            const messageId = body.message_id;

            console.log(`Successfully sent generic message with id ${messageId} to recipient ${recipientId}`);
        } else {
            console.error("Unable to send message.");
            console.error(response);
            console.error(error);
        }
    });
}


function sendTextMessage(recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    callSendAPI(messageData);
}

function receivedMessage(event) {
    const senderID = event.sender.id;
    const recipientID = event.recipient.id;
    const timeOfMessage = event.timestamp;
    const message = event.message;

    console.log(`Received message for user ${senderID} and page ${recipientID} at ${timeOfMessage} with message:${JSON.stringify(message)}`);

    const messageId = message.mid;
    const messageText = message.text;
    const messageAttachments = message.attachments;

    if (messageText) {
            switch(messageText.toLowerCase()) {
              case 'gossib':
              case 'hey gossip':
              case 'dime a ver':
              case 'klk':
              case 'button':
              case 'instrucciones':
              case 'test':
              case 'hey':
              case 'hola':
              case ':v':
                sendGenericMessage(senderID);
                break;
            }

          if(messageText.toLowerCase().includes('chisme')) {
          //Remove 'chisme' keyword and  whitespaces after remove the keyword
              let removeGossipKeyword = messageText.replace(/chisme/g, '')
                                             .replace(/  /g, ' ');

            db.saveGossip(removeGossipKeyword);
            sendTextMessage(senderID, 'Entiendo... shit happens. lol');
          }
    } else if (messageAttachments) {
        sendTextMessage(senderID, `Lo siento. Mi amo aún no me programa para procesar eso. Escribe  "instrucciones":v`);
    }
}

function sendGenericMessage(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: "Hola, soy Gossib",
                        subtitle: "Revela tus secretos conmigo. Lo mostraré al mundo de manera anonima.",
                        item_url: "https://castlestudio.me",
                        image_url: "http://cdn1.tnwcdn.com/wp-content/blogs.dir/1/files/2015/04/gossip.jpg",
                        buttons: [{
                            type: "postback",
                            title: "Cúentame un chisme",
                            payload: "gossibTalk",
                        }, {
                            type: "postback",
                            title: "Contaré un chisme",
                            payload: "gossipGuy"
                        }],
                    },{
                        title: 'Nunca olvides poner "chisme"',
                        subtitle: 'Así sabré cuando me estás diciendo un disparate o no :v',
                        item_url: 'https://fb.me/gossipbot',
                        image_url: 'http://dandounpaseo.com/blog/wp-content/uploads/2013/07/captura-de-pantalla-2013-07-10-a-las-17-19-12.png'
                }]
                },
            }
        }
    };

    callSendAPI(messageData);
}

function sendButtonMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: "This is test text",
          buttons:[{
            type: "web_url",
            url: "http://castlestudio.me",
            title: "Open Web URL"
          }, {
            type: "postback",
            title: "Call Postback",
            payload: "Developer defined postback"
          }]
        }
      }
    }
  };

  callSendAPI(messageData);
}

app.listen(process.env.PORT || 3000);
