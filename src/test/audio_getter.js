const a = require('axios');
const format = 'mp3';
const { Agent } = require('https');

const w = require('fs').createWriteStream('out.' + format);
a({
  method: 'get',
  url: 'https://localhost:8080/stream?format=' + (format === 'adts' ? 'aac' : format),
  responseType: 'stream',
  httpsAgent: new Agent({
    rejectUnauthorized: false
  })
}).then(res => res.data.pipe(w));
