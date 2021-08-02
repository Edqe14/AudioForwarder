export default (secNSec: number | number[]): number => {
  if (Array.isArray(secNSec)) return secNSec[0] * 1000 + secNSec[1] / 1000000;
  return secNSec / 1000;
};
