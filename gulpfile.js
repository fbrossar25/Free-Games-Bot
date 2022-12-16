const gulp = require("gulp");
const ts = require("gulp-typescript");
const tsProject = ts.createProject("tsconfig.json");
const sourcemaps = require('gulp-sourcemaps');
const clean = require('gulp-clean');

const outDir = 'out';

gulp.task("build", () => {
    return tsProject.src()
        .pipe(tsProject()).js
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write('_sourcemaps'))
        .pipe(gulp.dest(outDir));
});

gulp.task("clean", () => {
    return gulp.src(outDir).pipe(clean());
});

exports.default = gulp.series(
    gulp.task('clean'),
    gulp.task('build')
);