var debug = require('debug')('iCardSvr2:vHostServer');
var http = require('http');
var vhost = require('vhost');
var express = require('express');

var vHostServer;
var config = {port: 80};
var app = express();

app.use(function(req, res, next) {
    next();
});

app.use(vhost('www.kidsafer.org', require('./kidSaferAppServer').app));
// app.use(vhost('www.kidsafer.org', require('./vHostTest2AppServer').app));
app.use(vhost('show.udoido.cn', require('./eCardAppServer').app));
app.use(vhost('show.udoido.com', require('./eCardAppServer').app));
//app.use(vhost('cyly.udoido.cn', require('./eCardAppServer').app));
app.use(vhost('wish.udoido.cn', require('./wishAppServer').app));

init();

function init() {
    console.info("process.env.PORT = " + process.env.PORT);
    config.port = normalizePort(process.env.PORT || config.port);
    app.set('port', config.port);

    /**
     * Create HTTP vHostServer.
     */

    vHostServer = http.createServer(app);

    /**
     * Listen on provided port, on all network interfaces.
     */
    vHostServer.listen(app.get('port'));
    vHostServer.on('error', onError);
    vHostServer.on('listening', onListening);
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
    var addr = vHostServer.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}
