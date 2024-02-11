/**
 * Created by Andrewz on 8/4/2016.
 */
var appConfig = require("./kidSaferAppConfig.js");
var appServer = require("./oneServer.js");

appServer.start(appConfig);
var app = appServer.getApp();

exports.app = app;
