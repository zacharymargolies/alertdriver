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

  socket.on('lose', ({isBlinking, isSmiling}) => {
    socket.broadcast.emit('opponentLost', {isBlinking, isSmiling});
    if (isBlinking) {
      console.log('YOU BLINKED! I SAW!')
    } else if (isSmiling) {
      console.log('YOU SMILED! I SAW!')
    }

  });

  socket.on('newGame', () => {
    socket.broadcast.emit('opponentNewGame');
    io.emit('opponentGamePlay', false);
  });

  socket.on('opponentToggleGame', (opponentGamePlay) => {
    socket.broadcast.emit('opponentGamePlay', opponentGamePlay);
  });

  socket.on('powerUpPlay', (num) => {
    console.log('POWER UP PLAY')
    socket.broadcast.emit('opponentPowerUpPlay', num);
  });

});
