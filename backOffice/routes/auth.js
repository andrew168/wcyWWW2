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
    authHelper = require('./authHelper'),
    config = authHelper.config,
    fs = require('fs'),
    qs = require('qs'),
    userController = require('../db/user/userController');

var composeErrorPkg = userController.composeErrorPkg,
    composeUserPkg = userController.composeUserPkg;

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
        status.logUser(user, req, res);
        if (!req.body.password) {
            return responseError(res, Const.HTTP.STATUS_401_UNAUTHORIZED, 'Invalid email and/or password');
        }

        user.comparePassword(req.body.password, function (err, isMatch) {
            if (err) {
                return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, err.message);
            }

            if (!isMatch) {
                return responseError(res, Const.HTTP.STATUS_401_UNAUTHORIZED, 'Invalid email and/or password');
            }
            resUserToken2(req, res, user);
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
        saveAndResponse(req, res, user);
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
        groupId = req.body.groupId || "11111",
        userType = req.body.userType || userController.USER_TYPE.STUDENT;
        displayName = req.body.displayName || null;

    // status.logUser(req);
    var errorId = Const.ERROR.NO,
        errorMsg = '';

    if (!isValidDisplayName(displayName)) {
        displayName = name;
    }

    if (!isValidDisplayName(displayName)) {
        errorId = Const.ERROR.DISPLAY_NAME_INVALID;
        errorMsg = 'display name at least 1 character';
    } else if (!isValidFormat(name)) {
        errorId = Const.ERROR.NAME_IS_INVALID;
        errorMsg = 'invalid name';
    } else if (!isValidFormat(psw)) {
        errorId = Const.ERROR.PASSWORD_IS_INVALID;
        errorMsg = 'invalid password format';
    }

    if (errorId !== Const.ERROR.NO) {
        return sendBackErrorInfo1(errorMsg, errorId);
    }

    function sendBackErrorInfo1(msg, errorId) {
        var data = composeErrorPkg(msg, errorId);
        status.onLoginFailed(req, res, data);
        res.send(data);
    }

    User.findOne({email: email}, function (err, user) {
        if (err) {
            return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, err.message);
        }

        if (user) {
            errorId = Const.ERROR.NAME_IS_INVALID_OR_TAKEN;
            var pkg = composeErrorPkg('Email is already taken', errorId);
            return responseError(res, Const.HTTP.STATUS_409_CONFLICT, pkg);
        }
        var user = new User({
            name: email, // email or phone number
            displayName: displayName,
            groupId: groupId,
            type: userType,
            email: email,
            password: psw
        });
        saveAndResponse(req, res, user);
    });
});

router.get('/api/me', authHelper.ensureAuthenticated, function (req, res) {
    User.findById(req.user, function (err, user) {
        var errDesc;
        if (err) {
            errDesc = err.message;
        } else if (!user) {
            errDesc = "No user found with this token";
        }

        if (errDesc) {
            return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, errDesc);
        }

        var userInfo = composeUserPkg(user);
        status.onLoginSucceed(req, res, userInfo, req.tokenId); //
        res.send(userInfo);
    });
});

router.put('/api/me', authHelper.ensureAuthenticated, function (req, res) {
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
        if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
            return responseError500(res, err, accessToken);
        }

        // Step 2. Retrieve profile information about the current user.
        request.get({url: graphApiUrl, qs: accessToken, json: true}, function (err, response, profile) {
            if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
                return responseError500(res, err, profile);
            }

            var requestToLink = !!req.header('Authorization'),
                unifiedProfile = unifyProfile(
                    profile.id,
                    profile.email,
                    profile.displayName,
                    'https://graph.facebook.com/' + profile.id + '/picture?type=large'
                    // 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large'
                );
            return responseUserInfo(res, req, {facebook: unifiedProfile.id}, unifiedProfile, Const.AUTH.FACEBOOK, requestToLink);
        });
    });
});

router.post('/wechat', function (req, res) {
    // 参考： https://mp.weixin.qq.com/wiki?t=resource/res_main&id=mp1421140842
    var redirect_uri = req.body.redirectUri,
        getCodeUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize?' +
            'appid=' + config.WECHAT_APPID +
            '&redirect_uri=' + redirect_uri +
            '&response_type=code' +
            '&scope=' + 'snsapi_login' +  //snsapi_userinfo,  snsapi_base
            '&state=' + 'STATE123' + // 可以任意取值
            '#wechat_redirect';
    // 如果用户同意授权，页面将跳转至 redirect_uri/?code=CODE&state=STATE。
    // code只能使用一次，5分钟未被使用自动过期。
    // code作为换取access_token的票据，每次用户授权带上的code将不一样.
    //尤其注意：由于公众号的secret和获取到的access_token安全级别都非常高，
    // 必须只保存在服务器，不允许传给客户端。
    // 后续刷新access_token、通过access_token获取用户信息等步骤，也必须从服务器发起。

    request.get({url: getCodeUrl, qs: {}, json: true}, function (err, response, data) {
        if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
            return responseError500(res, err, data);
        }

        var code2TokenUrl = 'https://api.weixin.qq.com/sns/oauth2/access_token?' +
            'appid=' + config.WECHAT_APPID +
            '&secret=' + config.WECHAT_SECRET +
            '&data=' + readQs(url, 'data') +
            '&grant_type=authorization_code';

        request.get({url: code2TokenUrl, qs: {}, json: true}, function (err, response, data) {
            if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
                return responseError500(res, err, data);
            }

            var webAuth_access_token = data.access_token,
                openid = data.openid;
            // access_token拥有较短的有效期，
            // 可以使用refresh_token进行刷新，refresh_token有效期为30天，
            // 当refresh_token失效之后，需要用户重新授权。
            // Step 2. Retrieve profile information about the current user.
            var profileApiUrl = 'https://api.weixin.qq.com/sns/userinfo?' +
                'access_token=' + webAuth_access_token +
                '&openid=' + openid +
                '&lang=zh_CN';
            request.get({url: profileApiUrl, qs: {}, json: true}, function (err, response, profile) {
                if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
                    return responseError500(res, err, profile);
                }

                var requestToLink = !!req.header('Authorization'),
                    unifiedProfile = unifyProfile(
                        profile.openid,
                        null, // email， nice to have, 不能是必须的，因为很多微信用户就没有email
                        profile.nickName,
                        profile.headimgurl
                    );
                return responseUserInfo(res, req, {facebook: unifiedProfile.id}, unifiedProfile, Const.AUTH.FACEBOOK, requestToLink);
            });
        });
    });
});

function responseUserInfo(res, req, condition, profile, authName, requestToLink) {
    User.findOne(condition, onFound);
    function onFound(err, user) {
        if (err) {
            return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, err.message);
        } else if (user) {
            user = updateUser(user, profile, authName);
        } else {
            if (requestToLink && req) { // 未发现已经link好的账号，
                var token = req.header('Authorization').split(' ')[1];
                var payload = jwt.decode(token, config.TOKEN_SECRET);
                condition = {_id: payload.sub};
                return responseUserInfo(res, null, condition, profile, authName, requestToLink);
            } else {
                user = createUser(profile, authName);
            }
        }
        return saveAndResponse(req, res, user);
    }
}

function updateUser(userModel, profile, authName) {
    var prefix = Const.AUTH_PREFIX[authName];
    if (userModel.name === (prefix + 'undefined')) {
        userModel.name = null;
    }
    if (userModel.psw === (prefix + 'undefined')) {
        userModel.psw = null;
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
            if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
                return responseError500(res, err, body);
            }

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
        if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
            return responseError500(res, err, accessToken);
        }

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
            var requestToLink = !!req.header('Authorization'),
                unifiedProfile = unifyProfile(
                    profile.id,
                    profile.email,
                    profile.displayName,
                    profile.profile_image_url_https.replace('_normal', '')
                    // 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large'
                );

            return responseUserInfo(res, req, {twitter: unifiedProfile.id}, unifiedProfile, Const.AUTH.TWITTER, requestToLink);
        });
    });
}

router.post('/google', function (req, res) {
    var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
    var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
    var params = {
        code: req.body.code,
        client_id: req.body.clientId,
        client_secret: config.GOOGLE_SECRET,
        redirect_uri: req.body.redirectUri,
        grant_type: 'authorization_code'
    };

    // Step 1. Exchange authorization code for access token.
    request.post(accessTokenUrl, {json: true, form: params}, function (err, response, token) {
        if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
            return responseError500(res, err, token);
        }

        var accessToken = token.access_token;
        var headers = {Authorization: 'Bearer ' + accessToken};

        // Step 2. Retrieve profile information about the current user.
        request.get({url: peopleApiUrl, headers: headers, json: true}, function (err, response, profile) {
            if (err || (response.statusCode !== Const.HTTP.STATUS_200_OK)) {
                return responseError500(res, err, profile);
            }

            // Step 3a. Link user accounts.
            var requestToLink = !!req.header('Authorization'),
                unifiedProfile = unifyProfile(
                    profile.sub, // 不是id！！！， google 用sub代替id
                    profile.email,
                    profile.displayName,
                    profile.picture.replace('sz=50', 'sz=200')
                );
            return responseUserInfo(res, req, {google: unifiedProfile.id}, unifiedProfile, Const.AUTH.GOOGLE, requestToLink);
        });
    });
});

function createJWT(user, tokenId) {
    var payload = {
        salt: Math.round(Math.random() * 1000),
        sub: user._id,
        tokenId: tokenId,
        iat: moment().unix(),
        exp: moment().add(14, 'days').unix()
    };
    return jwt.encode(payload, config.TOKEN_SECRET);
}

function responseError(res, statusCode, msg) {
    return authHelper.responseError(res, statusCode, msg);
}

function responseError500(res, err, data) {
    var errDesc = (err) ? err.message : (data.error ? data.error.message : 'unknown error');
    return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, errDesc);
}

function resUserToken2(req, res, user) {
    var tokenId = authHelper.generateTokenId(),
        token = createJWT(user, tokenId),
        userInfo = composeUserPkg(user);
    status.onLoginSucceed(req, res, userInfo, tokenId);
    res.send({token: token, data: userInfo});
}

function saveAndResponse(req, res, userModel) {
    userModel.save(function (err, userModel) {
        if (err) {
            var pkg = composeErrorPkg(err, Const.ERROR_NAME_EXIST_OR_INVALID_FORMAT);
            return responseError(res, Const.HTTP.STATUS_500_INTERNAL_SERVER_ERROR, pkg);
        }
        resUserToken2(req, res, userModel);
    });
}

function isValidFormat(name) {
    return ((name) && (name.length >= 8));
}

function isValidDisplayName(name) {
    return ((name) && (name.length >= 1));
}

function unifyProfile(id, email, displayName, pictureUrl) {
    return {
        id: id,
        email: email,
        displayName: displayName,
        picture: pictureUrl
    };
}

function readQs(url, paraName) {
    var queryString = url.substr(url.indexOf('?') + 1);
    return qs.parse(queryString)[paraName];
}

module.exports = router;
