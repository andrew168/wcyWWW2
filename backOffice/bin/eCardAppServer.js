/**
 * Created by Andrewz on 8/4/2016.
 */
var appConfig = require('./eCardAppConfig.js');
var appServer = require('./server.js');

appServer.start(appConfig);
var app = appServer.getApp();

exports.app = app;