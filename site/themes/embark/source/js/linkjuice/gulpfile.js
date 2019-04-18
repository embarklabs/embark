var gulp    = require('gulp'),
    babel   = require('gulp-babel'),
    jshint  = require('gulp-jshint'),
    stylish = require('jshint-stylish'),
    header  = require('gulp-header'),
    uglify  = require('gulp-uglify'),
    plumber = require('gulp-plumber'),
    clean   = require('gulp-clean'),
    rename  = require('gulp-rename'),
    package = require('./package.json');

var paths = {
  output : 'dist/',
  scripts : ['src/linkjuice.js']
};

var banner = [
  '/*! ',
    '<%= package.name %> ',
    'v<%= package.version %> | ',
    '(c) ' + new Date().getFullYear() + ' <%= package.author %> |',
    ' <%= package.homepage %>',
  ' */',
  '\n'
].join('');

gulp.task('scripts', ['clean'], function() {
  return gulp.src(paths.scripts)
    .pipe(plumber())
    .pipe(babel({
			presets: ['es2015']
		}))
    .pipe(header(banner, { package : package }))
    .pipe(gulp.dest('dist/'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(header(banner, { package : package }))
    .pipe(gulp.dest('dist/'));
});

gulp.task('lint', function () {
  return gulp.src(paths.scripts)
    .pipe(plumber())
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('clean', function () {
  return gulp.src(paths.output, { read: false })
    .pipe(plumber())
    .pipe(clean());
});

gulp.task('default', [
  'lint',
  'clean',
  'scripts'
]);
