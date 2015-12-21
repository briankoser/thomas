const gulp = require('gulp');
const babel = require('gulp-babel');
const babelPolyfill = require('babel-polyfill');
const connect = require('gulp-connect');
const rename = require('gulp-rename');

gulp.task('babelpolyfill', () => {
  return gulp.src('node_modules/babel-polyfill/dist/polyfill.js')
    .pipe(gulp.dest('js/vendor/babel'))
});

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

gulp.task('default', ['babelpolyfill', 'babel', 'webserver']);