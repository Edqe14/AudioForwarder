const { join } = require('path');
const express = require('express');
const helmet = require('helmet');
const socketio = require('socket.io');
const ss = require('socket.io-stream');
const morgan = require('morgan');
const { createServer } = require('https');
const { createServer: createHttpServer } = require('http');
const fs = require('fs');

const MIME_TYPES = {
  aac: 'audio/aac',
  mp3: 'audio/mp3',
  wav: 'audio/wav',
  m4a: 'audio/mp4'
};

const PORT = process.env.PORT || 8443;
const HTTP_PORT = process.env.HTTP_PORT || 8080;

/**
 * Create new server/express app
 * @param {import('discord.js').VoiceConnection} connection Voice connection
 * @param {?Map<string, {
 *  piped: boolean,
 *  stream: ?import('stream').Readable,
 *  input: ?import('audio-mixer').Input
 * }>} streams Streams collection
 * @param {object} transcoders Transcoders object
 * @param {import('audio-mixer').Mixer} Mixer Audio mixer
 */
module.exports = (streams, transcoders, Mixer) => {
  const app = express();
  app.use(helmet());
  app.use(morgan('[DEBUG] :method :url :status :res[content-length] - :response-time ms'));
  app.use((req, res, next) => {
    res.header({
      'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
    });
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.hostname}:${PORT}${req.url}`);
    }
    next();
  });
  const httpServer = createHttpServer(app);
  const server = createServer({
    key: fs.readFileSync(join(__dirname, '..', 'cert', 'server.key'), 'utf-8'),
    cert: fs.readFileSync(join(__dirname, '..', 'cert', 'server.cert'), 'utf-8')
  }, app);

  /**
   * @type {socketio.Server}
   */
  const io = socketio(server);

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
      if (!id && id !== 'mix') {
        return socket.emit('error', {
          pid,
          message: 'Invalid ID'
        });
      }
      if (!streams.has(id) && id !== 'mix') {
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
        if (id === 'mix') Mixer.unpipe(stream);
        else streams.get(id).stream.unpipe(stream);
        stream.destroy();
        socket.removeListener('disconnect', dcHandler);
      };
      socket.on('disconnect', dcHandler);
      if (id === 'mix') return Mixer.pipe(stream);
      else return streams.get(id).stream.pipe(stream);
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
          stream.unpipe(st);
          st.destroy();
          socket.removeListener('disconnect', dcHandler);
        };
        socket.on('disconnect', dcHandler);
        st.on('close', dcHandler);
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
      'Accept-Range': 'bytes',
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
          'Content-Type': MIME_TYPES[format]
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

  server.listen(PORT, () => console.log(`[DEBUG] HTTPS Server is listening on port ${PORT}`));
  httpServer.listen(HTTP_PORT, () => console.log(`[DEBUG] HTTP Server is listening on port ${HTTP_PORT}`));

  return {
    server,
    httpServer,
    app,
    io
  };
};
