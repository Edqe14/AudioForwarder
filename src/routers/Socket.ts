import { Server, Socket } from 'socket.io';
import ss from 'socket.io-stream';
import { Mixer, Input } from 'audio-mixer';
import { Collection } from 'discord.js-light';
import { logger } from '../Logger';

export default (server: import('https').Server, streams: Collection<string, { piped: boolean, stream?: import('stream').Readable, input?: Input }>, transcoders: Collection<string, import('stream').PassThrough>, mixer: Mixer) => {
  const io = new Server(server, {
    path: '/socket'
  });

  const socketHandler = (socket: Socket) => {
    logger.info(`Socket.io client connected with ID: ${socket.id}`);

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

      logger.info(`Socket.io client with ID "${socket.id}", requested raw data for user ID "${id}"`);
      const stream = ss.createStream();
      ss(socket).emit('raw', stream, {
        pid,
        id
      });

      const dcHandler = () => {
        (id === 'mix' ? mixer : streams.get(id).stream).unpipe(stream);
        stream.destroy();
        socket.removeListener('disconnect', dcHandler);
      };
      socket.on('disconnect', dcHandler);

      return (id === 'mix' ? mixer : streams.get(id).stream).pipe(stream);
    });

    socket.on('stream', (data) => {
      const pid = data.pid;
      if (!pid) {
        return socket.emit('error', {
          message: 'Invalid PID'
        });
      }

      const format: string = data.format ?? 'aac';
      const stream = transcoders.get(format);
      if (stream) {
        logger.info(`Socket.io client with ID "${socket.id}", requested stream data`);
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
      logger.info(`Socket.io client disconnected with ID: ${socket.id}`);
      socket.removeAllListeners();
      ss(socket).removeAllListeners();
    });
  }

  io.on('connection', socketHandler);
  return io;
}