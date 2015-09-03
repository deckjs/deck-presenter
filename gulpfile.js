var pkg = require('./package.json'),
  gulp = require('gulp'),
  gutil = require('gulp-util'),
  plumber = require('gulp-plumber'),
  rimraf = require('gulp-rimraf'),
  rename = require('gulp-rename'),
  connect = require('gulp-connect'),
  browserify = require('gulp-browserify'),
  uglify = require('gulp-uglify'),
  jade = require('gulp-jade'),
  stylus = require('gulp-stylus'),
  autoprefixer = require('gulp-autoprefixer'),
  csso = require('gulp-csso'),
  through = require('through'),
  opn = require('opn'),
  ghpages = require('gh-pages'),
  path = require('path'),
  merge = require('merge-stream'),
  gmerge = require('gulp-merge'),
  concat = require('gulp-concat'),
  source = require('vinyl-source-stream'),
  argv = require('minimist')(process.argv.slice(2)),
  mediator = require('bespoke-synchro/mediator'),
  pdf = require('bespoke-pdf'),
  isDist = process.argv.indexOf('serve') === -1;


  var connectCfg = 
    gulp._connect_cfg = 
      gulp._connect_cfg || argv.connect ? JSON.parse(argv.connect) : null;

if (gulp._connect_cfg) {
  isDist = false;
}

gulp.task('js', ['clean:js'], function() {
  return gulp.src('src/scripts/main.js')
    .pipe(isDist ? through() : plumber())
    .pipe(browserify({ transform: ['debowerify'], debug: !isDist }))
    .pipe(isDist ? uglify() : through())
    .pipe(rename('build.js'))
    .pipe(gulp.dest('dist/build'))
    .pipe(connect.reload());
});

gulp.task('html', ['clean:html'], function() {
  return gulp.src('src/index.jade')
    .pipe(isDist ? through() : plumber())
    .pipe(jade({ locals: {title: argv.title}, pretty: true }))
    .pipe(rename('index.html'))
    .pipe(gulp.dest('dist'))
    .pipe(connect.reload());
});

gulp.task('css', ['clean:css'], function() {

  var skinStyl = argv.skin || 'src/styles/skin/main.styl';

  var app = gulp.src('src/styles/app/main.styl')
    .pipe(isDist ? through() : plumber())
    .pipe(stylus({
      // Allow CSS to be imported from node_modules and bower_components
      'include css': true,
      'paths': ['./node_modules', './bower_components']
    }))
    .pipe(autoprefixer('last 2 versions', { map: false }))
    .pipe(isDist ? csso() : through());


  var skin = gulp.src(skinStyl)
    .pipe(isDist ? through() : plumber())
    .pipe(stylus({
      'include css': true,
      'paths': [path.dirname(skinStyl)]
    }))
    .pipe(autoprefixer('last 2 versions', { map: false }))
    .pipe(isDist ? csso() : through());


  return gmerge(app, skin)
    .pipe(concat('build.css'))
    .pipe(gulp.dest('dist/build'))
    .pipe(connect.reload());
});

gulp.task('images', ['clean:images'], function() {
  var base = gulp.src('src/images/**/*')
    .pipe(gulp.dest('dist/images'))
    .pipe(connect.reload());

  if (!argv.images) { return 'master'; }
  
  try {
    argv.images = JSON.parse(argv.images)
  } catch (e) {}
  
  if (!Array.isArray(argv.images)) {
    argv.images = [argv.images];
  }

  var extras = argv.images.map(function (im) {
    return gulp.src(im + '/**/*')
      .pipe(gulp.dest('dist/images'))
      .pipe(connect.reload());
  })

  return merge.apply(null, [base].concat(extras));
});

gulp.task('md', ['clean:md'], function() {
  return gulp.src(argv.deck || 'src/index.md')
    .pipe(rename('index.md'))
    .pipe(gulp.dest('dist'))
    .pipe(connect.reload());
});


gulp.task('pdf', ['clean:pdf', 'connect'], function (done) {
  if (!argv.title) { return done(); }

  return pdf(argv.title + '.pdf', 'http://localhost:' + connectCfg.port)
    .pipe(argv['pdf-dest'] || gulp.dest('dist'))
    .on('end', function () {
      console.log('pdf done')
    })

});

gulp.task('clean', function() {
  return gulp.src('dist')
    .pipe(rimraf());
});

gulp.task('clean:md', function() {
  return gulp.src('dist/index.md')
    .pipe(rimraf());
});

gulp.task('clean:html', function() {
  return gulp.src('dist/index.html')
    .pipe(rimraf());
});

gulp.task('clean:js', function() {
  return gulp.src('dist/build/build.js')
    .pipe(rimraf());
});

gulp.task('clean:css', function() {
  return gulp.src('dist/build/build.css')
    .pipe(rimraf());
});

gulp.task('clean:images', function() {
  return gulp.src('dist/images').pipe(rimraf());
});

gulp.task('clean:pdf', function(done) {
  return gulp.src('dist/*.pdf')
    .pipe(rimraf())
});

gulp.task('exit', ['pdf'], function () {
  process.exit();
});

gulp.task('connect', ['build'], function() {
  connect.server(gulp._connect_cfg 
    ? 
      gulp._connect_cfg
    : {
      root: 'dist',
      livereload: true
    });

  mediator();

});

gulp.task('watch', function() {

  if (argv.deck) {
    gulp.watch(argv.deck, ['md']);
  } else {
    gulp.watch('src/**/*.md', ['md']);
  }

  gulp.watch('src/**/*.jade', ['html']);

  if (argv.skin) {
    gulp.watch(path.dirname(argv.skin) + '/**/*.styl', ['css']);
  } else {
    gulp.watch('src/styles/skin/*.styl', ['css']);      
  }

  gulp.watch('src/styles/app/*.styl', ['css']);  
  

  if (argv.images) {
    gulp.watch(argv.images + '/**/*', ['images']);
  }

  gulp.watch('src/images/**/*', ['images']);
  gulp.watch([
    'src/scripts/**/*.js',
    'bespoke-theme-*/dist/*.js' // Allow themes to be developed in parallel
  ], ['js']);
});

gulp.task('deploy', ['build'], function(done) {
  ghpages.publish(path.join(__dirname, 'dist'), { logger: gutil.log }, done);
});

gulp.task('build', ['js', 'html', 'css', 'md', 'images']);
gulp.task('serve', ['connect', 'watch'/*, 'pdf'*/]);
gulp.task('default', ['build',  'exit']);
