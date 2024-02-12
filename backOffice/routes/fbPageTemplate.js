/**
 * Created by Andrewz on 11/27/17.
 */
var fs = require("fs");
var serverConfig = require("./../bin/serverConfig");

var fbPage = null;
var $PAGE_URL = "http://www.udoido.cn/opus/0_839_9749_1511749528598.html";
var $SAP_URL = "http://www.udoido.com/#/do?sc=0_839_9749_1511749528598.html";
var $IMAGE_URL = "https://res.cloudinary.com/eplan/image/upload/v1511418728/c630.png";
var $PAGE_TITLE = "Animation for you--UDOIDO";
var $PAGE_TITLE_FB = "Animation for daily life and work -- UDOIDO";
var $PAGE_DESC = "animation for daily life and work, UDOIDO: You Do, I Do, together we make it better";
var $PAGE_DESC_FB = "You Do, I Do, together we make it better -- UDOIDO";

var $CONTENT = "animation for daily life and work, UDOIDO: You Do, I Do, together we make it better";
var $IMAGE_WIDTH = "1280";
var $IMAGE_HEIGHT = "848";
function init() {
  // !!! fs 的当前目录是服务器的根,
  // !!!而require的当前目录是本js文件所在的目录
  var templateFile = "/data/wwwz/card2/backoffice/resource/fbPageTemplate.html";
  if (serverConfig.isDevEnv) {
    // templateFile = "./resource/fbPageTemplate.html";
    templateFile = "/data/wwwz/backoffice/resource/fbPageTemplate.html";
  }
  fs.readFile(templateFile, "utf8", onDataReady);
  function onDataReady(err, data) {
    if (err) {
      console.log(err);
    } else {
      fbPage = toTemplate(data);
    }
  }
}

function toTemplate(content) {
  return content;
}

function createPage(pageUrl, shareData) {
  shareData.pageUrl = shareData.pageUrl || $PAGE_URL;
  shareData.title = shareData.title || $PAGE_TITLE;
  shareData.description = shareData.description || $PAGE_DESC;
  return fbPage.replace(new RegExp($PAGE_URL, "g"), shareData.pageUrl)
    .replace(new RegExp($IMAGE_URL, "g"), shareData.imageUrl)
    .replace(new RegExp($PAGE_TITLE, "g"), shareData.title)
    .replace(new RegExp($PAGE_TITLE_FB, "g"), shareData.title)
    .replace(new RegExp($PAGE_DESC, "g"), shareData.description)
    .replace(new RegExp($PAGE_DESC_FB, "g"), shareData.description)
    .replace($SAP_URL, pageUrl + "?play=true");
}

init();
exports.createPage = createPage;
