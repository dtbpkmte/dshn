# dshn - IoT/Smart Home Network

A platform for IoT/Smart Home applications.

Introduction
------------

This project aims to create a platform for IoT/Smart Home applications. The main objective is to make managing a network of IoT devices easily. More specifically, this platform enables users to:
- Add/remove any device to/from the network easily
- Monitor data of all devices in real time via browsers, with planned support for audio/video
- Control actuator devices via browsers in real time

Platform Design
---------------

This platform has 2 main components: a central server, and a template for devices.

### Server

![Server Structure](https://user-images.githubusercontent.com/46307950/124573668-f7818d00-de73-11eb-9a05-659c06a45ed7.png)

The server is run on a computer that has a MQTT broker and NodeJS installed (I choose Raspberry Pi 4). Server communicates with devices via MQTT, where each device has their own data topics that server subscribes to. Stream devices like camera can also connect to server directly via WebSocket. The data are served in real time through WebSocket to clients. Clients (users) can also command devices in the Web UI. 

### Device Code Template (TBA)

The template is used as starting code for devices. It contains "standard" code to communicate with the server. Users only need to write the main program logic for the device and specify optional parameters like device's name and topics' names.

Progress
-------- 

Note: I don't have much knowledge in Web development so I'm still learning while doing. Also I will focus on the server and devices and not the UI.

Objectives:
- data from devices to clients
- streams from devices to clients
- clients can control devices
- integrate database to store data for analytics/AI
- integrate with Amazon Alexa/Google Assistant
- improve security
- improve UI

Updates:
- 06/07/2021:
    - Completed device managing code in server
    - Completed sensor data transmission in server and client sides
- 07/07/2021:
    - Web UI now shows connectivity of devices: green is connected, red is disconnected (achieved by using 2 classes)

Credits and References
----------------------

### References

- Using WebSocket and camera streaming: https://github.com/Inglebard/esp32cam-relay/tree/main/nodejs_server

### Libraries used:

- Server side (NodeJS):
    - Express.js
    - ws
    - MQTT.js

- Template:
    - 