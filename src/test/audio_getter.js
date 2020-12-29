const a = require('axios');
const format = 'mp3';

const w = require('fs').createWriteStream('out.' + format);
a({
  method: 'get',
  url: 'http://localhost:8080/stream?format=' + (format === 'adts' ? 'aac' : format),
  responseType: 'stream'
}).then(res => res.data.pipe(w));
