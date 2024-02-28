/**
 * Created by Andrewz on 1/1/2017.
 */
var TQ = TQ || {};
TQ.Tool = TQ.Tool || {};
(function() {
  var timestamp = new Date().getTime();
  var TEMP_IMG_NODE_ID = "_tq_temp_img" + timestamp;
  var TEMP_LINK_NODE_ID = "_tq_temp_link" + timestamp;

  TQ.Tool.saveImage = saveImage;
  TQ.Tool.resetDom = resetDom;

  function resetDom() {
    var ele;
    ele = document.getElementById(TEMP_IMG_NODE_ID);
    if (ele) {
      ele.remove();
    }

    ele = document.getElementById(TEMP_LINK_NODE_ID);
    if (ele) {
      ele.remove();
    }
  }

  function saveImage(filename) {
    var image = TQ.ScreenShot.getDataWithBkgColor();
    _saveAs(image, filename);
    // _saveWithLocation(image);
  }

  function _saveAs(image64png, filename) {
    // create a new image and add to the document
    var imgNode = document.getElementById(TEMP_IMG_NODE_ID);
    if (imgNode) { // 防止未清除的
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
