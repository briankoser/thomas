const gulp = require('gulp');
const babel = require('gulp-babel');
const connect = require('gulp-connect');
const rename = require('gulp-rename');


gulp.task('babel', () => {
  return gulp.src('js/src/thomas.es6.js')
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(rename('thomas.js'))
    .pipe(gulp.dest('js'))
});

gulp.task('webserver', () => {
  connect.server();
});

gulp.task('default', ['babel', 'webserver']);