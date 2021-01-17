import axios from 'axios';
import { Dumper } from '../Utils';
import { Agent } from 'https';

const format = 'aac';
const clientAdd = 50;
let count = 0 + clientAdd;
let max = 0;
(async () => {
  for (max; max < count; max++) {
    const res = await axios({
      method: 'get',
      url: 'https://localhost:8443/stream?format=' + format,
      responseType: 'stream',
      httpsAgent: new Agent({
        rejectUnauthorized: false
      })
    });
    res.data.pipe(new Dumper());
    console.log(`[${max + 1}] Got response`);
    if (max === count - 1) {
      console.log(`Reached ${count}, adding ${clientAdd} more...`);
      count += clientAdd;
    }
  }
})();
