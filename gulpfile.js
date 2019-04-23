var gulp = require('gulp');
var uglify = require('gulp-uglify');
var pipeline = require('readable-stream').pipeline;
var rename = require("gulp-rename");
gulp.task('compress', function () {
  return pipeline(
        gulp.src('src/canvas-keyframes.js'),
        uglify(),
        rename({ suffix: '.min' }),
        gulp.dest('dist')
  );
});