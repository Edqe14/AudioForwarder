const io = require('socket.io-client');
const ss = require('socket.io-stream');
const { Dumper } = require('../utils.js');

// class Logger extends Dumper {
//   _write (c, e, cb) {
//     console.log(c.length);
//     cb();
//   }
// }

const socket = io.connect('ws://localhost:8080/');
socket.on('connect', () => {
  console.log('[DEBUG] Connected to the WebSocket');

  (() => {
    const pid = Math.random() * 10000;
    socket.emit('raw', {
      pid,
      id: '234395307759108106'
    });
    console.log(`[DEBUG] Request raw data with PID: ${pid}`);
  })();

  ss(socket).on('raw', (stream, data) => {
    console.log(`[DEBUG] Got raw stream for "${data.id}" (${data.pid})`);
    stream.pipe(new Dumper());
  });

  (() => {
    const pid = Math.random() * 10000;
    socket.emit('stream', {
      pid
    });
    console.log(`[DEBUG] Request stream data with PID: ${pid}`);
  })();

  ss(socket).on('stream', (stream, data) => {
    console.log(`[DEBUG] Got stream data (${data.pid})`);
    stream.pipe(new Dumper());
  });
});

socket.on('error', (e) => {
  console.error('[DEBUG] Got error from WebSocket', e);
});

socket.on('disconnect', () => {
  console.log('[DEBUG] Disconnected from the WebSocket');
});
