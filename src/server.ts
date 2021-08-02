import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import Config from './config';
import path from 'path';
import { Logger } from 'winston';

interface IServer {
  app: Express;
  server: import('http').Server;
  PORT: number;
}

export default (logger: Logger): IServer => {
  const app = express();
  app.use(cors());
  app.use(
    morgan('tiny', {
      stream: {
        write: (msg) => logger.info(msg),
      },
    })
  );
  app.use('/streams', express.static(Config.hlsPath));
  app.use('/:id', (req, res) =>
    res.sendFile(path.join(__dirname, 'test.html'))
  );

  const PORT = parseInt(process.env.PORT, 10) || 3000;
  const server = app.listen(PORT, () =>
    logger.info(`Listening to port ${PORT}`)
  );

  return { app, server, PORT };
};
