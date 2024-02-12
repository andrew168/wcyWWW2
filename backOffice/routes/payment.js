/**
 * Created by Andrewz on 6/27/2017.
 */
var express = require("express");
var router = express.Router();
var https = require("https");
var configSvr = require("./../common/configSvr");
var paypal = require("paypal-rest-sdk");

// Sandbox
var APP_MODEL = "sandbox";
var CLIENT_ID = "AcewNLQzLTtbZbd015LAEmYH5Uer1b9tqW0N-VuGgSFymenqQvvu88HK5oG7FU2pCp_qpwsf9ltbVRv_";
var CLIENT_SECRET = "EHtP2KsWfMqRTxOHochnTweFLZWnsZA5xKjarXuWHDgbYBGc_7-h81Rz1y3UpKDPqd1HzEstxA-5Fjlh";

// Live
// var APP_MODEL = 'live';
// var CLIENT_ID = 'Ac6y3L_mm_JVd622jtIifvxLCleaJl_2hX2SyHk3HlF4E6qTG7Bbq5d0Cv4YOfbbL290eN4hnOSkYnuC',
//    CLIENT_SECRET = 'EF63Xjzsp8ZvjE90mjti-V1UTSGufeHfIId8wkwfMCTUZOxu1KZnVzgqnUBRCarxMQshN0-Vs4zJz6QK';

router.post("/create", createPayment);
router.post("/execute", executePayment);
router.get("/cancel", onCanceled);
router.get("/succeed", onSucceed);

function initPaypal() {
  paypal.configure({
    mode: APP_MODEL, // "sandbox" or "live"
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });
}

function createPayment(req, res, next) {
  var payReq = JSON.stringify({
    intent: "sale",
    payer: {
      payment_method: "paypal"
    },
    redirect_urls: {
      return_url: "http://" + configSvr.host + "/payment/succeed",
      cancel_url: "http://" + configSvr.host + "/payment/cancel"
    },
    transactions: [{
      amount: {
        total: "10",
        currency: "USD"
      },
      description: "This is the payment transaction description."
    }]
  });

  paypal.payment.create(payReq, function(error, payment) {
    var links = {};
    var result = null;

    if (error) {
      console.error(JSON.stringify(error));
      result = "error";
    } else {
      // Capture HATEOAS links
      payment.links.forEach(function(linkObj) {
        links[linkObj.rel] = {
          href: linkObj.href,
          method: linkObj.method
        };
      });

      // If redirect url present, redirect user
      if (links.hasOwnProperty("approval_url")) {
        // REDIRECT USER TO links['approval_url'].href
      } else {
        console.error("no redirect URI present");
      }

      console.log(payment);
      result = { paymentId: payment.id, // 必须的数据
        error: 0, data: payment, links: links }; // extra 数据
    }

    res.json(result);
  });
}

function executePayment(req, res, next) {
  var paymentId = req.query.paymentId || req.body.paymentId;
  var payerId = { payer_id: req.query.payerId || req.body.payerId };
  paypal.payment.execute(paymentId, payerId, function(error, payment) {
    var result;
    if (error) {
      console.error(JSON.stringify(error));
      result = { error: error };
    } else {
      if (payment.state === "approved") {
        console.log("payment completed successfully");
      } else {
        console.log("payment not successful");
      }
      result = { error: 0, data: payment };
    }

    res.json(JSON.stringify(result));
  });
}

function onCanceled(req, res, next) {
  console.log(req);
  console.log(res);
  res.json("canceled!");
}

function onSucceed(req, res, next) {
  console.log(req);
  console.log(res);
  res.json("succeed!");
}

initPaypal();

module.exports = router;
