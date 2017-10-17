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
        if (response.statusCode !== 200) {
            return resError(accessToken.error.message);
        }

        // Step 2. Retrieve profile information about the current user.
        request.get({url: graphApiUrl, qs: accessToken, json: true}, function (err, response, profile) {
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
        var token = createJWT(user);
        res.send({token: token});
    }

    function resError(msg) {
        return res.status(500).send({message: msg});
    }

    function updateUser(userModel, profile, callback) {
        if (userModel.facebook !== profile.id) {
            console.log(userModel._id + ": this user has 1+ facebook account? " + userModel.facebook + ', ' + profile.id);
        }
        //及时更新user的名字和pic， 以保持与fb一致
        userModel.picture = userModel.picture || 'https://graph.facebook.com/v2.3/' + profile.id + '/picture?type=large';
        userModel.displayName = userModel.displayName || profile.name;
        userModel.save(function (err, userModel) {
            if (err) {
                resError(err.message);
            }
            callback(userModel._doc);
        });
    }

    function createUser(profile, callback) {
        var user = new User();
        user.name = user.name || ("fb" + profile.id);
        user.psw = user.psw || ("fb" + profile.id);
        user.email = user.email || profile.email;
        user.facebook = profile.id;
        user.picture = 'https://graph.facebook.com/' + profile.id + '/picture?type=large';
        user.displayName = profile.name;
        user.save(function (err, userModel) {
            if (err) {
                return resError(err.message);
            }
            callback(userModel._doc); // doc ?? user
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

module.exports = router;
