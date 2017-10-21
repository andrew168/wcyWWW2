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
        return resError2(res, 500, "email is empty！");
    }
    User.findOne({email: req.body.email}, '+password', function (err, user) {
        if (err) {
            var pkg = composeErrorPkg(err, Const.ERROR.PASSWORD_IS_INVALID_OR_INCORRECT);
            return resError2(res, 500, pkg);
        }

        if (!user) {
            return failedOrOldPswUser(req, res);
        }
        user.comparePassword(req.body.password, function (err, isMatch) {
            if (err) {
                return resError2(res, 500, err.message);
            }

            if (!isMatch) {
                return resError2(res, 401, 'Invalid email and/or password');
            }
            resUserToken2(res, user);
        });
    });
});

function failedOrOldPswUser(req, res) {
    var email = req.body.email.toLocaleLowerCase();

    User.findOne({name: email, psw: req.body.password}, function (err, user) {
        if (err) {
            return resError2(res, 500, err.message);
        }

        if (!user) {
            return resError2(res, 401, 'Invalid email and/or password');
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
        return resError2(res, 500, "email is empty！");
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
            return resError2(res, 500, err.message);
        }

        if (user) {
            errorID = Const.ERROR.NAME_IS_INVALID_OR_TAKEN;
            var pkg = composeErrorPkg('Email is already taken', errorID);
            return resError2(res, 409, pkg);
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
            return resError2(res, 500, err.message);
        }

        res.send(composeUserPkg(user));
    });
});

router.put('/api/me', ensureAuthenticated, function (req, res) {
    User.findById(req.user, function (err, user) {
        if (err) {
            return resError2(res, 500, err.message);
        }

        if (!user) {
            return resError2(res, 400, 'User not found');
        }
        user.displayName = req.body.displayName || user.displayName;
        user.email = req.body.email || user.email;
        user.save(function (err) {
            res.status(200).end();
        });
    });
});

function ensureAuthenticated(req, res, next) {
    if (!req.header('Authorization')) {
        return resError2(res, 401, 'Please make sure your request has an Authorization header');
    }
    var token = req.header('Authorization').split(' ')[1];

    var payload = null;
    try {
        payload = jwt.decode(token, config.TOKEN_SECRET);
    }
    catch (err) {
        return resError2(res, 401, err.message);
    }

    if (payload.exp <= moment().unix()) {
        return resError2(res, 401, 'Token has expired');
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
            return resError2(res, 500, err.message);
        }

        if (response.statusCode !== 200) {
            return resError(accessToken.error.message);
        }

        // Step 2. Retrieve profile information about the current user.
        request.get({url: graphApiUrl, qs: accessToken, json: true}, function (err, response, profile) {
            if (err) {
                return resError2(res, 500, err.message);
            }

            if (response.statusCode !== 200) {
                return resError(profile.error.message);
            }

            User.findOne({facebook: profile.id}, function (err, user) {
                if (err) {
                    return resError(err.message);
                } else if (user) {
                    user = updateUser(user, profile, Const.AUTH.FACEBOOK);
                } else {
                    user = createUser(profile, Const.AUTH.FACEBOOK);
                }
                return saveAndResponse(res, user);
            });
        });
    });

    function resUserToken(user) {
        resUserToken2(res, user);
    }

    function resError(msg) {
        resError2(res, 500, msg);
    }

    function updateUser(userModel, profile, autherName) {
        if (userModel.facebook !== profile.id) {
            console.log(userModel._id + ": this user has 1+ facebook account? " + userModel.facebook + ', ' + profile.id);
        }
        //及时更新user的名字和pic， 以保持与fb一致
        userModel.picture = userModel.picture || 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large';
        userModel.displayName = userModel.displayName || profile.name;
        saveAndResponse(userModel, res);
    }

    function createUser(profile, autherName) {
        var user = new User();
        user.name = user.name || ("fb" + profile.id);
        user.psw = user.psw || ("fb" + profile.id);
        user.email = user.email || profile.email;
        user.facebook = profile.id;
        user.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
        user.displayName = profile.name;
        saveAndResponse(user, res);
    }

});

var requestTokenUrlTwitter = 'https://api.twitter.com/oauth/request_token';
var accessTokenUrlTwitter = 'https://api.twitter.com/oauth/access_token';
var profileUrlTwitter = 'https://api.twitter.com/1.1/account/verify_credentials.json';

router.post('/twitter', function (req, res) {

    // Part 1 of 2: Initial request from Satellizer.
    if (!req.body.oauth_token || !req.body.oauth_verifier) {
        var requestTokenOauth = {
            consumer_key: config.TWITTER_KEY,
            consumer_secret: config.TWITTER_SECRET,
            callback: req.body.redirectUri
        };

        // Step 1. Obtain request token for the authorization popup.
        request.post({url: requestTokenUrlTwitter, oauth: requestTokenOauth}, function (err, response, body) {
            var oauthToken = qs.parse(body);

            // Step 2. Send OAuth token back to open the authorization screen.
                res.send(oauthToken);
        });
            } else {
    // Part 2 of 2: Second request after Authorize app is clicked.
    var accessTokenOauth = {
        consumer_key: config.TWITTER_KEY,
        consumer_secret: config.TWITTER_SECRET,
            token: req.body.oauth_token,
            verifier: req.body.oauth_verifier
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

            // Step 5a. Link user accounts.
            if (req.header('Authorization')) {
                User.findOne({twitter: profile.id}, function (err, user) {
                    if (user) {
                        return res.status(409).send({message: 'There is already a Twitter account that belongs to you'});
                    }

                    var token = req.header('Authorization').split(' ')[1];
                    var payload = jwt.decode(token, config.TOKEN_SECRET);

                    User.findById(payload.sub, function (err, user) {
                        if (!user) {
                            return res.status(400).send({message: 'User not found'});
                        }

                            user.twitter = profile.id;
                            user.email = profile.email;
                            user.displayName = user.displayName || profile.name;
                            user.picture = user.picture || profile.profile_image_url_https.replace('_normal', '');
                            user.save(function (err) {
                                res.send({token: createJWT(user)});
                            });
                    });
                });
            } else {
                // Step 5b. Create a new user account or return an existing one.
                User.findOne({twitter: profile.id}, function (err, user) {
                    if (user) {
                        return res.send({token: createJWT(user)});
                    }

                        var user = new User();
                        user.twitter = profile.id;
                        user.email = profile.email;
                        user.displayName = profile.name;
                        user.picture = profile.profile_image_url_https.replace('_normal', '');
                        user.save(function () {
                            res.send({token: createJWT(user)});
                });
                    });
            }
        });
    });
}
});

function createJWT(user) {
    var payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(14, 'days').unix()
    };
    return jwt.encode(payload, config.TOKEN_SECRET);
}

function resError2(res, statusCode, msg) {
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
            return resError2(res, 500, pkg);
        }
        resUserToken2(res, userModel);
    });
}

function isValidFormat(name) {
    return ((name) && (name.length > 8));
}

module.exports = router;
