const asyncFn = require('promise-toolbox/asyncFn');
const fs = require('fs');
const path = require('path');
const t = require('tap');
const TOML = require('@iarna/toml');

const Smb2 = require('../');

const dir = 'smb2-tests-' + Date.now();
const file = dir + '\\file.txt';
const data = Buffer.from(
  Array.from({ length: 1024 }, function() {
    return Math.round(Math.random() * 255);
  })
);

const tests = {
  mkdir: function(client) {
    return client.mkdir(dir);
  },
  writeFile: function(client) {
    return client.writeFile(file, data);
  },
  readFile: function(client) {
    return client.readFile(file).then(function(result) {
      t.same(result, data);
    });
  },
  unlink: function(client) {
    return client.unlink(file);
  },
  rmdir: function(client) {
    return client.rmdir(dir);
  },
};

asyncFn(function*() {
  const options = TOML.parse(
    fs.readFileSync(path.join(__dirname, 'config.toml'))
  );
  options.autoCloseTimeout = 0;
  const client = new Smb2(options);

  try {
    let result;
    for (const name of Object.keys(tests)) {
      result = yield t.test(name, function() {
        return tests[name](client, result);
      });
    }
  } finally {
    yield client.disconnect();
  }
})().catch(t.threw);