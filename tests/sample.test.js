const assert = require('assert');

function add(a, b) {
  return a + b;
}

try {
  assert.strictEqual(add(1, 2), 3, '1 + 2 should equal 3');
  console.log('Sample test passed');
} catch (error) {
  console.error('Sample test failed');
  console.error(error);
  process.exit(1);
}

module.exports = { add };
