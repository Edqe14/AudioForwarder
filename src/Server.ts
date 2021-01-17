import { Mixer, Input } from 'audio-mixer';
import { Collection } from 'discord.js-light';
import express from 'express';
import { join } from 'path';
import helmet from 'helmet';
import morgan from 'morgan';
import https from 'https';
import http from 'http';
import fs from 'fs';
import compression from 'compression';
import { logger } from './Logger';

export const MIME_TYPES = new Collection([
  ['aac', 'audio/aac'],
  ['mp3', 'audio/mp3'],
  ['wav', 'audio/wav']
]);

import Stream from './routers/Stream';

const PORT = process.env.PORT || 8443;
const HTTP_PORT = process.env.HTTP_PORT || 8080;

export default (streams: Collection<string, { piped: boolean, stream?: import('stream').Readable, input?: Input }>, transcoders: Collection<string, import('stream').PassThrough>, Mixer: Mixer) => {
  const app = express();
  app.use(helmet());
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms', {
    stream: {
      write: (msg) => logger.info(msg)
    }
  }));
  app.use((req, res, next) => {
    res.header({
      'Content-Security-Policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
    });
    if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
      return res.redirect(`https://${req.hostname}:${PORT}${req.url}`);
    }
    next();
  });

  const httpServer = http.createServer(app);
  const server = https.createServer({
    key: fs.readFileSync(join(__dirname, '..', 'cert', 'server.key'), 'utf-8'),
    cert: fs.readFileSync(join(__dirname, '..', 'cert', 'server.cert'), 'utf-8')
  }, app);

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
  app.use(compression());
  app.use(express.static(join(__dirname, 'public')));
  app.use('/stream', Stream(server, streams, transcoders, Mixer));

  server.listen(PORT, () => logger.info(`HTTPS Server is listening on port ${PORT}`));
  httpServer.listen(HTTP_PORT, () => logger.info(`HTTP Server is listening on port ${HTTP_PORT}`));

  return {
    server,
    httpServer,
    app
  }
}