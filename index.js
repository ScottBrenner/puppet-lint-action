const { run } = require('./lib/puppetLint');

try {
  run();
} catch (error) {
  console.log(`::error::${error.message}`);
  process.exitCode = error.exitCode || 1;
}
