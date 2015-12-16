const gulp = require('gulp');
const connect = require('gulp-connect');
const babel = require('gulp-babel');

gulp.task('babel', () => {
  return gulp.src('js/src/thomas.js')
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(gulp.dest('js'))
});

gulp.task('webserver', () => {
  connect.server();
});

gulp.task('default', ['babel', 'webserver']);