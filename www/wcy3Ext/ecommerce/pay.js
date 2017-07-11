/**
 * Created by Andrewz on 6/30/2017.
 */
TQ = TQ || {};

// ToDo: 暂停期间 的时间，要去除， 确保， resume之后 的动作与pause时候的动作是连续播放的，
TQ.Pay = (function () {
    var ENV_MODE = 'sandbox',
        CREATE_URL = 'http://show.udoido.cn/payment/create',
        EXECUTE_URL = 'http://show.udoido.cn/payment/execute/',
        THANKS_YOU_URL = 'http://show.udoido.cn/payment/execute/';

    return {
        showButton: showButton
    };

    function showButton() {
        paypal.Button.render({
            env: ENV_MODE, // 'sandbox' | 'production'
            // Show the buyer a 'Pay Now' button in the checkout flow
            commit: true,
            // payment() is called when the button is clicked
            payment: function () {
                // Make a call to your server to set up the payment
                return paypal.request.post(CREATE_URL)
                    .then(function (res) {
                        return res.paymentID;
                    });
            },

            // onAuthorize() is called when the buyer approves the payment
            onAuthorize: function (data, actions) {
                // Set up the data you need to pass to your server
                var data = {
                    paymentID: data.paymentID,
                    payerID: data.payerID
                };

                // Make a call to your server to execute the payment
                return paypal.request.post(EXECUTE_URL, data)
                    .then(function (res) {
                        window.alert('Payment Complete!');
                    });
            }

        }, '#pay-button-div');
    }
}());