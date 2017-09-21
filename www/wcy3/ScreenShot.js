/**
 *  ScreenShot: 复制单个屏幕(Canvas部分), 上传到服务器,
 *  , 或连续复制屏幕, 制作GIF图像,上传到服务器/显示到页面上
 *  可以指定 透明色, 背景色, 复制的范围(默认是整个canvas),
 *  静态函数, 不需要初始化
 **/
window.TQ = window.TQ || {};

(function () {
    var ScreenShot = {};
    var imageData = null,
        imageName = "noname";

    ScreenShot.SaveScreen = function (name, keywords) {
        imageName = name;
        takeImage();
        ScreenShot.upload(keywords);
    };

    function takeImage(bkgColor) {
        if (!bkgColor) {
            imageData = stage.toDataURL("image/png"); // 默认生成透明图, 带alpha信息, PNG格式的
        } else {
            imageData = stage.toDataURL(bkgColor, "image/png"); // 带背景色， 不再是透明的
        }

        return imageData;
    }

    ScreenShot.getData = function() {
        return takeImage();
    };

    ScreenShot.getDataWithBkgColor = function() {
        return takeImage(TQ.Graphics.getCanvasBkgColor());
    };

    ScreenShot.upload = function (_keywords)
    {
        assertNotNull(TQ.Dictionary.FoundNull,  imageData); // 先截取屏幕
        $.ajax({
            type: "POST",
            url: 'Weidongman/src/ScreenShot.php',
            dataType: 'text',
            success:displayInfo3,
            error:displayInfo3,
            data: {
                type:'png',
                userID: localStorage.getItem("userID"),
                imageName: imageName,
                base64data : imageData,
                keywords:_keywords
            }
        });
    };

    // ToDo: 支持GIF,
/*

    var jsf  = ["/Demos/b64.js", "LZWEncoder.js", "NeuQuant.js", "GIFEncoder.js"];
    var head = document.getElementsByTagName("head")[0];

    for (var i=0;i<jsf.length;i++) {
        var newJS = document.createElement('script');
        newJS.type = 'text/javascript';
        newJS.src = 'http://github.com/antimatter15/jsgif/raw/master/' + jsf[i];
        head.appendChild(newJS);
    }

// This post was very helpful!
// http://antimatter15.com/wp/2010/07/javascript-to-animated-gif/

    var w = setTimeout(function() { // give external JS 1 second of time to load

        TQ.Log.debugInfo('Starting');

        var canvas = document.getElementById("mycanvas");
        var context = canvas.getContext('2d');
        var shots  = [];
        var grabLimit = 10;  // Number of screenshots to take
        var grabRate  = 100; // Miliseconds. 500 = half a second
        var count     = 0;

        function showResults() {
            TQ.Log.debugInfo('Finishing');
            encoder.finish();
            var binary_gif = encoder.stream().getData();
            var data_url = 'data:image/gif;base64,'+encode64(binary_gif);
            document.write('<img src="' +data_url + '"/>\n');
        }

        var encoder = new GIFEncoder();
        encoder.setRepeat(0);  //0  -> loop forever, 1+ -> loop n times then stop
        encoder.setDelay(500); //go to next frame every n milliseconds
        encoder.start();

        var grabber = setInterval(function(){
            TQ.Log.debugInfo('Grabbing '+count);
            count++;

            if (count>grabLimit) {
                clearInterval(grabber);
                showResults();
            }

            var imdata = context.getImageData(0,0,canvas.width,canvas.height);
            encoder.addFrame(context);

        }, grabRate);

    }, 1000);

*/

    TQ.ScreenShot = ScreenShot;
}());
