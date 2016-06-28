/* jshint esversion: 6 */

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const emoji = require('node-emoji');
const path = require('path');
const db = require('./db');
const messenger =  require('./messenger');
const app = express();

app.use(bodyParser.json());
app.use( bodyParser.urlencoded({ extended : true }));
//app.use(express.static( path.join( __dirname, 'public' )));


app.set('view engine', 'pug');
app.set( 'views', path.join( __dirname, 'views' ));
app.use(express.static('public'));

app.get('/', (req, res) =>
  res.render('index',{pageTitle: 'Gossib Dashboard'}));

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
                    messenger.receivedAuthentication(messagingEvent);
                } else if (messagingEvent.message) {
                    messenger.receivedMessage(messagingEvent);
                } else if (messagingEvent.delivery) {
                    messenger.receivedDeliveryConfirmation(messagingEvent);
                } else if (messagingEvent.postback) {
                    messenger.receivedPostback(messagingEvent);
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

app.listen(process.env.PORT || 3000);
