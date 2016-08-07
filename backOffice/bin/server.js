//Server.js就是 eCardAppServer.js
// std module

(function() {

    var debug = require('debug')('iCardSvr2:server');
    var http = require('http');
    var server;
    var _config = {};
    var logger = require('./../common/logger');
    logger.config("udoido.log");

    var express = require('express');
    var path = require('path');
    var favicon = require('serve-favicon');
    var loggerMorgan = require('morgan');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');

// our own module
    var status = null;
    var _app = null;

    function start(newAppConfig) {
        var appConfig = newAppConfig;
        if (!appConfig) {
            appConfig = require('./eCardAppConfig.js');
        }
        console.log("//////////////////////////////");
        console.log("///      start new server  ///");
        console.log("//////////////////////////////");

        var app = express();
        _app = app;
        start2(app);

//  使用数据库的操作， 都必须在数据库启动之后， 再启动
        var dbMain = require('./../db/dbMain');
        dbMain.init(app, function () {
            onDbStarted(app, appConfig);
        });
        // start3();
        // init();
    }

    function onDbStarted(app, appConfig) {
        console.info("onDbStarted...");
        appConfig.routesMap.forEach(setRoutes);
        function setRoutes(item) {
            app.use('/' + item.url, require(item.filePath));
        }
        status = require('./../common/status');

        console.log("exit at onDbStarted!");

        start3(app, appConfig);
    }

    function start3(app, appConfig) {
        if (!appConfig.useVHost) {
            init();
        }
        setupBaseiRoutes(app, appConfig);
    }

    function start2(app, appConfig) {
// view engine setup
        app.set('views', path.join(__dirname, './../views'));
        app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
        app.use(loggerMorgan('dev'));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({extended: false}));
        app.use(cookieParser());

//CORS middleware
        var allowCrossDomain = function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

            // res.header('Access-Control-Allow-Origin', 'example.com');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
            //res.header('Access-Control-Allow-Headers', 'Content-Type');

            next();
        };

        app.use(allowCrossDomain);
    }

    function setupBaseiRoutes(app, appConfig) {
        var clientPath = path.join(__dirname, appConfig.wwwRoot);
        var clientPathStatic = path.join(__dirname, './../public');
        console.log("current path:" + __dirname);
        console.log("client path (dynamic): " + clientPath);
        console.log("client path (static): " + clientPathStatic);

        app.use(express.static(clientPath));
        app.use('/static', express.static(clientPathStatic));

        if (Config.useCloundServerSimulator) {
            startLocalSimulator(app);
        }

// 以上的路径，排除在外

        app.use(function (req, res, next) {
            console.log("I'm first!!! for any path, 除了以上的路径");
//        status.checkUser(req, res);
            next();
        });

// catch 404 and forward to error handler
        app.use(function (req, res, next) {
            console.log("body: " + JSON.stringify(req.body));
            var err = new Error('Not Found');
            err.status = 404;
            next(err);
        });

// error handlers

// development error handler
// will print stacktrace
        if (app.get('env') === 'development') {
            app.use(function (err, req, res, next) {
                res.status(err.status || 500);
                res.render('error', {
                    message: err.message,
                    error: err
                });
            });
        }

// production error handler
// no stacktraces leaked to user
        app.use(function (err, req, res, next) {
            res.status(err.status || 500);
            res.render('error', {
                message: err.message,
                error: {}
            });
        });
    }

    function init(app) {
        //DBMain.init();
        // setTimeout(DBMain.stop, 10000);

        /**
         * Get port from environment and store in Express.
         */

        console.info("process.env.PORT = " + process.env.PORT);
        _config.port = normalizePort(process.env.PORT || 80);
        app.set('port', _config.port);

        /**
         * Create HTTP server.
         */

        server = http.createServer(app);

        /**
         * Listen on provided port, on all network interfaces.
         */
        server.listen(app.get('port'));
        server.on('error', onError);
        server.on('listening', onListening);
        console.log("started, listen on: " + _config.port);
    }

    /**
     * Normalize a port into a number, string, or false.
     */

    function normalizePort(val) {
        var port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }

        return false;
    }

    /**
     * Event listener for HTTP server "error" event.
     */

    function onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }

        var bind = typeof _config.port === 'string'
            ? 'Pipe ' + _config.port
            : 'Port ' + _config.port;

        // handle specific listen errors with friendly messages
        switch (error.code) {
            case 'EACCES':
                console.error(bind + ' requires elevated privileges');
                process.exit(1);
                break;
            case 'EADDRINUSE':
                console.error(bind + ' is already in use');
                process.exit(1);
                break;
            default:
                throw error;
        }
    }

    /**
     * Event listener for HTTP server "listening" event.
     */

    function onListening() {
        var addr = server.address();
        var bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;
        debug('Listening on ' + bind);
    }

// start(newAppConfig);

// helper

    var Config = {
        useCloundServerSimulator: true
    };

    function startLocalSimulator(app) {
        // 在没有网络的情况下， 模仿 cloud图片服务器，
        app.use('/eplan/image/upload/mcImages', express.static(path.join(__dirname, './../../www/mcImages')));
        app.use('/eplan/image/upload/v1456716657', express.static(path.join(__dirname, './../../www/mcImages')));
        app.use('/eplan/image/upload', express.static(path.join(__dirname, './../../www/mcImages')));
    }

    function getApp() {
        return _app;
    }

    exports.start = start;
    exports.getApp = getApp;
    exports.app = _app;
})();
