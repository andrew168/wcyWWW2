/**
 * Created by Andrewz on 7/12/2016.
 */

var TQ = TQ || {};
TQ.LazyLoading = (function () {
  var tagType = {
      css: 'link',
      js: 'script',
      jpg: 'img',
      png: 'img',
      mp3: 'audio'
    },
    d = document;

  return {
    loadOne: loadOne
  };

  function onError(err) {
    console.error(JSON.stringify(err));
    alert("系统正在升级到新版本，请重新打开!");
  }

  function loadOne(src, onLoaded) {
    var words = src.split('.'),
      ext = words[words.length - 1].toLowerCase(),
      tag = tagType[ext],
      id = src.replace(/\W/g, '_');
    var ele, fjs = d.getElementsByTagName(tag)[0],
      parent = d.body;
    if (d.getElementById(id)) {
      return;
    }
    ele = d.createElement(tag);
    ele.id = id;
    ele.onload = onLoaded;
    ele.onerror = onError;
    switch (tag) {
      case 'link':
        ele.href = src;
        ele.rel = 'stylesheet';
        ele.type = 'text/css';
        d.getElementsByTagName('head')[0].appendChild(ele);
        break;
      case 'script':
        ele.src = src;
        fjs.parentNode.insertBefore(ele, fjs);
        parent.appendChild(ele);
        break;
      case 'img':
        ele.src = src;
        ele.style.visibility = 'hidden';
        parent.appendChild(ele);
        break;
      case 'audio':
        ele.src = src;
        parent.appendChild(ele);
        break;
      default:
    }
  }
})();
