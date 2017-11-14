/**
 * Created by Andrewz on 10/30/17.
 */
var INAVLID_USER = 0;
var jwt = require('jwt-simple'),
    moment = require('moment'),
    assert = require('assert'),
    mongoose = require('mongoose'),
    Const = require('../base/const'),
    status = require('../common/status'),
    fs = require('fs'),
    userController = require('../db/user/userController');

var composeErrorPkg = userController.composeErrorPkg;
var config = {
    // App Settings
    TOKEN_SECRET: 'cAroUG07p3qA04UYI1HWSheHaH4GIrK_JXsZ5Hjj1ST5KI4wZm-B2mHQU7LueA2U', // JWT's secret,

    // OAuth 2.0
    FACEBOOK_SECRET: process.env.FACEBOOK_SECRET || '806ead2d9cf4864704ffd3f970353f4c',
    GOOGLE_SECRET: '1rtxnrU822p6jdCYbywmfQYQ',
    WECHAT_APPID: 'wx5fe65e70536d0258',
    WECHAT_SECRET: '393e38d14682d6e2ee524dbc96b080bf',

    // OAuth 1.0
    TWITTER_KEY: process.env.TWITTER_KEY || '5BrblmjAPGKbxnfAqo8nFjF6t',
    TWITTER_SECRET: process.env.TWITTER_SECRET || 'dvHK06QeB68s0CfBkWvTDYiPYZLnf9xOTNKL7FLe2gqVgMgEv4'
};

function ensureAuthenticated(req, res, next) {
    if (!req.header('Authorization')) {
        return responseError(res, Const.HTTP.STATUS_401_UNAUTHORIZED, 'Please make sure your request has an Authorization header');
    }
    var userId = getUserId(req, res);
    if (userId === INAVLID_USER) {
        return;
    }
    next();
}

function getUserId(req, res) {
    assert.ok(hasAuthInfo(req), "必须在Auth通过之后调用此");
    if (!hasAuthInfo(req)) {
        responseError(res, Const.HTTP.STATUS_401_UNAUTHORIZED, 'Please make sure your request has an Authorization header');
        return INAVLID_USER;
    }
    var token = req.header('Authorization').split(' ')[1];

    var payload = null; // payload是有效内容， token是被加密后的结果，
    try {
        payload = jwt.decode(token, config.TOKEN_SECRET);
    }
    catch (err) {
        responseError(res, Const.HTTP.STATUS_401_UNAUTHORIZED, err.message);
        return INAVLID_USER;
    }

    if (payload.exp <= moment().unix()) {
        responseError(res, Const.HTTP.STATUS_401_UNAUTHORIZED, 'Token has expired');
        return INAVLID_USER;
    }
    req.user = payload.sub;
    req.userId = payload.sub; //ToDo: 准备更名
    return req.user;
}

function responseError(res, statusCode, msg) {
    if (typeof msg === 'string') {
        msg = composeErrorPkg(msg, Const.ERROR.GENERAL_ERROR);
    }
    return res.status(statusCode).send(msg);
}

function hasAuthInfo(req) {
    return req.header('Authorization');
}

exports.config = config;
exports.ensureAuthenticated = ensureAuthenticated;
exports.getUserId = getUserId;
exports.hasAuthInfo = hasAuthInfo;
exports.responseError = responseError;
