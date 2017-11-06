'use strict';

const admin = require("firebase-admin");
const request = require('request');
const throttle = require('throttle-debounce/throttle');
const express = require('express');
const bodyParser = require('body-parser')

class PushNotifier {
    constructor() {
        var serviceAccount = require("./adminsdk.json");

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://testproject-76824.firebaseio.com"
        });

        this.deviceTokens = new Set();

        this.sendNotification = throttle(2*60*1000, true, this._sendNotification);

        this.startServer();
        this.updateStatus();
    }

    _sendNotification() {
        if (this.deviceTokens === []) {
            return;
        }

        const payload = {
            "data": {
                "type":"MOTION_DETECTED",
            }
        };

		const options = {
			priority: "high",
			timeToLive: 60 * 5
		};

        admin.messaging().sendToDevice(Array.from(this.deviceTokens), payload, options)
        .then(function(response) {
            console.log("Successfully sent message: ", response);
        })
        .catch(function(error) {
            console.log(`Error sending message ${error}`);
        });
    }

	updateStatus() {
        request(
            'http://localhost/status', 
            (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    var status = JSON.parse(body);
                    if (status.alarm != 0 || status.motion != 0) {
                        this.sendNotification();
                    }
                }
                setTimeout(()=>this.updateStatus(), 2000);
            }
        );
    }

    startServer() {
        var app = express();
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({
			extended: true
		}));

        app.get('/', function(req, res) {
            console.log('GET /')
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end('ready');
        });

        app.post('/registerToken', (req, res) => {
            console.log('POST /');
            console.dir(req.body);

            this.deviceTokens.add(req.body.token);

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({response: 'ok'}));
        });

        var port = 4000;
        app.listen(port);
        console.log('Listening at http://localhost:' + port)
    }

}

exports.PushNotifier = PushNotifier;
