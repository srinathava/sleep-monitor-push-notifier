'use strict';

const admin = require("firebase-admin");
const request = require('request');
const throttle = require('throttle-debounce/throttle');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
var fs = require('fs');

class PushNotifier {
    constructor() {
        var serviceAccount = require("./adminsdk.json");

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://testproject-76824.firebaseio.com"
        });

        this.deviceTokens = new Map();

        this.sendNotification = throttle(2*60*1000, true, this._sendNotification);

        this.startServer();
        this.updateStatus();
        this.loadTokens();
    }

    tokenPath() {
        return path.join(__dirname, '.registration_tokens');
    }

    loadTokens() {
		fs.readFile(this.tokenPath(), 'utf8', (err, data) => {  
            if (err) {
                console.log(`Error reading from tokens file: ${err.message}`);
                return;
            }

            var tokensWithTimeSpec = JSON.parse(data);

            var tnow = Date.now();
            for (var{tstamp, token} of tokensWithTimeSpec) {
                if (tnow - tstamp < 2*24*60*60*1000) {
                    console.log(`Registering ${token} from disc.`);
                    this.deviceTokens.set(token, tstamp);
                }
            }
		});
    }

    saveTokens() {
        var tokensWithTimeSpec = [];
        for (var[token, tstamp] of this.deviceTokens) {
            tokensWithTimeSpec.push({tstamp, token});
        }

		fs.writeFile(this.tokenPath(), JSON.stringify(tokensWithTimeSpec), function(err, data) {
            if (err) throw err;
            console.log('Successfully wrote tokens to file');
        });
    }

    _sendNotification() {
        if (this.deviceTokens.size == 0) {
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

        admin.messaging().sendToDevice(Array.from(this.deviceTokens.keys()), payload, options)
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

            this.deviceTokens.set(req.body.token, Date.now());
            this.saveTokens();

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({response: 'ok'}));
        });

        var port = 4000;
        app.listen(port);
        console.log('Listening at http://localhost:' + port)
    }

}

exports.PushNotifier = PushNotifier;
