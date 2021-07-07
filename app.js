const express = require('express')
const app = express()
const server = require('http').createServer(app);
const httpPort = 3000

const WebSocket = require('ws');
const url = require('url');
const wss_clients = new WebSocket.Server({ noServer: true });
const wss_streams = new WebSocket.Server({ noServer: true });

var mqtt = require('mqtt');
const { connect } = require('mqtt');
const { connected, send } = require('process');
var mqttClient = mqtt.connect('mqtt://192.168.0.101:2883');

/* Custom libraries */

// const { removeElementTemplate } = require('./utils.js');
// const { exit } = require('process');
// const removeElementByName = removeElementTemplate((e) => e.name);

/**********End of Section **********/

/* Server state variables */

// An element in connected_devs has the following format:
// <dev_name>:{
//   	"type":<type>,
//   	"topics":{ <topic1>:<topic1_type>, 
//                 <topic2>:<topic2_type>, 
//               }
let connected_devs = {};
// subscribed_topics is an object with each element following this format:
// <topic_name>:{
// 		            "type":<topic_type>,
// 		            "dev":<dev_name>,
// 	            }
let subscribed_topics = {};
// send_data is an object with each element having following format:
// <dev_name>:{
// 		        <topic1>:{"type":<topic1_type>, "data":<topic1_data>},
// 		        <topic2>:{"type":<topic2_type>, "data":<topic2_data>},
// 	          }
let send_data = {};
let data_sent = false;

function broadcastData() {
    if (!data_sent) {
        wss_clients.clients.forEach((client) => {
            client.send(JSON.stringify(send_data));
        });
        data_sent = true;
    }
}
const broadcastInterval = setInterval(broadcastData, 10); // sends data every 10ms

/**********End of Section **********/

// mqtt
mqttClient.on('connect', function () {
    mqttClient.subscribe('Status', {qos:1}, function (err) {
        if (!err) {
            console.log("Subscribed to Status");
        }
    });
    
    for (const t in subscribed_topics) {
        mqttClient.subscribe(t, function (err) {
            if (err) {
                console.log(`Error subscribing to ${t}`);
            }
        });
    }
});

mqttClient.on('message', function (topic, message) {
    if (topic === "Status") {
        let msg_array = message.toString().split('/');
        let dev_name = msg_array[0];
        let dev_command = msg_array[1];
        switch (dev_command) {
            case 'CONNECT':
                connected_devs[dev_name] = {"type":msg_array[2], "topics":{}};
                break;
            case 'DISCONNECT':
                if (!connected_devs.hasOwnProperty(dev_name)) {
                    console.log(`WARNING: Can't Delete - Device Name Not Found: ${dev_name}`);
                } else {
                    delete connected_devs[dev_name];
                    for (t in subscribed_topics) {
                        if (subscribed_topics[t].dev == dev_name) delete subscribed_topics[t];
                    }

                    // notify client about disconnection
                    if (data_sent) {
                        send_data = {};
                        data_sent = false;
                    }
                    send_data[dev_name] = { "disconnected":"" };
                }

                break;
            case 'REGISTER':
                if (!connected_devs.hasOwnProperty(dev_name)) {
                    console.log(`ERROR: Device Name Not Found: ${dev_name}`);
                    return;
                }

                let new_topics = msg_array[2].split(',');
                for (let i = 0; i < new_topics.length; ++i) {
                    let tmp = new_topics[i].split(':');

                    // subscribe
                    mqttClient.subscribe(tmp[0], function (err) {
                        if (err) {
                            console.log(`Error subscribing to ${tmp[0]}`);
                        }
                    });

                    connected_devs[dev_name].topics[tmp[0]] = tmp[1];
                    subscribed_topics[tmp[0]] = {"type": tmp[1], "dev": dev_name};
                }
                break;
            case 'UNREGISTER':
                if (!connected_devs.hasOwnProperty(dev_name)) {
                    console.log(`ERROR: Device Name Not Found: ${dev_name}`);
                    return;
                }

                let to_delete = msg_array[2].split(',');
                for (let i = 0; i < to_delete.length; ++i) {
                    delete connected_devs[dev_name].topics[to_delete[i]];
                    delete subscribed_topics[to_delete[i]];

                    // unsubscribe
                    mqttClient.unsubscribe(to_delete[i], function (err) {
                        if (err) {
                            console.log(`Error unsubscribing to ${to_delete[[i]]}`);
                        }
                    });
                }
                break;
            default:
                console.log(`ERROR: Invalid device command: ${msg_array[2]}`);
        }

        // debug
        console.log(connected_devs);
        console.log(subscribed_topics);
        console.log();

    } else {
        // pack data from MQTT here to send to clients via websocket
        if (data_sent) { // if current data is old, refresh whole packet
            send_data = {};
            data_sent = false;
        }      
        let dev_name = subscribed_topics[topic].dev;
        if (!send_data.hasOwnProperty(dev_name)) {
            send_data[dev_name] = {};
        }
        send_data[dev_name][topic] = {"type": subscribed_topics[topic].type, "data": message.toString()};
    }
});

// websocket
wss_clients.on('connection', function connection(ws) {
    ws.on('message', function incoming(msg) {
        // process commands from clients here
        console.log(`wss_clients Received msg: ${msg}`);
    });
    
    // send a welcome message containing a list of connected devices
    let msg_welcome = {};
    for (cdev in connected_devs) {
        msg_welcome[cdev] = {};
    }
    ws.send(JSON.stringify(msg_welcome));
});

server.on('upgrade', function upgrade(request, socket, head) {
    const pathname = url.parse(request.url).pathname;
  
    if (pathname === '/client') {
        wss_clients.handleUpgrade(request, socket, head, function done(ws) {
            wss_clients.emit('connection', ws, request);
        });
    } else if (pathname === '/stream') {
        wss_streams.handleUpgrade(request, socket, head, function done(ws) {
            wss_streams.emit('connection', ws, request);
        });
    } else {
        socket.destroy();
    }
});

// http server
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

server.listen(httpPort, () => {
    console.log(`App listening at http://localhost:${httpPort}`);
});