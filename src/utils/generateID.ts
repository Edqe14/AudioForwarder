import { createHash, randomBytes } from 'crypto';

export default (): string => {
  return createHash('md5')
    .update(Date.now().toString())
    .update(randomBytes(8))
    .update(randomBytes(2))
    .digest('hex');
};
