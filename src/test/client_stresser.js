const a = require('axios');
const format = 'aac';

const clientAdd = 50;
let count = 0 + clientAdd;
let max = 0;
(async () => {
  for (max; max < count; max++) {
    await a({
      method: 'get',
      url: 'http://localhost:8080/stream?format=' + format,
      responseType: 'stream'
    });
    console.log(`[${max + 1}] Got response`);
    if (max === count - 1) {
      console.log(`Reached ${count}, adding ${clientAdd} more...`);
      count += clientAdd;
    }
  }
})();
