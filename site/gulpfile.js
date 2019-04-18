'use strict';

var gulp = require('gulp');
var gulpIf = require('gulp-if');
var gulpRev = require('gulp-rev');
var gulpRevCollector = require('gulp-rev-collector');
var gulpRevReplace = require('gulp-rev-replace');
var gulpUglify = require('gulp-uglify');
var gulpUniqueFiles = require('gulp-unique-files');
var gulpUseRef = require('gulp-useref');
var gulpCleanCSS = require('gulp-clean-css');
var gulpResponsive = require('gulp-responsive');
var gulpCheerio = require('gulp-cheerio');
var del = require('del');
var rename = require('rename');

var dirs = {
  public: 'public',
  screenshots: 'public/build/screenshots'
};

gulp.task('useref', ['screenshot'], function() {
  var assets = gulpUseRef.assets({
    searchPath: 'public'
  });

  return gulp.src('public/**/*.html')
    .pipe(assets)
    .pipe(gulpUniqueFiles())
    .pipe(gulpIf('*.css', gulpCleanCSS()))
    .pipe(gulpIf('*.js', gulpUglify()))
    .pipe(gulpRev())
    .pipe(assets.restore())
    .pipe(gulpUseRef())
    .pipe(gulpRevReplace({
      prefix: '/'
    }))
    .pipe(gulp.dest('public'));
});

gulp.task('screenshot:clean', function() {
  return del([dirs.screenshots + '/**/*']);
});

gulp.task('screenshot:rev', ['screenshot:clean'], function() {
  return gulp.src('public/themes/screenshots/*.png')
    .pipe(gulpRev())
    .pipe(gulp.dest(dirs.screenshots))
    .pipe(gulpRev.manifest())
    .pipe(gulp.dest(dirs.screenshots));
});

gulp.task('screenshot:revreplace', ['screenshot:rev'], function() {
  var destDir = '/build/screenshots';

  return gulp.src([dirs.screenshots + '/rev-manifest.json', 'public/themes/index.html'])
    .pipe(gulpRevCollector({
      replaceReved: true,
      dirReplacements: {
        '/themes/screenshots': destDir
      }
    }))
    .pipe(gulpCheerio(function($, file) {
      $('img.plugin-screenshot-img.lazyload').each(function() {
        var img = $(this);
        var src = img.attr('data-src') || img.attr('data-org');
        if (!src) return;

        var jpgPath = replaceBackSlash(rename(src, {extname: '.jpg'}));
        var jpg2xPath = replaceBackSlash(rename(jpgPath, {suffix: '@2x'}));
        var srcset = [
          jpgPath,
          jpg2xPath + ' 2x'
        ].join(', ');

        img.attr('data-src', jpgPath)
          .attr('data-srcset', srcset)
          .attr('data-org', src);
      });
    }))
    .pipe(gulp.dest('public/themes'));
});

gulp.task('screenshot:resize', ['screenshot:rev'], function() {
  return gulp.src(dirs.screenshots + '/*.png')
    .pipe(gulpResponsive({
      '*.png': [
        {
          width: '50%',
          rename: {
            extname: '.jpg'
          }
        },
        {
          rename: {
            suffix: '@2x',
            extname: '.jpg'
          }
        }
      ]
    }, {
      progressive: true,
      format: 'jpeg',
      quality: 70,
      stats: false
    }))
    .pipe(gulp.dest(dirs.screenshots));
});

gulp.task('screenshot', ['screenshot:rev', 'screenshot:resize', 'screenshot:revreplace']);
gulp.task('default', ['useref', 'screenshot']);

function replaceBackSlash(str) {
  return str.replace(/\\/g, '/');
}
