var spawn = require('child_process').spawn;
var through = require('through2');
var duplexer = require('duplexer');
var path = require('path');

module.exports = function (opts) {

  opts = opts || {};
  var args = ['serve', '--silent',
    '--cwd', __dirname,
    '--deck', opts.deck || '""',
    '--title', opts.title];

  if (opts.connect) {
    args.push('--connect', JSON.stringify(opts.connect));
  }
  if (opts.images) {
    args.push('--images', opts.images);
  }
  if (opts.skin) {
    args.push('--skin', opts.skin);
  }
  if (opts.source) {
    args.push('--source', opts.source)
  }

  // process.stdout.write(path.join(__dirname, 'node_modules/.bin/gulp') + ' ' + args.join(' '))

  var gulp = spawn(path.join(__dirname, 'node_modules/.bin/gulp'), args, {
    stdio: ['pipe', 'pipe', 2]
  });

  var info = gulp.stdout.pipe(
    (opts.objectMode ? through.obj : through)(function(data, enc, cb) {
      var port = (data+'').match(/http.+:([0-9]+)/);
      cb(null, port ?
        opts.objectMode ? {port: port[1]} : '{"port":' + port[1] + '}\n'
        : '');
    }));

  var stream = duplexer(gulp.stdin, info);
  stream.stdout = gulp.stdout

  stream.on('error', clean(gulp, stream));
  gulp.on('error', clean(gulp, stream));
  process.on('exit', clean(gulp));
  stream.pid = gulp.pid;

  return stream;
}

function clean(child, stream) {
  return function (err) {
    if (stream && err) { console.error('error', err); }
    child.kill('SIGKILL');
  }
}
