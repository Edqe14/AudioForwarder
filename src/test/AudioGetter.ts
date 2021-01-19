import axios from 'axios';
import { Agent } from 'https';

const format = 'ogg';
const w = require('fs').createWriteStream('out/out.' + format);

axios({
  method: 'get',
  url: 'https://localhost:8443/stream?format=' + format,
  responseType: 'stream',
  httpsAgent: new Agent({
    rejectUnauthorized: false
  })
}).then(res => res.data.pipe(w));
