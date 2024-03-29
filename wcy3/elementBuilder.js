/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

(function() {
  TQ.Element.upgradeToVer2 = function(desc) {
    desc.version = (!desc.version) ? TQ.Element.VER1 : desc.version;
    if (desc.isPinned === undefined) { desc.isPinned = false; }
  };

  // 工厂, 根据数据制作
  TQ.Element.build = function(level, desc, host) {
    if (!desc) {
      assertTrue(TQ.Dictionary.INVALID_LOGIC, !desc);
      return TQ.ERROR;
    }
    // 此处已经组装好了目录
    TQ.Element.upgradeToVer2(desc);
    var DescType = TQ.ElementType;
    if (!desc.eType) {
      TQ.Log.error("未定义的元素类别eType");
    }
    switch (desc.type) {
      case DescType.ANCHOR_MARKER:
        return new TQ.AnchorMarker(level, desc);
      case DescType.SOUND:
        return new TQ.SoundElement(level, desc);
      case DescType.JOINT_MARKER:
        return new TQ.Marker(level, desc);
      case DescType.BUTTON:
        return new TQ.ButtonElement(level, desc);
      case DescType.CIRCLE:
        return new TQ.Circle(level, desc);
      case DescType.RECTANGLE:
        return new TQ.Rectangle(level, desc);
      case DescType.TEXT:
        return new TQ.TextElement(level, desc);
      case DescType.TEXT_BUBBLE:
        return new TQ.TextBubble(level, desc, host);
      case DescType.BBOX:
        return new TQ.BBox(level, desc, host);
      case DescType.POINT:
        return new TQ.Point(level, desc, host);
      case DescType.RAIN:
      case DescType.SNOW:
      case DescType.FULLSCREEN_EFFECT_PARTICLE:
        return new TQ.ParticleElement(level, desc);
      case DescType.BITMAP:
        break;
      case DescType.GROUP:
      case DescType.GROUP_FILE:
        return new TQ.GroupElement(level, desc);
      case DescType.VIDEO:
        return new TQ.VideoElement(level, desc);
      default :
        console.error("unknown desc.type:" + desc.type);
        break;
    }

    return new TQ.Element(level, desc);
  };

  TQ.Element.isVideo = function(filename) {
    if (!filename) {
      return false;
    }

    var videoExtension = ["mp4", "mov"];
    var ext = "";
    var index = filename.lastIndexOf(".");
    if (index >= 0) {
      ext = filename.substr(index + 1);
      if (videoExtension.indexOf(ext) >= 0) {
        return true;
      }
    }

    return false;
  };
}());
