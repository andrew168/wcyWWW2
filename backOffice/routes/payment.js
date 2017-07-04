/**
 * Created by Andrewz on 6/27/2017.
 */
var express = require('express'),
    router = express.Router(),
    https = require('https'),
    paypal = require('paypal-rest-sdk');

//Sandbox
var APP_MODEL = 'sandbox';
var CLIENT_ID = 'AcewNLQzLTtbZbd015LAEmYH5Uer1b9tqW0N-VuGgSFymenqQvvu88HK5oG7FU2pCp_qpwsf9ltbVRv_',
    CLIENT_SECRET = 'EHtP2KsWfMqRTxOHochnTweFLZWnsZA5xKjarXuWHDgbYBGc_7-h81Rz1y3UpKDPqd1HzEstxA-5Fjlh';

//Live
//var APP_MODEL = 'live';
//var CLIENT_ID = 'Ac6y3L_mm_JVd622jtIifvxLCleaJl_2hX2SyHk3HlF4E6qTG7Bbq5d0Cv4YOfbbL290eN4hnOSkYnuC',
//    CLIENT_SECRET = 'EF63Xjzsp8ZvjE90mjti-V1UTSGufeHfIId8wkwfMCTUZOxu1KZnVzgqnUBRCarxMQshN0-Vs4zJz6QK';


router.post('/create', createPayment);
router.post('/execute', executePayment);
router.get('/cancel', onCanceled);
router.get('/succeed', onSucceed);

function initPaypal() {
    paypal.configure({
        mode: APP_MODEL, // "sandbox" or "live"
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
    });
}

function createPayment(req, res, next) {
}

function executePayment(req, res, next) {
}

function onCanceled(req, res, next) {
}

function onSucceed(req, res, next) {
}

initPaypal();

module.exports = router;
