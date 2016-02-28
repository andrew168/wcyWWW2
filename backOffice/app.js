var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var loggerMorgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var logger2 = require('./common/logger');
logger2.config("udoido.log");

var app = express();
//  使用数据库的操作， 都必须在数据库启动之后， 再启动
require('./db/dbMain').init(app, onDbStarted);
var status = null;

function onDbStarted() {
    console.info("onDbStarted...");
    var routes = require('./routes/index');
    var users = require('./routes/users');
    var getCSignature = require('./routes/getCSignature');
    var getWSignature = require('./routes/getWSignature');

    //app.use('/', routes);
    //app.use('/users', users);
    app.use('/getCSignature', getCSignature);
    app.use('/getWSignature', getWSignature);

 var Wcy = require('./routes/wcy');
 var material = require('./routes/material');
 status = require('./common/status');

 app.use('/wcy', Wcy);
 app.use('/material', material);
    console.log("exit at onDbStarted!");
}


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(loggerMorgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

//CORS middleware
var allowCrossDomain = function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  // res.header('Access-Control-Allow-Origin', 'example.com');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  //res.header('Access-Control-Allow-Headers', 'Content-Type');

  next();
};

app.use(allowCrossDomain);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/static', express.static('./www'));
// 以上的路径，排除在外

app.use(function(req, res, next) {
    console.log("I'm first!!! for any path, 除了以上的路径");
    status.checkUser(req, res);
    next();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
