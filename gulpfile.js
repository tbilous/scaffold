var fs = require('fs');
var path = require('path');
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
var pkg = require('./package.json');
var dirs = pkg['scaffold-config'].directories;

var uglify = require('gulp-uglifyjs');
var rename = require('gulp-rename');
var imagemin = require('gulp-imagemin');
var shell = require('gulp-shell');

gulp.task('example', function () {
    return gulp.src('*.js', { read: false })
        .pipe(shell([
            'echo <%= f(file.path) %>',
            'ls -l <%= file.path %>'
        ], {
            templateData: {
                f: function (s) {
                    return s.replace(/$/, '.bak')
                }
            }
        }))
});

var mainStylesheet = 'styles';
var mainJs = 'main';

// ---------------------------------------------------------------------
// | Helper tasks                                                      |
// ---------------------------------------------------------------------

gulp.task('archive:create_archive_dir', function () {
    fs.mkdirSync(path.resolve(dirs.archive), '0755');
});

gulp.task('archive:zip', function (done) {

    var archiveName = path.resolve(dirs.archive, pkg.name + '.zip');
    var archiver = require('archiver')('zip');
    var files = require('glob').sync('**/*.*', {
        'cwd': dirs.dist,
        'dot': true // include hidden files
    });
    var output = fs.createWriteStream(archiveName);

    archiver.on('error', function (error) {
        done();
        throw error;
    });

    output.on('close', done);

    files.forEach(function (file) {

        var filePath = path.resolve(dirs.dist, file);

        // `archiver.bulk` does not maintain the file
        // permissions, so we need to add files individually
        archiver.append(fs.createReadStream(filePath), {
            'name': file,
            'mode': fs.statSync(filePath)
        });

    });

    archiver.pipe(output);
    archiver.finalize();

});

gulp.task('clean', function (done) {
    require('del')([
        dirs.archive,
        dirs.dist
    ], done);
});

gulp.task('predownload', shell.task([
    'npm run bower'
]));

gulp.task('copy', [
    'copy:uglify',
    'copy:.htaccess',
    'copy:index.html',
    'copy:jquery',
    'copy:license',
    'copy:images',
    'copy:minify-css',
    'copy:misc'
]);

gulp.task('source', [
    'source:fonts',
    'source:bootstrap',
    'source:animate',
    'source:flipclock',
    'source:moment',
    'source:maskedinput',
    'source:validation',
    'source:parallax',
    'source:scrollMonitor'
]);

gulp.task('source:fonts', [
    'fonts:ionicons',
    'fonts:font-awesome'
]);

gulp.task('fonts:ionicons', function () {
    return gulp.src('bower_components/' + 'Ionicons/fonts/*')
        .pipe(gulp.dest(dirs.src + '/fonts'));
});

gulp.task('fonts:font-awesome', function () {
    return gulp.src('bower_components/' + 'font-awesome/fonts/*')
        .pipe(gulp.dest(dirs.src + '/fonts'));
});

gulp.task('source:bootstrap', [
    'bootstrap:sass',
    'bootstrap:js'
]);

gulp.task('bootstrap:sass', function () {
    return gulp.src(['bower_components/' + 'bootstrap-sass/assets/stylesheets/**/*',
            '!' + 'bower_components/' + 'bootstrap-sass/assets/stylesheets/_bootstrap-compass.scss',
            '!' + 'bower_components/' + 'bootstrap-sass/assets/stylesheets/_bootstrap-mincer.scss',
            '!' + 'bower_components/' + 'bootstrap-sass/assets/stylesheets/_bootstrap-sprockets.scss'
    ])
        .pipe(gulp.dest(dirs.src + '/.sass/'));
});

gulp.task('bootstrap:js', function () {
    return gulp.src(['bower_components/' + 'bootstrap-sass/assets/javascripts/bootstrap/carousel.js',
            'bower_components/' + 'bootstrap-sass/assets/javascripts/bootstrap/carousel.js',
            'bower_components/' + 'bootstrap-sass/assets/javascripts/bootstrap/collapse.js',
            'bower_components/' + 'bootstrap-sass/assets/javascripts/bootstrap/modal.js',
            'bower_components/' + 'bootstrap-sass/assets/javascripts/bootstrap/button.js'
        ])
        .pipe(gulp.dest(dirs.src + '/.assets/js'));
});

gulp.task('source:animate', function () {
    return gulp.src(['bower_components/' + 'animate.css/animate.min.css'
        ])
        .pipe(gulp.dest(dirs.src + '/css'));
});

gulp.task('source:flipclock', function () {
    return gulp.src(['bower_components/' + 'flipclock/compiled/flipclock.min.js'
        ])
        .pipe(gulp.dest(dirs.src + '/js/vendor'));
});

gulp.task('source:moment', function () {
    return gulp.src(['bower_components/' + 'moment/min/moment.min.js'
        ])
        .pipe(gulp.dest(dirs.src + '/js/vendor'));
});

gulp.task('source:maskedinput', function () {
    return gulp.src(['bower_components/' + 'jquery.maskedinput/dist/jquery.maskedinput.min.js'
        ])
        .pipe(gulp.dest(dirs.src + '/js/vendor'));
});

gulp.task('source:validation', function () {
    return gulp.src(['bower_components/' + 'jquery-validation/dist/jquery.validate.min.js'
        ])
        .pipe(gulp.dest(dirs.src + '/js/vendor'));
});

gulp.task('source:lightbox', function () {
    return gulp.src(['bower_components/' + 'lightbox2/dist/js/lightbox.min.js'
        ])
        .pipe(gulp.dest(dirs.src + '/js/vendor'));
});

gulp.task('source:parallax', function () {
    return gulp.src(['bower_components/' + 'parallax.js/parallax.min.js'
        ])
        .pipe(gulp.dest(dirs.src + '/js/vendor'));
});

gulp.task('source:scrollMonitor', function () {
    return gulp.src(['bower_components/' + 'scrollMonitor/scrollMonitor.js'
        ])
        .pipe(uglify())
        .pipe(gulp.dest(dirs.src + '/js/vendor'));
});

gulp.task('copy:.htaccess', function () {
    return gulp.src('node_modules/apache-server-configs/dist/.htaccess')
        .pipe(plugins.replace(/# ErrorDocument/g, 'ErrorDocument'))
        .pipe(plugins.replace(/Options -MultiViews/g, '# Options -MultiViews'))
        .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:index.html', function () {
    return gulp.src(dirs.src + '/index.html')
        .pipe(plugins.replace(/{{JQUERY_VERSION}}/g, pkg.devDependencies.jquery))
        .pipe(plugins.replace(/{{MAIN_JS_FILE}}/g, 'main.js'))
        .pipe(plugins.replace(/{{MAIN_CSS_FILE}}/g, mainStylesheet + '.min.css'))
        .pipe(plugins.replace(/{{CUT-START}}(.|\n)+?{{CUT-END}}/gm, ''))
        .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:jquery', function () {
    return gulp.src(['node_modules/jquery/dist/jquery.min.js'])
        .pipe(plugins.rename('jquery-' + pkg.devDependencies.jquery + '.min.js'))
        .pipe(gulp.dest(dirs.dist + '/js/vendor'));
});

gulp.task('copy:license', function () {
    return gulp.src('LICENSE.txt')
        .pipe(gulp.dest(dirs.dist));
});

gulp.task('copy:minify-css', function () {
    var banner = '/*!*! Taras Bilous: ' + ' tbilous@gmail.com' +
        ' | ' + pkg.homepage + ' *!*/\n\n' + '.cbalink{display: none;}';
    return gulp.src(dirs.src + '/css/' + mainStylesheet + '.css')
        .pipe(plugins.header(banner))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist' + '/css/'));
});

gulp.task('copy:uglify', function () {
    return gulp.src([
            dirs.src + '/.assets/js/*.*',
            '!' + dirs.src + '/.assets/js/main.js'
        ])

        .pipe(uglify('main.js', {
            outSourceMap: false
        }))
        .pipe(gulp.dest('dist' + '/js/'));
});

gulp.task('copy:images', function () {
    return gulp.src(dirs.src + '/img/**/*.{gif,jpg,png}')
        .pipe(imagemin({
            progressive: true,
            interlaced: true,
            svgoPlugins: [{ removeViewBox: false }, { removeUselessStrokeAndFill: false }]
        }))
        .pipe(gulp.dest('dist' + '/img'));
});

gulp.task('copy:misc', function () {
    return gulp.src([

        // Copy all files
        // dirs.src + '/**/*',
        dirs.src + '/**/',
        dirs.src + '/fonts/**/*',
        dirs.src + '/js/**/',
        dirs.src + '/css/**/*',

        '!' + dirs.src + '/css/' + mainStylesheet + '.css',
        '!' + dirs.src + '/.asset*/**/*',
        '!' + dirs.src + '/img/**/*',
        '!' + dirs.src + '/js/' + mainJs + '.js',
        '!' + dirs.src + '/index.html'

    ], {
        // Include hidden files by default
        dot: false

    }).pipe(gulp.dest(dirs.dist));
});

gulp.task('lint:js', function () {
    return gulp.src([
        'gulpfile.js',
        dirs.src + '/js/plugin.js'
        // dirs.test + '/*.js'
    ]).pipe(plugins.jscs())
/*        .pipe(plugins.jshint({
            browser: true,
            devel: true
        }))*/
        .pipe(plugins.jshint.reporter('jshint-stylish'))
        .pipe(plugins.jshint.reporter('fail'));
});


// ---------------------------------------------------------------------
// | Main tasks                                                        |
// ---------------------------------------------------------------------


gulp.task('archive', function (done) {
    runSequence(
        'build',
        'archive:create_archive_dir',
        'archive:zip',
        done);
});

gulp.task('build', function (done) {
    runSequence(
        ['clean', 'lint:js'],
        'copy',
        done);
});

gulp.task('prepare', function (done) {
    runSequence(
        'predownload',
        'source',
        done);
});


gulp.task('default', ['build']);
