import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const policy = fileURLToPath(new URL('../.assetsignore', import.meta.url));

test('asset policy excludes Git files and directories but preserves public assets', () => {
  for (const path of ['.git', '.git/config', '.gitignore']) {
    const result = spawnSync('git', ['-c', `core.excludesFile=${policy}`, 'check-ignore', '--no-index', '-v', path], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.startsWith(`${policy}:`), path);
  }
  for (const path of ['index.html', 'gallery.js', 'shared/songs.js']) {
    const result = spawnSync('git', ['-c', `core.excludesFile=${policy}`, 'check-ignore', '--no-index', path], { cwd: root, encoding: 'utf8' });
    assert.equal(result.status, 1, path);
  }
});
