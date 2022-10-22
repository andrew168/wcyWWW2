/* jshint node:true */

'use strict';
var srcPath = '.\\www',
  testPath = '.\\test',
  distPath = '.\\dist',
  prjPath1 = '..\\udoido2\\www';
const { series, parallel, src, dest } = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var exec = require('child_process').exec;
var gettext = require('gulp-angular-gettext');

var useref = require('gulp-useref'),
  gulpif = require('gulp-if'),
  gulp_size = require('gulp-size'),
  gulp_zip = require('gulp-zip'),
  gulpminifyCss = require('gulp-clean-css'),
  gulp_replace = require('gulp-replace'),
  gulp_rename = require('gulp-rename'),
  gulp_header = require('gulp-header'),
  gulp_minifyHtml = require('gulp-minify-html');
var minify = require('gulp-minify');
var uglify = require('gulp-uglify');
var fs = require('fs');
var del = require('del');
var args = require('yargs').argv;
JSON.minify = JSON.minify || require("node-json-minify");

var config = {
  header: null,
  version: null,
  hash: null,
  withDictionary: false //不再发布词典到后续项目
};

async function doConfig() {
  //ver info
  config.header = "/*! wcy3 library " + new Date().toLocaleString() + " */\n";
  config.version = require('./package.json').version;
  config.hash = "";

  config.app_js = "/wcy3all" + config.hash + ".js";
  config.app_min_js = "/wcy3all" + config.hash + ".min.js";
  config.app_min_js_map = "wcy3all" + config.hash + ".min.map";
  config.app_min_css = "/wcy3all" + config.hash + ".min.css";
}

async function wcylib_concat() {
  await src('www/index.html', {sourcemaps: true})
    .pipe(gulpif('*.css', gulp_rename(config.app_min_css)))
    .pipe(gulpif(/wcy3all\.js/ && args.remove_logs, gulp_replace(/AuxLog\.log\(.*\);/gm, "")))
    .pipe(gulpif(/wcy3all\.js/, gulp_rename(config.app_js)))
    .pipe(gulpif(/wcy3all\.js/, gulp_header(config.header)))
    .pipe(useref())
    .pipe(gulpif('*.html', gulp_replace(/wcy3all\.js/g, config.app_js)))
    .pipe(gulpif('*.css', gulpminifyCss()))
    .pipe(gulpif('*.html', gulp_minifyHtml()))
    .pipe(dest(distPath))
    .pipe(gulpif(/wcy3all\.js/, gulp_rename(config.app_js)))
    // .pipe(dest(prjPath1 + '\\lib'))
    .pipe(dest(prjPath1 + '\\lib-debug'));

  console.log("concated => " + prjPath1 + '\\lib' + config.app_js);
  return Promise.resolve();
}

async function wcylib_uglify() {
  await src("dist/" + config.app_js, { sourcemaps: true })
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(uglify())
    .pipe(sourcemaps.write('../maps'))
    .pipe(dest("uglify/"), { sourcemaps: "." });

  console.log("minified => " + 'uglify/' + config.app_min_js);

  return Promise.resolve();
};

async function wcylib_minify() {
  await src("dist/" + config.app_js, { sourcemaps: true })
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(minify())
    .pipe(sourcemaps.write('../maps'))
    .pipe(dest(prjPath1 + '\\lib\\'), { sourcemaps: true });
  // ToDo: check file:  config.app_min_js

  console.log("minified => " + prjPath1 + '\\lib' + config.app_min_js)

  return Promise.resolve();
}


async function clean() {
  await del.bind(null, [distPath, 'src / tmp']);
}

async function del_extra_libs_js() {
  await del.bind(null, [prjPath1 + '\\lib\\libs.js'], { force: true });
}

async function build() {
  src('dist/**/*')
    .pipe(gulp_size({ title: 'build', gzip: true }))
    .pipe(gulp_zip('ionic' + config.version + '.zip'))
    .pipe(dest(prjPath1 + '\\lib'));
  await Promise.resolve("Build completed!");
}

async function copy_debug_tools() {
  // 必须指定{ base: srcPath }, 否则，gulp会自带创建整个src路径
  await src(srcPath + "\\wcy3\\debugger\\*.*", {base: srcPath})
    .pipe(dest(prjPath1));
  return Promise.resolve();
}

async function copy_build_tools() {
  await src(srcPath + "\\lazyLoading.js", { base: srcPath })
    .pipe(dest(prjPath1));
  return Promise.resolve();
}

async function copy_lazyLoad_files() {
  console.log("copy...")
  await src(srcPath + "\\wcy3Social\\*.*", { base: srcPath })
    .pipe(dest(prjPath1 + "\\wcy3Social"));
  return Promise.resolve("copy completed");
}

async function copy_worker_files() {
  var filesAndDirs = [
    ["", "worker.js"],
    //ToDo:        ["", "lame.min.js"]
  ];

  await filesAndDirs.forEach(async function (resource) {
    src(srcPath + '\\' + resource[0] + '\\' + resource[1], { base: srcPath })
      .pipe(dest(prjPath1 + '\\' + resource[0]));
  });
  return Promise.resolve("copy_work_files completed!");
}

async function copy_dictionary() {
  if (config.withDictionary) {
    await src(srcPath + "\\dictionary\\*.*", { base: srcPath })
      .pipe(dest(prjPath1 + "\\dictionary\\"));
  }
  return Promise.resolve();
}

async function defaultTask() {
  await build().then("in default!");
}

async function hot_sync() {
  console.log("hot sync souce to " + prjPath1);
  await copy_dictionary();
}

async function extract_string_const() {
  var source = [srcPath + '\\wcy3App\\wcyService.js'];
  // var source = ['www\\wcy3\\stringConstExtractDemo.js'];
  // var source = ['www\\wcy3\\**\\*.js'];
  await src(source)
    .pipe(gettext.extract('template.pot', {
      "startDelim": '"',
      "endDelim": '"',
      "markerName": "",
      "markerNames": [],
      "moduleName": "Locale",
      "moduleMethodString": "getStr",
      "moduleMethodPlural": "getStr",
      "attribute": "",
      "attributes": [],
      "lineNumbers": true,
      "format": "javascript",
      "defaultLanguage": false,
      "requirejs": false
    }))
    .pipe(dest('po/'));

  return Promise.resolve();
}

async function translations() {
  await src('po/**/*.po')
    .pipe(gettext.compile({
      // options to pass to angular-gettext-tools...
      format: 'json'
    }))
    .pipe(dest('dist/translations/'));
  return Promise.resolve();
}

async function copyTestFiles() {
  await src([srcPath + '/lib/ngStorage.js',
    srcPath + "/lib/ionic/css/ionic.css",
    srcPath + "/css/style.css",
    srcPath + "/css/weui.css",
    // "wcy3all.css",
    srcPath + "/lib-debug-duplicated/rzslider.css",
    srcPath + "/lib/ng-cordova.js",
    srcPath + "/cordova.js",
    srcPath + "/lib/ngStorage.js",
    srcPath + "/js/app.js",

    srcPath + "/lazyLoading.js",

    // "libs.js",

    // srcPath + "/wcy3all.js",

    srcPath + "/lib-debug-duplicated/rzslider.js",
    srcPath + "/wcy3/debugger/dumpElement.js",

    srcPath + "/js/convert.js",
    srcPath + "/js/controllers.js",
    srcPath + "/templates/*.*",
    srcPath + "/dictionary/*.*",
  ],
  { base: srcPath })
    .pipe(dest(testPath));

  src(distPath + "\*.*", { base: distPath })
    .pipe(dest(testPath));

  return Promise.resolve();
}

function startHttpServer() {
  console.log("start db server");
  exec("start-db-server-only.bat");
  console.log("start web server");
  exec("start-web-server.bat");
}

async function test() {
  copyTestFiles();
  startHttpServer();
}

async function makeFolders() {
  let waitFalg = false;
  let folders = [
    testPath,
    distPath,
  ];

  folders.forEach(function (item) {
    if (!fs.existsSync(item)) {
      exec("mkdir " + item);
      waitFalg = true;
      console.log(item + " made");
    } else {
      console.log(item + " exists!");
    }
  });

  if (waitFalg) {
    setTimeout(() => {
      return Promise.resolve();
    }, 1000);
  } else {
    return Promise.resolve();
  }
  return Promise.resolve();
}

exports.default = series(
  makeFolders,
  doConfig,
  parallel(copy_worker_files, copy_lazyLoad_files, copy_debug_tools),
  parallel(copy_build_tools, copy_dictionary),
  hot_sync,
  wcylib_concat,
);

//! 必须与concat一起分开用， 因为文件尚未写到磁盘，导致minify找不到
exports.rel = series(
  doConfig,
  wcylib_minify,
  del_extra_libs_js,
  build
);

exports.test = makeFolders;  // test;
// exports.test = series(doConfig, wcylib_minify);
// exports.test = series(doConfig, wcylib_uglify);
exports.nn = copy_debug_tools;