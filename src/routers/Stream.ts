import { Router } from 'express';
import { Mixer, Input } from 'audio-mixer';
import { Collection } from 'discord.js-light';
import { MIME_TYPES } from '../Server';
import Config from '../Config';
import Socket from './Socket';

export default (server: import('https').Server, streams: Collection<string, { piped: boolean, stream?: import('stream').Readable, input?: Input }>, transcoders: Collection<string, import('stream').PassThrough>, mixer: Mixer) => {
  Socket(server, streams, transcoders, mixer)
  const router = Router();

  router.get('/', (req, res) => {
    const format = (req.query.format ?? 'aac') as string;
    const stream = transcoders.get(format);
    if (stream) {
      try {
        res.header({
          'Content-Type': MIME_TYPES.get(format)
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

  router.get('/raw', (req, res) => {
    const id = req.query.id as string;
    
    if (!id) return res.status(400).send('Invalid ID');
    if (Config.listenAll && id !== 'mix') return res.status(423).send('Not available');
    if (!streams.has(id) && id !== 'mix') return res.status(404).send('Unknown ID');

    res.header({
      'Content-Type': 'binary'
    });

    res.on('close', () => {
      (id === 'mix' ? mixer : streams.get(id).stream).unpipe(res);
      res.removeAllListeners();
    });

    return (id === 'mix' ? mixer : streams.get(id).stream).pipe(res);
  });

  return router;
}