'use strict';

const path = require('path');
const gulp = require('gulp');
const gutil = require('gulp-util');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const rimraf = require('gulp-rimraf');
const header = require('gulp-header');
const webpack = require('webpack');
const pkg = require('./package.json');

gulp.task('build.js.clean', () => {
  return gulp.src(['dist'], { read: false })
    .pipe(rimraf());
});

gulp.task('build.js', ['build.js.clean'], (done) => {
  webpack(require('./webpack.config.js'), function(err, stats) {
    if( err ) throw new gutil.PluginError('webpack', err);
    gutil.log('[webpack]', stats.toString({
      colors: true,
      children: true,
      chunks: true,
      modules: false
    }));
    done();
  });
});

gulp.task('build.js.min', ['build.js'], (done) => {
  return gulp.src(path.join('dist/x-router-angular.js'))
    .pipe(header([
      '/*!',
      '* <%= pkg.name %>',
      '* <%= pkg.homepage %>',
      '*',
      '* Copyright attrs and others',
      '* Released under the <%=pkg.license%> license',
      '* https://github.com/<%=pkg.repository%>/blob/master/LICENSE',
      '*/',
      ''
    ].join('\n'), { pkg: pkg }))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(header('/*! <%= pkg.name %> - attrs */', { pkg: pkg }))
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('build', ['build.js.min']);
gulp.task('default', ['build']);
