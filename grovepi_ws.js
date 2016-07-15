'use strict';

// Module imports
var WebSocketServer = require('ws').Server
  , express = require('express')
  , http = require('http')
  , util = require('util')
  , GrovePi = require('node-grovepi').GrovePi
;

// Grove Pi stuff
var Commands = GrovePi.commands
var Board = GrovePi.board
var UltrasonicDigitalSensor = GrovePi.sensors.UltrasonicDigital
var DHTDigitalSensor = GrovePi.sensors.DHTDigital
var LightAnalogSensor = GrovePi.sensors.LightAnalog
var Sound = GrovePi.sensors.base.Analog
var Dimmer = GrovePi.sensors.base.Analog
var Button = GrovePi.sensors.DigitalInput
var Led = GrovePi.sensors.DigitalOutput
var Buzz = GrovePi.sensors.DigitalOutput
var Relay = GrovePi.sensors.SPDTRelay

var board = undefined;
var wssession = undefined;

const LOG         = 'LOG';
const PROXIMITY   = 'PROXIMITY';
const TEMPERATURE = 'TEMPERATURE';
const HUMIDITY    = 'HUMIDITY';
const LIGHT       = 'LIGHT';
const DIMMER      = 'DIMMER';
const BUTTON      = 'BUTTON';
const SOUND       = 'SOUND';
const RELAY       = 'RELAY';
const SEP         = '|';


// Instantiate classes & servers
var app    = express()
  , router = express.Router()
  , server = http.createServer(app)
  ;

function log(message) {
  if ( wssession !== undefined) {
    var payload = LOG + SEP + message;
    wssession.send(payload);
  }
  console.log(message);
}

var relay = undefined
  , led = undefined
  , buzz = undefined;

function startWatch() {
  if (board)
    return;
  log('Starting Board setup')
  board = new Board({
    debug: true,
    onError: function(err) {
      log('TEST ERROR')
      log(err)
    },
    onInit: function(res) {
      if (res) {
        var ultrasonicSensor = new UltrasonicDigitalSensor(4)
        var dhtSensor = new DHTDigitalSensor(3, DHTDigitalSensor.VERSION.DHT11, DHTDigitalSensor.CELSIUS)
        var lightSensor = new LightAnalogSensor(2)
        var dimmer = new Dimmer(1);
        var button = new Button(2);
        led = new Led(5);
        buzz = new Buzz(6);
        relay = new Relay(7);
        var sound = new Sound(0);

        var message = '';

        log('GrovePi Version :: ' + board.version())

        // Button
        log('Button (start watch)')
        button.on('change', function(res) {
          if ( wssession)
            wssession.send(BUTTON + SEP + res);
        })
        button.watch(1) // milliseconds

        // Ultrasonic Ranger
        log('Ultrasonic Ranger Digital Sensor (start watch)')
        ultrasonicSensor.on('change', function(res) {
          if ( wssession)
            wssession.send(PROXIMITY + SEP + res);
        })
        ultrasonicSensor.watch()

        // Sound Sensor
        log('Sound Sensor (start watch)')
        sound.on('change', function(res) {
          if ( wssession)
            wssession.send(SOUND + SEP + res);
        })
        sound.watch()

        // DHT Sensor
        log('DHT Digital Sensor (start watch)')
        dhtSensor.on('change', function(res) {
          if ( wssession) {
            wssession.send(TEMPERATURE + SEP + res[0]);
            wssession.send(HUMIDITY + SEP + res[1]);
          }
        })
        dhtSensor.watch(500) // milliseconds

        // Light Sensor
        log('Light Analog Sensor (start watch)')
        lightSensor.on('change', function(res) {
          if ( wssession)
            wssession.send(LIGHT + SEP + res);
        })
        lightSensor.watch()

        // Dimmer
        log('Dimmer (start watch)')
        dimmer.on('change', function(res) {
          if ( wssession)
            wssession.send(DIMMER + SEP + res);
        });
        dimmer.watch();

      } else {
        log('TEST CANNOT START')
      }
    }
  })
  board.init()
}

// Detect CTRL-C
process.on('SIGINT', function() {
  log("Caught interrupt signal");
  log("Exiting gracefully");

  if (board) board.close()
  board = undefined;
  process.removeAllListeners()
  if (typeof err != 'undefined')
    console.log(err)

  process.exit(2);
});

var PORT = process.env.PORT || 8888;
var wsURI = '/ws';

// WEBSOCKET stuff - BEGIN
var wss = new WebSocketServer({
  server: server,
  path: wsURI,
  verifyClient: function (info) {
    return true;
  }
});

wss.on('connection', function(ws) {
  console.log("WS session connected");
  wssession = ws;
  startWatch();
  ws.on('close', function() {
    console.log("WS session disconnected");
    wssession = undefined;
  });
  ws.on('message', function(payload) {
    var ev = JSON.parse(payload);
    log('Setting ' + Object.keys(ev)[0] + ' to ' + ev[Object.keys(ev)[0]]);
    if ( ev.relay !== undefined && relay) {
      ev.relay ? relay.on() : relay.off();
    }
    if ( ev.buzzer !== undefined && buzz) {
      ev.buzzer ? buzz.on() : buzz.off();
    }
    if ( ev.green !== undefined && led) {
      ev.green ? led.on() : led.off();
    }
  });
});

// WEBSOCKET stuff - END

server.listen(PORT, function() {
  console.log("WS server running on http://localhost:" + PORT + wsURI);
});

