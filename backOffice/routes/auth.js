var express = require('express'),
    router = express.Router(),
    request = require('request'),
    jwt = require('jwt-simple'),
    moment = require('moment'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Const = require('../base/const'),
    utils = require('../common/utils'), // 后缀.js可以省略，Node会自动查找，
    status = require('../common/status'),
    netCommon = require('../common/netCommonFunc'),
    fs = require('fs'),
    qs = require('qs'),
    userController = require('../db/user/userController');

var composeErrorPkg = userController.composeErrorPkg,
    composeUserPkg = userController.composeUserPkg;

var config = {
    // App Settings
    TOKEN_SECRET: "cAroUG07p3qA04UYI1HWSheHaH4GIrK_JXsZ5Hjj1ST5KI4wZm-B2mHQU7LueA2U", // JWT's secret,

    // OAuth 2.0
    FACEBOOK_SECRET: process.env.FACEBOOK_SECRET || '806ead2d9cf4864704ffd3f970353f4c',

    // OAuth 1.0
    TWITTER_KEY: process.env.TWITTER_KEY || '5BrblmjAPGKbxnfAqo8nFjF6t',
    TWITTER_SECRET: process.env.TWITTER_SECRET || 'dvHK06QeB68s0CfBkWvTDYiPYZLnf9xOTNKL7FLe2gqVgMgEv4'
};

router.post('/login', function (req, res) {
    var email = req.body.email;
    if (email) {
        email = email.toLocaleLowerCase();
    } else {
        return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, "email is empty！");
    }
    User.findOne({email: req.body.email}, '+password', function (err, user) {
        if (err) {
            var pkg = composeErrorPkg(err, Const.ERROR.PASSWORD_IS_INVALID_OR_INCORRECT);
            return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, pkg);
        }

        if (!user) {
            return failedOrOldPswUser(req, res);
        }
        user.comparePassword(req.body.password, function (err, isMatch) {
            if (err) {
                return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, err.message);
            }

            if (!isMatch) {
                return responseError(res, Const.HTTP.STATUS_401_UNAUTHORIZED, 'Invalid email and/or password');
            }
            resUserToken2(res, user);
        });
    });
});

function failedOrOldPswUser(req, res) {
    var email = req.body.email.toLocaleLowerCase();

    User.findOne({name: email, psw: req.body.password}, function (err, user) {
        if (err) {
            return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, err.message);
        }

        if (!user) {
            return responseError(res, Const.HTTP.STATUS_401_UNAUTHORIZED, 'Invalid email and/or password');
        }

        user.email = email;
        user.password = req.body.password;
        user.psw = ""; // 删除就psw
        saveAndResponse(res, user);
    });
}

router.post('/signup', function (req, res) {
    var email = req.body.email;
    if (email) {
        email = email.toLocaleLowerCase();
    } else {
        return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, "email is empty！");
    }

    var name = email,
        psw = req.body.password || null,
        displayName = req.body.displayName || null;

    // status.logUser(req);
    var errorID = Const.ERROR.NO;
    if (!isValidFormat(displayName)) {
        errorID = Const.ERROR.DISPLAY_NAME_INVALID;
    } else if (!isValidFormat(name)) {
        errorID = Const.ERROR.NAME_IS_INVALID;
    } else if (!isValidFormat(psw)) {
        errorID = Const.ERROR.PASSWORD_IS_INVALID;
    }

    if (errorID !== Const.ERROR.NO) {
        return sendBackErrorInfo1({result: false, errorID: errorID});
    }

    function sendBackErrorInfo1(data) {
        status.onSignUp(req, res, data);
        res.send(data);
    }

    User.findOne({email: email}, function (err, user) {
        if (err) {
            return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, err.message);
        }

        if (user) {
            errorID = Const.ERROR.NAME_IS_INVALID_OR_TAKEN;
            var pkg = composeErrorPkg('Email is already taken', errorID);
            return responseError(res, Const.HTTP.STATUS_409_CONFLICT, pkg);
        }
        var user = new User({
            name: email, // email or phone number
            displayName: req.body.displayName,
            email: email,
            password: req.body.password
        });
        saveAndResponse(res, user);
    });
});

router.get('/api/me', ensureAuthenticated, function (req, res) {
    User.findById(req.user, function (err, user) {
        if (err) {
            return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, err.message);
        }

        res.send(composeUserPkg(user));
    });
});

router.put('/api/me', ensureAuthenticated, function (req, res) {
    User.findById(req.user, function (err, user) {
        if (err) {
            return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, err.message);
        }

        if (!user) {
            return responseError(res, Const.HTTP.STATUS_400_BAD_REQUEST, 'User not found');
        }
        user.displayName = req.body.displayName || user.displayName;
        user.email = req.body.email || user.email;
        user.save(function (err) {
            res.status(Const.HTTP.STATUS_200_OK).end();
        });
    });
});

function ensureAuthenticated(req, res, next) {
    if (!req.header('Authorization')) {
        return responseError(res, Const.HTTP.STATUS_401_UNAUTHORIZED, 'Please make sure your request has an Authorization header');
    }
    var token = req.header('Authorization').split(' ')[1];

    var payload = null;
    try {
        payload = jwt.decode(token, config.TOKEN_SECRET);
    }
    catch (err) {
        return responseError(res, Const.HTTP.STATUS_401_UNAUTHORIZED, err.message);
    }

    if (payload.exp <= moment().unix()) {
        return responseError(res, Const.HTTP.STATUS_401_UNAUTHORIZED, 'Token has expired');
    }
    req.user = payload.sub;
    next();
}

router.post('/facebook', function (req, res) {
    var fields = ['id', 'email', 'first_name', 'last_name', 'link', 'name'];
    var accessTokenUrl = 'https://graph.facebook.com/v2.5/oauth/access_token';
    var graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + fields.join(',');
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: "806ead2d9cf4864704ffd3f970353f4c",
        redirect_uri: req.body.redirectUri
    };

    // Step 1. Exchange authorization code for access token.
    request.get({url: accessTokenUrl, qs: params, json: true}, function (err, response, accessToken) {
        if (err) {
            return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, err.message);
        }

        if (response.statusCode !== Const.HTTP.STATUS_200_OK) {
            return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, accessToken.error.message);
        }

        // Step 2. Retrieve profile information about the current user.
        request.get({url: graphApiUrl, qs: accessToken, json: true}, function (err, response, profile) {
            if (err) {
                return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, err.message);
            }

            if (response.statusCode !== Const.HTTP.STATUS_200_OK) {
                return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, profile.error.message);
            }

            return responseUserInfo(res, {facebook: profile.id}, profile, Const.AUTH.FACEBOOK);
        });
    });
});

function responseUserInfo(res, condition, profile, authName) {
    User.findOne(condition, function (err, user) {
        if (err) {
            return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, err.message);
        } else if (user) {
            user = updateUser(user, profile, authName);
        } else {
            user = createUser(profile, authName);
        }
        return saveAndResponse(res, user);
    });
}

function updateUser(userModel, profile, autherName) {
    var prefix = null;
    switch (autherName) {
        case Const.AUTH.FACEBOOK:
            prefix = "fb";
            if (!!userModel.facebook && (userModel.facebook !== profile.id)) {
                console.log(userModel._id + ": this userModel has 1+ facebook account? " + userModel.facebook + ', ' + profile.id);
            }
            userModel.facebook = profile.id;
            userModel.picture = userModel.picture || 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
            // 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large'
            break;
        case Const.AUTH.TWITTER:
            prefix = "tt";
            userModel.twitter = profile.id;
            userModel.picture = userModel.picture || profile.profile_image_url_https.replace('_normal', '');
            break;
        default :
            console.error("未知的Auth应用:" + autherName)
    }

    userModel.name = userModel.name || (prefix + profile.id);
    userModel.psw = userModel.psw || (prefix + profile.id);
    userModel.email = userModel.email || profile.email;
    userModel.displayName = userModel.displayName || profile.name;
    return userModel;
}

function createUser(profile, autherName) {
    var userModel = new User();
    return updateUser(userModel, profile, autherName);
}

var requestTokenUrlTwitter = 'https://api.twitter.com/oauth/request_token';
var accessTokenUrlTwitter = 'https://api.twitter.com/oauth/access_token';
var profileUrlTwitter = 'https://api.twitter.com/1.1/account/verify_credentials.json';

router.post('/twitter', function (req, res) {

    // Part 1 of 2: Initial request from Satellizer.
    if (!req.body.oauth_token || !req.body.oauth_verifier) {
        var requestTokenOauth = {
            consumer_key: config.TWITTER_KEY,
            consumer_secret: config.TWITTER_SECRET,
            // 在授权通过，但是不允许获取用户资料的情况下， 调用此url
            // 如果允许获取用户资料，则不调用此url
            callback: req.body.redirectUri
        };

        // Step 1. Obtain request token for the authorization popup.
        request.post({url: requestTokenUrlTwitter, oauth: requestTokenOauth}, function (err, response, body) {
            var oauthToken = qs.parse(body);
            console.log('oauth_token: ' + oauthToken.oauth_token);
            console.log('oauth_verifier: ' + oauthToken.oauth_verifier);

            // Step 2. Send OAuth token back to open the authorization screen.
            if (oauthToken.oauth_callback_confirmed === 'true') {
                // 必须返回这些Token， Twitter才会向用户显示授权请求信息
                res.send(oauthToken);
            } else {
                return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, "Authentication failed!");
            }
        });
    } else {
        return doTwitterPart2(req, res, req.body.oauth_token, req.body.oauth_verifier);
    }
});

function doTwitterPart2(req, res, oauth_token, oauth_verifier) {
    // Part 2 of 2: Second request after Authorize app is clicked.
    var accessTokenOauth = {
        consumer_key: config.TWITTER_KEY,
        consumer_secret: config.TWITTER_SECRET,
        token: oauth_token,
        verifier: oauth_verifier
    };

    // Step 3. Exchange oauth token and oauth verifier for access token.
    request.post({url: accessTokenUrlTwitter, oauth: accessTokenOauth}, function (err, response, accessToken) {
        accessToken = qs.parse(accessToken);

        var profileOauth = {
            consumer_key: config.TWITTER_KEY,
            consumer_secret: config.TWITTER_SECRET,
            token: accessToken.oauth_token,
            token_secret: accessToken.oauth_token_secret,
        };

        // Step 4. Retrieve user's profile information and email address.
        request.get({
            url: profileUrlTwitter,
            qs: {include_email: true},
            oauth: profileOauth,
            json: true
        }, function (err, response, profile) {
            return responseUserInfo(res, {twitter: profile.id}, profile, Const.AUTH.TWITTER);
        });
    });
}

function createJWT(user) {
    var payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(14, 'days').unix()
    };
    return jwt.encode(payload, config.TOKEN_SECRET);
}

function responseError(res, statusCode, msg) {
    if (typeof msg === 'string') {
        msg = JSON.stringify(composeErrorPkg(msg, Const.ERROR.GENERAL_ERROR));
    }
    return res.status(statusCode).send({message: msg});
}

function resUserToken2(res, user) {
    var token = createJWT(user);
    res.send({token: token});
}

function saveAndResponse(res, userModel) {
    userModel.save(function (err, userModel) {
        if (err) {
            var pkg = composeErrorPkg(err, Const.ERROR_NAME_EXIST_OR_INVALID_FORMAT);
            return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, pkg);
        }
        resUserToken2(res, userModel);
    });
}

function isValidFormat(name) {
    return ((name) && (name.length > 8));
}

module.exports = router;
