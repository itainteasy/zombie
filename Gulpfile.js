const assert      = require('assert');
const clean       = require('gulp-clean');
const exec        = require('gulp-exec');
const File        = require('fs');
const gulp        = require('gulp');
const gutil       = require('gulp-util');
const notify      = require('gulp-notify');
const sourcemaps  = require("gulp-sourcemaps");
const to5         = require('gulp-6to5');



// gulp -> gulp watch
gulp.task('default', ['watch']);


// gulp build -> compile coffee script
gulp.task('build', ['clean'], function() {
  return gulp
    .src('src/*.js')
    .pipe(sourcemaps.init())
    .pipe(to5({
      experimental: true,
      loose:        'all',
      optional:     [ 'selfContained' ]
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('lib'))
    .pipe(notify({
      message: "Zombie: built!",
      onLast:  true
    }));
});


// gulp clean -> clean generated files
gulp.task('clean', function() {
  return gulp
    .src('lib', { read: false })
    .pipe( clean() );
});


// gulp watch -> watch for changes and compile
gulp.task('watch', ['build'], function() {
  return gulp.watch('src/*.js', ['clean', 'build']);
});


// gulp tag -> Tag this release
gulp.task('tag', ['changes'], function() {
  const version = require('./package.json').version;
  const tag     = 'v' + version;

  gutil.log('Tagging this release', tag);
  return gulp.src('.changes')
    .pipe( exec('git add package.json CHANGELOG.md') )
    .pipe( exec('git commit --allow-empty -m "Version ' + version + '"') )
    .pipe( exec('git tag ' + tag + ' --file .changes') )
    .pipe( exec('git push origin ' + tag) )
    .pipe( exec('git push origin master') );
});

// Generate a change log summary for this release
// git tag uses the generated .changes file
gulp.task('changes', function() {
  const version   = require('./package.json').version;
  const changelog = File.readFileSync('CHANGELOG.md', 'utf-8');
  const match     = changelog.match(/^## Version (.*) .*\n([\S\s]+?)\n##/m);

  assert(match, 'CHANGELOG.md missing entry: ## Version ' + version);
  assert.equal(match[1], version, 'CHANGELOG.md missing entry for version ' + version);

  const changes   = match[2].trim();
  assert(changes, 'CHANGELOG.md empty entry for version ' + version);
  File.writeFileSync('.changes', changes);
});

