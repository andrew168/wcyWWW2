var cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: "eplan",
    api_key: "374258662676811",
    api_secret: "dwwKQ0MPL40ttMSR6SoMH-E1Jrw",
    secure: true
});

cloudinary.v2.api.resources(
    {
        type: 'upload',
        max_results: 30,
        start_at: '2018-02-12',
        prefix: '' // add your folder
    },
    function (error, result) {
        console.log(result, error);
        if (result && result.resources) {
            for (item of result.resources) {
                console.log(item.secure_url);
            }
        }
    });


