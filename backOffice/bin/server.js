var debug = require('debug')('iCardSvr2:vHostServer');
var http = require('http'),
    https = require('https'),
    cors = require('cors'),
    vhost = require('vhost'),
    compression = require('compression'),
    express = require('express'),
    gracefulExit = require('express-graceful-exit'),
    onlineUsers = require('../common/onlineUsers');

var vHostServer, vSecuredServer;
var config = {port: 80};
var app = express();
var shuttingDown = false;
init();

function init() {
    var optionForSecuredServer = {
        //证书信息
    };
    app.use(cors());
    app.use(compression());
    vHostServer = http.createServer(app);
    vSecuredServer = https.createServer(optionForSecuredServer, app);
    app.use(gracefulExit.middleware(app)); //!!! gracefulExit 必须是app的第一个配置
    console.info("process.env.PORT = " + process.env.PORT);
    config.port = normalizePort(process.env.PORT || config.port);
    app.set('port', config.port);
    process.on('SIGINT', function () {
        console.log("received SIGINT...");
        onShotdown();
    });

    process.on('SIGTERM', function () {
        console.log("received Terminate...");
        onShotdown();
    });

    app.use(function (req, res, next) {
        if (shuttingDown) {
            return;
        }
        next();
    });

//    app.use(vhost('www.kidsafer.org', require('./kidSaferAppServer').app));
// app.use(vhost('www.kidsafer.org', require('./vHostTest2AppServer').app));
    app.use(vhost('show.udoido.cn', require('./eCardAppServer').app));
//app.use(vhost('show.udoido.com', require('./eCardAppServer').app));
//app.use(vhost('cyly.udoido.cn', require('./eCardAppServer').app));
//    app.use(vhost('wish.udoido.cn', require('./wishAppServer').app));

    onlineUsers.restore();

    /**
     * Listen on provided port, on all network interfaces.
     */
    vHostServer.listen(app.get('port'));
    vHostServer.on('error', onError);
    vHostServer.on('listening', onListening);
    vSecuredServer.listen(443);
    vSecuredServer.on('error', onError);
    vSecuredServer.on('listening', onListeningSecuredServer);
    console.log("started, listen on: " + config.port);
}

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

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof config.port === 'string'
        ? 'Pipe ' + config.port
        : 'Port ' + config.port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            onShotdown();
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            onShotdown();
            break;
        default:
            onShotdown();
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = vHostServer.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}

function onListeningSecuredServer() {
    var addr = vSecuredServer.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening Secured Server on ' + bind);
}

function onShotdown() {
    if (shuttingDown) {
        return;
    }

    console.log("prepare to shut dwon server ...");
    shuttingDown = true;
    if (onlineUsers) {
        onlineUsers.save(onSaved);
    } else {
        onSaved();
    }

    function onSaved() {
        console.log("shutting dwon server gracefully...!");
        gracefulExit.gracefulExitHandler(app, vSecuredServer, {
            // socketio: app.settings.socketio,
            exitProcess: false,
            suicideTimeout: 130 * 1000, // ms
            callback: onShutdownSuccessfully
        });

        gracefulExit.gracefulExitHandler(app, vHostServer, {
            // socketio: app.settings.socketio,
            exitProcess: false,
            suicideTimeout: 130 * 1000, // ms
            callback: onShutdownSuccessfully
        });
    }
}

var shutdownCounter = 0;
function onShutdownSuccessfully(statusCode) {
    shutdownCounter ++;
    console.info("Shutdown successfully!" + statusCode);
    if (shutdownCounter >=2) { // 确认http和https都关闭了
        process.exit(statusCode);
    }
}
