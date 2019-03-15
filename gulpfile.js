var gulp          = require('gulp'),
    gutil         = require('gulp-util' ),
    sass          = require('gulp-sass'),
    stylus        = require('gulp-stylus'),
    browserSync   = require('browser-sync'),
    concat        = require('gulp-concat'),
    uglify        = require('gulp-uglify'),
    cleancss      = require('gulp-clean-css'),
    rename        = require('gulp-rename'),
    autoprefixer  = require('gulp-autoprefixer'),
    notify        = require('gulp-notify'),
    rsync         = require('gulp-rsync'),
    pug           = require('gulp-pug'),
    babel         = require('gulp-babel');

var js_file_name  = 'scripts',  // file will be: "js/scripts.js";
    is_js_min     = false,      // minimized will be: "js/scripts.min.js";
    gulpversion   = '4',        // Gulp version: 3 or 4
    cssPre        = 'stylus';   // CSS preprocessor 'stylus' or 'sass'

var paths = {
  src:'src',
  dst:'build',
  styles: {
    src: 'sass',
    dst: 'css'
  },
  scripts: {
    src: 'js',
    dst: 'js'
  }
};
paths.styles.src = paths.src+'/'+paths.styles.src;
paths.styles.dst = paths.dst+'/'+paths.styles.dst;
paths.scripts.src =paths.src+'/'+paths.scripts.src;
paths.scripts.dst =paths.dst+'/'+paths.scripts.dst;

gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: paths.dst
    },
    notify: false,
    // open: false,
    // online: false, // Work Offline Without Internet Connection
    // tunnel: true, tunnel: "projectname", // Demonstration page: http://projectname.localtunnel.me
  });
});
if ( cssPre == 'stylus' ){
gulp.task('styles', function() {
  return gulp.src( paths.styles.src+'/**/*.{styl,stylus}' )
    .pipe( stylus({
      'include css': true
    }).on("error", notify.onError()) )
    .pipe(rename({ suffix: '.min', prefix : '' }))
    .pipe(autoprefixer(['ChromeAndroid >= 70'])) // supported browsers
    //.pipe(cleancss( {level: { 1: { specialComments: 0 } } })) // Opt., comment out when debugging
    .pipe(gulp.dest( paths.styles.dst ))
    .pipe(browserSync.stream());
});
} else {
  gulp.task('styles', function() {
    return gulp.src( paths.styles.src+'/**/!(_)*.{sass,scss}' )
    .pipe(sass({ outputStyle: 'expanded' }).on("error", notify.onError()))
    .pipe(rename({ suffix: '.min', prefix : '' }))
    .pipe(autoprefixer(['last 15 versions']))
    .pipe(cleancss( {level: { 1: { specialComments: 0 } } })) // Opt., comment out when debugging
    .pipe(gulp.dest( paths.styles.dst ))
    .pipe(browserSync.stream());
});
}

if ( is_js_min ){
  gulp.task('scripts', function() {
    return gulp.src(paths.scripts.src+'/**/!(_)*.js')
    .pipe(concat(js_file_name+'.min.js'))
    .pipe(babel({presets: ['@babel/env']}))
    .pipe(uglify()) // Mifify js 
    .pipe(gulp.dest(paths.scripts.dst))
    .pipe(browserSync.reload({ stream: true }));
  });
} else {
  gulp.task('scripts', function() {
    return gulp.src(paths.scripts.src+'/**/!(_)*.js')
    .pipe(concat(js_file_name+'.js'))
    .pipe(babel({presets: ['@babel/env']}))
    .pipe(gulp.dest(paths.scripts.dst))
    .pipe(browserSync.reload({ stream: true }));
  });
}

// gulp.task('code', function() {
//  return gulp.src('app/*.html')
//  .pipe(browserSync.reload({ stream: true }))
// });

gulp.task('pug', function () {
  return gulp.src(paths.src+'/**/!(_)*.pug')
  .pipe(pug({
    pretty: true // fron not 1 line code 
  }).on('error', function(e) { console.log(e.message); })
  )
  .pipe(gulp.dest('./'+paths.dst))//   
  .pipe(browserSync.reload({ stream: true }));
});

gulp.task('rsync', function() {
  return gulp.src(paths.src+'/**')
  .pipe(rsync({
    root: paths+'/',
    hostname: 'username@yousite.com',
    destination: 'yousite/public_html/',
    // include: ['*.htaccess'], // Includes files to deploy
    exclude: ['**/Thumbs.db', '**/*.DS_Store'], // Excludes files from deploy
    recursive: true,
    archive: true,
    silent: false,
    compress: true
  }));
});

if (gulpversion == 3) {
  gulp.task('watch', ['styles', 'scripts', 'pug', 'browser-sync'], function() {
    gulp.watch( paths.styles.src+'/**/*.{sass,scss}', ['styles'] );
    gulp.watch( paths.scripts.src+'/**/*.js', ['scripts'] );
    gulp.watch( paths.src+'/**/!(_)*.pug', ['pug'] );
  });
  gulp.task('default', ['watch']);
}

if (gulpversion == 4) {
  gulp.task('watch', function() {
    gulp.watch( paths.styles.src+'/**/*.{sass,scss}', gulp.parallel('styles') );
    gulp.watch( paths.scripts.src+'/**/*.js', gulp.parallel('scripts') );
    gulp.watch( paths.src+'/**/!(_)*.pug', gulp.series('pug') );//,'code'
  });
  gulp.task('default', gulp.parallel('watch', 'pug', 'styles', 'scripts', 'browser-sync'));
}