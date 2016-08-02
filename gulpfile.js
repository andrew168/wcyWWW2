/* jshint node:true */

'use strict';
var dstPath1 = 'E:\\projects\\cardforvote\\www',
    dstPath2 = 'E:\\projects\\cardforvote\\ksWww';
var gulp = require('gulp');
var $ = require('gulp-load-plugins')(); //jshint ignore:line
var uglifyjs = require("uglify-js");
var fs = require('fs');
var del = require('del');
var crypto = require('crypto');
var args = require('yargs').argv;
JSON.minify = JSON.minify || require("node-json-minify");

var config = {
    header: null,
    version: null,
    hash: null
};

gulp.task('config', ['clean'], function () {
    //ver info
    config.header = "/*! ionic " + new Date().toLocaleString() + " */\n";
    config.version = require('./package.json').version;
    config.hash = config.version + "." + crypto.createHash('md5').update(config.header).digest('hex').slice(0, 8);

    //container files
    config.hash = "";
    config.app_js = "/wcy3all" + config.hash + ".js";
    config.app_min_js = "/wcy3all" + config.hash + ".min.js";
    config.app_min_js_map = "wcy3all" + config.hash + ".min.map";
    config.app_min_css = "/wcy3all" + config.hash + ".min.css";
});

gulp.task('wcylib_concat', function () {
    var wcylib_assets = $.useref.assets({searchPath: '{,www,www/js, www/wcy3}'});
    return gulp.src('www/index.html')
        .pipe(wcylib_assets)
        .pipe($.if('*.css', $.rename(config.app_min_css)))
        .pipe($.if(/wcy3all\.js/ && args.remove_logs, $.replace(/AuxLog\.log\(.*\);/gm, "")))
        .pipe($.if(/wcy3all\.js/, $.rename(config.app_js)))
        .pipe($.if(/wcy3all\.js/, $.header(config.header)))
        .pipe(wcylib_assets.restore())
        .pipe($.useref())
        .pipe($.if('*.html', $.replace(/wcy3all\.js/g, config.app_js)))
        .pipe($.if('*.css', $.minifyCss()))
        //.pipe($.if('*.html', $.minifyHtml()))

        .pipe(gulp.dest('dist'))
        .pipe($.if(/wcy3all\.js/, $.rename(config.app_js)))
        .pipe(gulp.dest(dstPath1 + '\\lib'))
        .pipe(gulp.dest(dstPath2 + '\\lib'));
});

gulp.task('wcylib_minify', ['wcylib_concat'], function () {
    var result = uglifyjs.minify(["dist/" + config.app_js], {
        outSourceMap: config.app_min_js_map,
        sourceRoot: "",
        compress: {
            warnings: false
        }
    });

    fs.writeFileSync(dstPath1 + '\\lib\\' + config.app_min_js, result.code);
    fs.writeFileSync(dstPath2 + '\\lib\\' + config.app_min_js, result.code);
});

gulp.task('clean', del.bind(null, ['dist', 'src/tmp']));

gulp.task('build', ['wcylib_minify'], function () {
    return gulp.src('dist/**/*')
        .pipe($.size({title: 'build', gzip: true}))
        .pipe($.zip('ionic' + config.version + '.zip'))
        .pipe(gulp.dest(dstPath1 + '\\lib'))
        .pipe(gulp.dest(dstPath2 + '\\lib'));
});

gulp.task('default', ['config'], function () {
    gulp.start('build');
});
