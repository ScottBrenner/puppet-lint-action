const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const VERSION_PATTERN = /^[0-9A-Za-z._~+-]+$/;

/**
 * Reads a GitHub Action input from environment variables.
 *
 * @param {string} name - Input name as defined in action.yml.
 * @param {string} [defaultValue=''] - Fallback when the env var is unset.
 * @returns {string} Trimmed input value.
 */
function getInput(name, defaultValue = '') {
  const key = `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
  const value = process.env[key];
  return value !== undefined ? value.trim() : defaultValue;
}

/**
 * Validates and returns the optional puppet-lint gem version input.
 *
 * @param {string} version - Raw version string.
 * @returns {string} Validated version string or empty string.
 */
function validateVersion(version) {
  if (!version) {
    return '';
  }
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(`Invalid puppet-lint version: "${version}"`);
  }
  return version;
}

/**
 * Appends a directory to GITHUB_PATH so subsequent workflow steps can use it.
 *
 * @param {string} binDir - Directory containing installed executables.
 */
function addToPath(binDir) {
  const githubPath = process.env.GITHUB_PATH;
  if (githubPath) {
    fs.appendFileSync(githubPath, `${binDir}${os.EOL}`);
  }
}

/**
 * Exports an environment variable to GITHUB_ENV for subsequent workflow steps.
 *
 * @param {string} name - Environment variable name.
 * @param {string} value - Environment variable value.
 */
function exportEnv(name, value) {
  const githubEnv = process.env.GITHUB_ENV;
  if (githubEnv) {
    fs.appendFileSync(githubEnv, `${name}=${value}${os.EOL}`);
  }
}

/**
 * Builds an environment object with binDir on PATH and gemDir on GEM_PATH.
 *
 * @param {string} binDir - Directory containing puppet-lint executable.
 * @param {string} gemDir - Directory containing installed Ruby gems.
 * @param {NodeJS.ProcessEnv} [baseEnv=process.env] - Base environment variables.
 * @returns {NodeJS.ProcessEnv} Updated environment variables.
 */
function buildEnv(binDir, gemDir, baseEnv = process.env) {
  const pathKey =
    Object.keys(baseEnv).find((k) => k.toUpperCase() === 'PATH') || 'PATH';
  const currentPath = baseEnv[pathKey] || '';
  const updatedPath = currentPath
    ? `${binDir}${path.delimiter}${currentPath}`
    : binDir;

  const currentGemPath = baseEnv.GEM_PATH || '';
  const updatedGemPath = currentGemPath
    ? `${gemDir}${path.delimiter}${currentGemPath}`
    : gemDir;

  return {
    ...baseEnv,
    [pathKey]: updatedPath,
    GEM_PATH: updatedGemPath,
  };
}

/**
 * Installs puppet-lint into an isolated directory under RUNNER_TEMP (or os.tmpdir()).
 *
 * @param {object} options
 * @param {string} [options.version=''] - Optional gem version constraint.
 * @param {Function} [options.spawn=spawnSync] - Process runner for testing.
 * @returns {{ binDir: string, gemDir: string }} Installation directories.
 */
function installPuppetLint({ version = '', spawn = spawnSync } = {}) {
  const tempRoot = process.env.RUNNER_TEMP || os.tmpdir();
  const installRoot = fs.mkdtempSync(path.join(tempRoot, 'puppet-lint-'));
  const gemDir = path.join(installRoot, 'gems');
  const binDir = path.join(installRoot, 'bin');

  fs.mkdirSync(gemDir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });

  const gemArgs = [
    'install',
    'puppet-lint',
    '--no-document',
    '--install-dir',
    gemDir,
    '--bindir',
    binDir,
  ];
  if (version) {
    gemArgs.push('--version', version);
  }

  const result = spawn('gem', gemArgs, {
    shell: process.platform === 'win32',
    stdio: 'inherit',
  });

  if (result.error) {
    throw new Error(`Failed to run gem install: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const err = new Error(`gem install exited with code ${result.status}`);
    err.exitCode = result.status || 1;
    throw err;
  }

  return { binDir, gemDir };
}

/**
 * Registers the puppet-lint problem matcher and runs puppet-lint with the given args.
 */
function run() {
  const args = getInput('args', './');
  const version = validateVersion(getInput('version', ''));

  const { binDir, gemDir } = installPuppetLint({ version });
  const env = buildEnv(binDir, gemDir);

  addToPath(binDir);
  exportEnv('GEM_PATH', env.GEM_PATH);

  const matcherPath = path.resolve(__dirname, '..', 'puppet-lint.json');
  console.log(`::add-matcher::${matcherPath}`);

  if (!args) {
    return;
  }

  const result = spawnSync(`puppet-lint ${args}`, {
    shell: true,
    stdio: 'inherit',
    env,
  });

  if (result.error) {
    throw new Error(`Failed to execute puppet-lint: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const err = new Error(`puppet-lint exited with code ${result.status}`);
    err.exitCode = result.status || 1;
    throw err;
  }
}

module.exports = {
  addToPath,
  buildEnv,
  exportEnv,
  getInput,
  installPuppetLint,
  run,
  validateVersion,
};
