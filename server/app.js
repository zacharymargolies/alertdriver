const express = require('express')
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(3000);
// WARNING: app.listen(80) will NOT work here!

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('SERVERSIDE SOCKET CONNECTED: ', socket.id);

  socket.on('update', () => {
    io.emit('update')
  });

  socket.on('blinked', () => {
    console.log('YOU BLINKED! I SAW!')
  })

  socket.on('smiled', () => {
    console.log('YOU SMILED! I SAW! :)')
  })

  socket.on('sendMessage', () => {
    console.log('I GOT THE MESSAGE');
  });
});
