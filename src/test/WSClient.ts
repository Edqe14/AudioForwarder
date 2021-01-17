import { io } from 'socket.io-client';
import ss from 'socket.io-stream';
import { Dumper } from '../Utils';

const socket = io({
  path: '/socket'
});

interface Data {
  id: string;
  pid: any;
  [key: string]: any;
}

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

  ss(socket).on('raw', (stream: any, data: Data) => {
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

  ss(socket).on('stream', (stream: any, data: Data) => {
    console.log(`[DEBUG] Got stream data (${data.pid})`);
    stream.pipe(new Dumper());
  });
});

socket.on('error', (e: any) => {
  console.error('[DEBUG] Got error from WebSocket', e);
});

socket.on('disconnect', () => {
  console.log('[DEBUG] Disconnected from the WebSocket');
});
