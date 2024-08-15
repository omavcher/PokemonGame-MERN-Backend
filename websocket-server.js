const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 8081 }); // Use a different port from your HTTP server

server.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (message) => {
    console.log(`Received message => ${message}`);
    // Handle incoming messages and broadcast them if necessary
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.send('Welcome to the WebSocket server!');
});

console.log('WebSocket server is running on ws://localhost:8081');
