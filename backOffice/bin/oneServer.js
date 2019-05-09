//Server.js就是 eCardAppServer.js
// std module

(function() {

    var debug = require('debug')('iCardSvr2:server'),
      serverConfig = require('./serverConfig'),
      http = require('http'),
       server,
     _config = {},
     logger = require('./../common/logger'),
     express = require('express'),
     path = require('path'),
     favicon = require('serve-favicon'),
     loggerMorgan = require('morgan'),
     cookieParser = require('cookie-parser'),
     bodyParser = require('body-parser');

// our own module
    var AGE_ONE_DAY = 24*60*60;  // seconds为单位，不是ms
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
        app.get('*', function (req, res, next) {
            if (req && (req.url)) {
              var path = req.url;
              if (path === '/' || path === '') { // index.html
                res.header('Cache-Control', 'public, max-age=0');
              } else if ((path.indexOf('/features/') >= 0) || // /features/目录下的
                (path.indexOf('.html') >= 0)) {           // html文件
                res.header('Cache-Control', 'public, max-age=0');
              } else if (path.indexOf('.') >= 0) { // 除了API之外的, (例如： .css, .png, .js, etc)
                res.header('Cache-Control', 'public, max-age=' + AGE_ONE_DAY);
              }
            }
            next();
        });

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
        /*
        此时log不合适。因为刚收到net请求，尚未核验用户身份
        */
        if (serverConfig.allowLog) {
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
        }

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
      var NOT_FOUND_PAGE = '0_1_0_0';
      var shareCode = req.query.sc;
      if (!shareCode) {
        shareCode = req.originalUrl.split(/[.|\/]/)[2];
      }
      if (!shareCode || shareCode === -1) {
        shareCode = NOT_FOUND_PAGE;
      }

      return res.redirect('http://show.udoido.com/#/do?sc=' + shareCode);
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
        console.info("process.env.NODE_ENV = " + process.env.NODE_ENV);
        _config.port = normalizePort(process.env.PORT || 80);
        app.set('port', _config.port);

        /**
         * Create HTTP server.
         */

        server = http.createServer(app);
        server.maxConnections = 6000; // 6 * 1000; 最多同时1000浏览器同时访问， 每个浏览器6个并发请求

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
            console.info({botId: botName, botReq: botReqUrl});
        }
        return foundBot;
    }

    exports.start = start;
    exports.getApp = getApp;
    exports.app = _app;
})();
