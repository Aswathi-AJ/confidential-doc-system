const normalizeToHex = (value) => {
  if (Buffer.isBuffer(value)) return value.toString('hex');

  if (typeof value === 'string') {
    if (/^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0) {
      return value;
    }
    return Buffer.from(value, 'binary').toString('hex');
  }

  return value;
};

module.exports = { normalizeToHex };