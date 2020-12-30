const { join } = require('path');
const express = require('express');
const helmet = require('helmet');
const socketio = require('socket.io');
const ss = require('socket.io-stream');
const morgan = require('morgan');
const { createServer } = require('https');
const fs = require('fs');

/**
 * Create new server/express app
 * @param {import('discord.js').VoiceConnection} connection Voice connection
 * @param {?Map<string, {
 *  piped: boolean,
 *  stream: ?import('stream').Readable,
 *  input: ?import('audio-mixer').Input
 * }>} streams Streams collection
 * @param {object} transcoders Transcoders object
 */
module.exports = (streams, transcoders) => {
  const app = express();
  app.use(helmet());
  app.use(morgan('[DEBUG] :method :url :status :res[content-length] - :response-time ms'));
  const server = createServer({
    key: fs.readFileSync(join(__dirname, 'cert', 'server.key'), 'utf-8'),
    cert: fs.readFileSync(join(__dirname, 'cert', 'server.cert'), 'utf-8')
  }, app);
  /**
   * @type {socketio.Server}
   */
  const io = socketio(server, {
    wsEngine: 'ws'
  });

  /**
   * Socket.io/WS handler
   * @param {socketio.Socket} socket
   */
  const socketHandler = (socket) => {
    console.log(`[DEBUG] WebSocket client connected with ID: ${socket.id}`);
    socket.on('raw', (data) => {
      const pid = data.pid;
      if (!pid) {
        return socket.emit('error', {
          message: 'Invalid PID'
        });
      }

      const id = data.id;
      if (!id) {
        return socket.emit('error', {
          pid,
          message: 'Invalid ID'
        });
      }
      if (!streams.has(id)) {
        return socket.emit('error', {
          pid,
          error: 'Unknown ID'
        });
      }

      console.log(`[DEBUG] WebSocket client with ID "${socket.id}", requested raw data for user ID "${id}"`);
      const stream = ss.createStream();
      ss(socket).emit('raw', stream, {
        pid,
        id
      });

      const dcHandler = () => {
        stream.destroy();
        streams.get(id).stream.unpipe(stream);
        socket.removeListener('disconnect', dcHandler);
      };
      socket.on('disconnect', dcHandler);
      return streams.get(id).stream.pipe(stream);
    });

    socket.on('stream', (data) => {
      const pid = data.pid;
      if (!pid) {
        return socket.emit('error', {
          message: 'Invalid PID'
        });
      }

      const format = data.format || 'aac';
      const stream = transcoders[format];
      if (stream) {
        console.log(`[DEBUG] WebSocket client with ID "${socket.id}", requested stream data`);
        const st = ss.createStream();
        ss(socket).emit('stream', st, {
          pid
        });

        const dcHandler = () => {
          st.destroy();
          stream.unpipe(st);
          socket.removeListener('disconnect', dcHandler);
        };
        socket.on('disconnect', dcHandler);
        return stream.pipe(st);
      }

      return socket.emit('error', {
        pid,
        message: 'Not available'
      });
    });

    socket.on('disconnect', () => {
      console.log(`[DEBUG] WebSocket client disconnected with ID: ${socket.id}`);
      socket.removeAllListeners();
      ss(socket).removeAllListeners();
    });
  };
  io.on('connection', socketHandler);

  app.use((_, res, next) => {
    res.header({
      'Transfer-Encoding': 'chunked',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
      'X-Pad': 'avoid browser bug'
    });
    next();
  });
  app.get('/raw', (req, res) => {
    const id = req.query.id;
    if (!id) return res.status(400).send('Invalid ID');
    if (!streams.has(id)) return res.status(404).send('Unknown ID');
    res.header({
      'Content-Type': 'binary'
    });
    res.on('close', () => {
      streams.get(id).stream.unpipe(res);
      res.removeAllListeners();
    });
    return streams.get(id).stream.pipe(res);
  });

  app.use(require('compression')());
  app.use(express.static(join(__dirname, 'public')));
  app.get('/stream', (req, res) => {
    const format = req.query.format || 'aac';
    const stream = transcoders[format];
    if (stream) {
      try {
        res.header({
          'Content-Type': 'audio/' + format
        });

        res.on('close', () => {
          stream.unpipe(res);
          res.removeAllListeners();
        });
        return stream.pipe(res);
      } catch (e) {
        console.error(e);
      }
    }
    return res.status(423).send('Not available');
  });

  return {
    server,
    app,
    io
  };
};
