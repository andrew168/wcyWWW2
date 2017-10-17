var express = require('express'),
    router = express.Router(),
    request = require('request'),
    jwt = require('jwt-simple'),
    moment = require('moment'),
    mongoose = require('mongoose'),
    User = mongoose.model('User');

var config = {
    // App Settings
    TOKEN_SECRET: "cAroUG07p3qA04UYI1HWSheHaH4GIrK_JXsZ5Hjj1ST5KI4wZm-B2mHQU7LueA2U", // JWT's secret,

    // OAuth 2.0
    FACEBOOK_SECRET: process.env.FACEBOOK_SECRET || '806ead2d9cf4864704ffd3f970353f4c'
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
            return resError2(res, 500, err.message);
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
        saveAndResponse(user, res);
    });
}


router.post('/signup', function (req, res) {
    var email = req.body.email;
    if (email) {
        email = email.toLocaleLowerCase();
    } else {
        return resError2(res, 500, "email is empty！");
    }

    User.findOne({email: email}, function (err, existingUser) {
        if (err) {
            return resError2(res, 500, err.message);
        }

        if (existingUser) {
            return resError2(res, 409, 'Email is already taken');
        }
        var user = new User({
            name: email, // email or phone number
            displayName: req.body.displayName,
            email: email,
            password: req.body.password
        });
        saveAndResponse(user, res);
    });
});

router.get('/api/me', ensureAuthenticated, function (req, res) {
    User.findById(req.user, function (err, user) {
        if (err) {
            return resError2(res, 500, err.message);
        }

        res.send(user);
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

            User.findOne({facebook: profile.id}, function (err, existingUser) {
                if (err) {
                    return resError(err.message);
                } else if (existingUser) {
                    return updateUser(existingUser, profile, resUserToken);
                }
                    return createUser(profile, resUserToken);
            });
        });
    });

    function resUserToken(user) {
        resUserToken2(res, user);
    }

    function resError(msg) {
        resError2(res, 500, msg);
    }

    function updateUser(userModel, profile, callback) {
        if (userModel.facebook !== profile.id) {
            console.log(userModel._id + ": this user has 1+ facebook account? " + userModel.facebook + ', ' + profile.id);
        }
        //及时更新user的名字和pic， 以保持与fb一致
        userModel.picture = userModel.picture || 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large';
        userModel.displayName = userModel.displayName || profile.name;
        saveAndResponse(user, res);
    }

    function createUser(profile, callback) {
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

function createJWT(user) {
    var payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(14, 'days').unix()
    };
    return jwt.encode(payload, config.TOKEN_SECRET);
}

function resError2(res, statusCode, msg) {
    return res.status(statusCode).send({message: msg});
}

function resUserToken2(res, user) {
    var token = createJWT(user);
    res.send({token: token});
}

function saveAndResponse(user, res) {
    user.save(function (err, userModel) {
        if (err) {
            return resError2(res, 500, err.message);
        }
        resUserToken2(res, userModel);
    });
}

module.exports = router;
