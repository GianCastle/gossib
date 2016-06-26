/*jshint esversion:6 */

const request = require('request');
const db = require('./db');

var receivedPostback = function (event) {
    const senderID = event.sender.id;
    const recipientID = event.recipient.id;
    const timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    const payload = event.postback.payload;

    console.log(`Received postback for user ${senderID} and page ${recipientID} with payload ${payload} at ${timeOfPostback}`);

    switch (payload) {
        case 'gossipGuy':
            //sendTextMessage(senderID, `Mira...cuentamelo ahorita que ando en desarrollo todavía ¯|_ツ_|¯`);
            sendTextMessage(senderID, `Escribe en un sólo mensaje el cuento y al inicio o al final la palabra "chisme" `);

            break;
        case 'gossibTalk':
             db.findOneRandom((error, result) => sendTextMessage(senderID,(error) ? error : result.message));
             //sendTextMessage(senderID, `Mira...te digo ahorita que todavía el cabrón este me sigue desarrollando ¯|_ツ_|¯`);
            break;
    }
};


var receivedDeliveryConfirmation = function (event) {
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
};



var callSendAPI = function (messageData) {
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
};

var sendTextMessage = function (recipientId, messageText) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    callSendAPI(messageData);
};



var receivedMessage = function (event) {
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
};

var sendGenericMessage = function (recipientId) {
    let messageData = {
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
};

var sendButtonMessage = function (recipientId) {
  let messageData = {
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
};

module.exports.sendTextMessage = sendTextMessage;
module.exports.sendButtonMessage =  sendButtonMessage;
module.exports.sendGenericMessage =  sendGenericMessage;
module.exports.receivedMessage = receivedMessage;
module.exports.receivedDeliveryConfirmation = receivedDeliveryConfirmation;
module.exports.receivedPostback =  receivedPostback;
module.exports.callSendAPI = callSendAPI;
