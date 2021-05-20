import express, { Express } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import Config from './config';
import path from 'path';
import { Logger } from 'winston';

export default (logger: Logger): Express => {
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

  const PORT = 3000;
  app.listen(PORT, () => logger.info(`Listening to port ${PORT}`));

  return app;
};
