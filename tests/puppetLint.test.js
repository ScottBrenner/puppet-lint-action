const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { afterEach, describe, it } = require('node:test');

const {
  addToPath,
  buildEnv,
  exportEnv,
  getInput,
  installPuppetLint,
  validateVersion,
} = require('../lib/puppetLint');

describe('getInput', () => {
  afterEach(() => {
    delete process.env.INPUT_ARGS;
    delete process.env.INPUT_VERSION;
  });

  it('returns defaultValue when input env var is unset', () => {
    assert.equal(getInput('args', './'), './');
  });

  it('returns trimmed value when input env var is set', () => {
    process.env.INPUT_ARGS = '  manifests/  ';
    assert.equal(getInput('args', './'), 'manifests/');
  });

  it('returns empty string when input env var is explicitly empty', () => {
    process.env.INPUT_ARGS = '';
    assert.equal(getInput('args', './'), '');
  });
});

describe('validateVersion', () => {
  it('accepts empty string and valid version strings', () => {
    assert.equal(validateVersion(''), '');
    assert.equal(validateVersion('4.2.4'), '4.2.4');
    assert.equal(validateVersion('4.0.0-rc1'), '4.0.0-rc1');
  });

  it('rejects invalid version strings', () => {
    assert.throws(() => validateVersion('4.0.0; rm -rf /'), /Invalid puppet-lint version/);
    assert.throws(() => validateVersion('4.0.0 && echo hi'), /Invalid puppet-lint version/);
  });
});

describe('buildEnv', () => {
  it('prepends binDir to PATH and gemDir to GEM_PATH', () => {
    const env = buildEnv('/tmp/bin', '/tmp/gems', {
      PATH: '/usr/bin',
      GEM_PATH: '/usr/lib/gems',
    });

    assert.equal(env.PATH, `/tmp/bin${path.delimiter}/usr/bin`);
    assert.equal(env.GEM_PATH, `/tmp/gems${path.delimiter}/usr/lib/gems`);
  });

  it('sets GEM_PATH when unset', () => {
    const env = buildEnv('/tmp/bin', '/tmp/gems', { Path: 'C:\\Windows' });

    assert.equal(env.Path, `C:\\Windows` ? `/tmp/bin${path.delimiter}C:\\Windows` : '');
    assert.equal(env.GEM_PATH, '/tmp/gems');
  });
});

describe('GITHUB_PATH and GITHUB_ENV helpers', () => {
  it('appends to GITHUB_PATH and GITHUB_ENV files', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gha-test-'));
    const pathFile = path.join(tmpDir, 'github_path');
    const envFile = path.join(tmpDir, 'github_env');
    process.env.GITHUB_PATH = pathFile;
    process.env.GITHUB_ENV = envFile;

    try {
      addToPath('/tmp/bin');
      exportEnv('GEM_PATH', '/tmp/gems');

      assert.equal(fs.readFileSync(pathFile, 'utf8'), `/tmp/bin${os.EOL}`);
      assert.equal(fs.readFileSync(envFile, 'utf8'), `GEM_PATH=/tmp/gems${os.EOL}`);
    } finally {
      delete process.env.GITHUB_PATH;
      delete process.env.GITHUB_ENV;
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});

describe('installPuppetLint', () => {
  it('invokes gem install with isolated install-dir and bindir', () => {
    let capturedCmd;
    let capturedArgs;

    const mockSpawn = (cmd, args) => {
      capturedCmd = cmd;
      capturedArgs = args;
      return { status: 0 };
    };

    const { binDir, gemDir } = installPuppetLint({
      version: '4.2.4',
      spawn: mockSpawn,
    });

    assert.equal(capturedCmd, 'gem');
    assert.deepEqual(capturedArgs, [
      'install',
      'puppet-lint',
      '--no-document',
      '--install-dir',
      gemDir,
      '--bindir',
      binDir,
      '--version',
      '4.2.4',
    ]);

    fs.rmSync(path.dirname(binDir), { recursive: true, force: true });
  });

  it('throws when gem install exits non-zero', () => {
    assert.throws(
      () =>
        installPuppetLint({
          spawn: () => ({ status: 1 }),
        }),
      /gem install exited with code 1/
    );
  });
});
