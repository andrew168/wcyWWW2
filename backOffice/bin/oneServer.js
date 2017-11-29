//Server.js就是 eCardAppServer.js
// std module

(function() {

    var debug = require('debug')('iCardSvr2:server');
    var http = require('http');
    var server;
    var _config = {};
    var logger = require('./../common/logger');
    var express = require('express');
    var path = require('path');
    var favicon = require('serve-favicon');
    var loggerMorgan = require('morgan');
    var cookieParser = require('cookie-parser');
    var bodyParser = require('body-parser');

// our own module
    var userStat = null;
    var _app = null,
        // 实测：
        // ** 如果不指定maxAge，则返回304代码，表明未修改， 在reload时候使用cache
        // ** 如果指定maxAge，则返回200代码。 在reload时候也使用cache
        noCacheOptions = {maxAge:'0'},
        cacheOptions ={maxAge: '300d'}; // 300 days,

    function start(newAppConfig) {
        var appConfig = newAppConfig;
        if (!appConfig) {
            appConfig = require('./eCardAppConfig.js');
        }
        logger.config(getLogFile(appConfig.name));

        console.log("//////////////////////////////");
        console.log("///      start new server  ///");
        console.log("//////////////////////////////");

        var app = express();
        _app = app;
        start2(app, appConfig);

//  使用数据库的操作， 都必须在数据库启动之后， 再启动
        var dbMain = require('./../db/dbMain');
        dbMain.init(app, appConfig, function () {
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
        userStat = require('./../common/status');

        console.log("exit at onDbStarted!");

        start3(app, appConfig);
    }

    function start3(app, appConfig) {
        if (!appConfig.useVHost) {
            init();
        }
        setupBasicRoutes(app, appConfig);
    }

    function start2(app, appConfig) {
// view engine setup
        app.set('views', path.join(__dirname, './../views'));
        app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
        app.use(loggerMorgan('dev'));
        app.use(bodyParser.json({limit: '50mb'}));
        app.use(bodyParser.urlencoded({
            limit: '50mb',
            extended: true}));
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
        setStaticRoutes(app, appConfig);
    }

    function setStaticRoutes(app, appConfig) {
        var clientPath = path.join(__dirname, appConfig.wwwRoot);
        var clientPathStatic = path.join(__dirname, './../public');

        function inWhiteList(ext) {
            var whiteList = ['.css', '.js', '.ttf', '.html', '.jpg', '.png', '.gif',
                '.mp4', '.wav', '.mp3', '.map'];

            for (var i = 0; i < whiteList.length; i++) {
                if (ext.indexOf(whiteList[i]) >= 0 ) {
                    return true;
                }
            }

            return false;
        }

        // 以上的路径是静态文件，排除在外,不log访问情况
        app.use(function (req, res, next) {
            // console.log("I'm first!!! for any path, 除了以上的路径");
            var url = req.url.split(/[?,#]/)[0],
                ext = url.substr(url.lastIndexOf('.')),
                user;

            ext = ext.toLocaleLowerCase();
            if (inWhiteList(ext)) {
                next();
            } else {
                if (userStat && req.header('Authorization') &&
                    (user = userStat.getUserInfo(req, res))) { // 可能尚未启动userStat, 因为需要启动db的支持，比较慢
                    userStat.logUser(user, req, res);
                }
                next();
            }
        });

        console.log("current path:" + __dirname);
        console.log("client path (dynamic): " + clientPath);
        console.log("client path (static): " + clientPathStatic);

        // "/opus/0_839_9749_1511749528598.html"
        app.get(/\/opus\/.*\.html/, function(req, res, next){
            if (req.query.play || req.params.play) {
                return redirectToMainApp(req, res);
            }

            if (!isBot(req, res, next)) {
                return redirectToMainApp(req, res);
            }

            var staticFileHandler = express.static(path.join(__dirname, appConfig.wwwRoot + '/opus'));
            return staticFileHandler(req, res, next);
        });

        //专指的规则放在前面
        var staticPaths = ['/css', '/wcy3'];
        staticPaths.forEach(function(item) {
            app.use(item, express.static(path.join(__dirname, appConfig.wwwRoot + item), cacheOptions));
        });
        // 泛指的规则放在后面，（适用于其余文件， 除了前面专指的规则之外的）
        app.use(express.static(clientPath, noCacheOptions));
        app.use('/static', express.static(clientPathStatic, cacheOptions));
    }

    function redirectToMainApp(req, res) {
        var shareCode = req.originalUrl.split(/[.|\/]/)[2];
        return res.redirect('http://show.udoido.com/#/opus/' + shareCode);
    }

    function setupBasicRoutes(app, appConfig) {
        if (Config.useCloundServerSimulator) {
            startLocalSimulator(app, appConfig);
        }

        //* 把 SAP 中的 state都映射到起始页
        app.use('/edit/*', state2index);
        app.use('/opus/*', state2index);

        function state2index(req, res) {
            if (isSharedPageHtml(req)) {
                return redirectToMainApp(req, res);
            } else if (!isStatePath(req.baseUrl)) {
                next(req, res);
            } else {
                res.sendFile(path.join(__dirname, appConfig.wwwRoot + '/index.html'));
            }
        }

        function isStatePath(url) {
            return (!url) || (url.lastIndexOf(".") < 0);
        }

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

    function startLocalSimulator(app, appConfig) {
        // 在没有网络的情况下， 模仿 cloud图片服务器，
        app.use('/eplan/image/upload/mcImages', express.static(path.join(__dirname, appConfig.wwwRoot + '/mcImages'), cacheOptions));
        app.use('/eplan/image/upload/v1456716657', express.static(path.join(__dirname, appConfig.wwwRoot + '/mcImages'), cacheOptions));
        app.use('/eplan/image/upload', express.static(path.join(__dirname, appConfig.wwwRoot + '/mcImages'), cacheOptions));
    }

    function getApp() {
        return _app;
    }

    function getLogFile(appName) {
        var t = new Date();
        return "udoido-" + appName + t.getTime() + '-' + t.getFullYear() + '-' + (t.getMonth() + 1) + '-' + t.getDate() +
                '-' + t.getHours() + '-' + t.getMinutes() + ".log"
    }

    function isSharedPageHtml(req) {
        return (req.originalUrl && (req.originalUrl.toLowerCase().indexOf('.html') >= 0));
    }

    function isBot(req, res, next) {
        var knownBots = ["baiduspider", "facebookexternalhit", "twitterbot",
            "rogerbot", "linkedinbot", "embedly|quora\ link\ preview",
            "howyoubot", "outbrain", "pinterest", "slackbot",
            "vkShare", "W3C_Validator"],
            foundBot = false,
            botReqUrl = "",
            botName = "",
            urlRequest = req.url,
            userAgent = req.get('User-Agent');

        console.info('user Agent:' + userAgent);
        console.info('user_source: ' + userAgent.source);
        console.info('request_url: ' + urlRequest);

        /* Lets start with ?_escaped_fragment_=, this seems to be a standard, if we have this is part of the request,
         it should be either a search engine or a social media site askign for open graph rich sharing info
         */
        if (urlRequest.search("\\?_escaped_fragment_=") != -1) { // bot who support # hashtag fragment
            botName = "ESCAPED_FRAGMENT_REQ";
            foundBot = true; //It says its a bot, so we believe it, lest figure out if it has a request before or after
            var reqBits = urlRequest.split("?_escaped_fragment_=");
            console.log(reqBits[1].length);
            if (reqBits[1].length == 0) { //If 0 length, any request is infront
                botReqUrl = reqBits[0];
            } else {
                botReqUrl = reqBits[1];
            }
        } else {
            knownBots.some(function(item) {
                if (userAgent.search(item) != -1) {
                    foundBot = true;
                    botReqUrl = urlRequest;
                    botName = item;
                    return true;
                }
                return false;
            })
        }


        if (foundBot == true) {
            console.info({botID: botName, botReq: botReqUrl});
        }
        return foundBot;
    }

    exports.start = start;
    exports.getApp = getApp;
    exports.app = _app;
})();
