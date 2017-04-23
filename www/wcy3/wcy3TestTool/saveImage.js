/**
 * Created by Andrewz on 1/1/2017.
 */
var TQ = TQ || {};
TQ.Tool = TQ.Tool || {};
(function () {
    var timestamp = new Date().getTime(),
        TEMP_IMG_NODE_ID = "_tq_temp_img" + timestamp,
        TEMP_LINK_NODE_ID = "_tq_temp_link" + timestamp;

    TQ.Tool.saveImage = saveImage;
    TQ.Tool.resetDom = resetDom;

    function resetDom() {
        var ele;
        if (ele = document.getElementById(TEMP_IMG_NODE_ID)) {
            ele.remove();
        }
        if (ele = document.getElementById(TEMP_LINK_NODE_ID)) {
            ele.remove();
        }
    }

    function saveImage(filename) {
        var canvas = stage;
        var backgroundColor = TQ.Graphics.getCanvas().style.backgroundColor;
        var image = canvas.toDataURL(backgroundColor, "image/png");
         // 默认生成透明图, 带alpha信息, PNG格式的
        _saveAs(image, filename);
        // _saveWithLocation(image);
    }

    function _saveAs(image64png, filename) {
        // create a new image and add to the document
        var imgNode = document.getElementById(TEMP_IMG_NODE_ID);
        if (!!imgNode) { // 防止未清除的
            resetDom();
        }

        imgNode = document.createElement("img");
        imgNode.src = image64png;
        imgNode.id = TEMP_IMG_NODE_ID;
        document.body.appendChild(imgNode);

        var link = document.getElementById(TEMP_LINK_NODE_ID);
        if (!link) {
            link = document.createElement("a");
        }

        link.download = filename;
        link.href = image64png;
        link.click();
        setTimeout(resetDom, 1000);
    }
}());
