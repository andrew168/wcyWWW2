/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 *  解释动画轨迹的数据， 计算每一个时刻的姿态数据,
 */
window.TQ = window.TQ || {};

(function (){

  function TrackDecoder()
  {

  }

  /*  animeTrack(Object coordinate) ==> World coordinate
     *  插值t时刻的轨迹，并保存到时间坐标系（jsonObj）之中，供绘制
     *  animeTrack: 保存关节点的运动数据，是在父物体坐标系下， 而且是经过关节点改进的父物体坐标系）。
     *  jsonObj 是世界坐标系下的绝对运动数据，（可以直接送给绘图设备变换系统）
     *
     */
  //ToDo: 是否 参数 JSONObj可以省略？
  TrackDecoder.calculate = function (ele, t) {
    var track = ele.animeTrack,
      tsrObj = TQ.Pose;
    // 计算本物体坐标系下的值
    tsrObj.rotation = ((track.rotation == undefined) || (track.rotation == null)) ?
      TQ.poseDefault.rotation : TrackDecoder.calOneChannel(track, track.rotation, t);

    tsrObj.x = (!track.x) ?
      TQ.poseDefault.x : ensureObjectPos(ele.parent, calOneChannelExt(track, track.x, t), 0).x;
    TQ.Assert.isTrue(!isNaN(tsrObj.x),  "x 为 NaN！！！");

    tsrObj.y = (!track.y) ?
      TQ.poseDefault.y : ensureObjectPos(ele.parent, 0, calOneChannelExt(track, track.y, t)).y;
    TQ.Assert.isTrue(!isNaN(tsrObj.y),  "y 为 NaN！！！");

    tsrObj.sx = (!track.sx) ?
      TQ.poseDefault.sx : TrackDecoder.calOneChannel(track, track.sx, t);

    tsrObj.sy = (!track.sy) ?
      TQ.poseDefault.sy : TrackDecoder.calOneChannel(track, track.sy, t);

    tsrObj.visible = (!track.visible) ?
      TQ.poseDefault.visible : TrackDecoder.calOneChannel(track, track.visible, t);

    tsrObj.alpha = (!track.alpha) ?
      TQ.poseDefault.alpha : TrackDecoder.calOneChannel(track, track.alpha, t);

    var colorR = (!track.colorR) ?
        TQ.Utility.getColorR(TQ.poseDefault.color) : TrackDecoder.calOneChannel(track, track.colorR, t),

      colorG = (!track.colorG) ?
        TQ.Utility.getColorG(TQ.poseDefault.color) : TrackDecoder.calOneChannel(track, track.colorG, t),

      colorB = (!track.colorB) ?
        TQ.Utility.getColorB(TQ.poseDefault.color) : TrackDecoder.calOneChannel(track, track.colorB, t);

    tsrObj.color = TQ.Utility.RGB2Color(Math.round(colorR), Math.round(colorG), Math.round(colorB));

    TQ.Log.tsrDebugInfo("TSR in Object " + ele.jsonObj.type + ele.id, tsrObj);
  };

  TrackDecoder.calOneChannel = function (trackTBD, channel, t) {
    return calOneChannelExt(trackTBD, channel, t).value;
  };

  calOneChannelExt = function (trackTBD, channel, t) {
    // ToDo: 在Sag控制的时间段，用SAG， 否则用普通的
    // * FlyIn: t < te;
    // * FlyOut: ts < t
    var floorSag = findSag(channel, t),
      vSag;

    if (floorSag && floorSag.sag) {
      vSag = calSag(floorSag.sag, channel, t);
      if (floorSag.t1 <= t && t <= floorSag.t) {
        return {value: vSag, isSag: true};
      }
    }

    // ToDo: 没有track， 只有sag， 以sag的末尾状态保持下去
    // 在Sag结束的时候， 更新track， 以保存以sag的末尾状态保持下去
    var floorKfa = calTrack(channel, t);
    if (floorSag && floorSag.sag && (floorKfa.t2 < t ) && (floorKfa.t2 < floorSag.t)) {
      return {value: vSag, isSag: true};
    }
    return {value: floorKfa.value, isSag: false};
  };

  function findSag(channel, t) {
    if (!channel.hasSag()) {
      return null;
    }

    var SagCategory = TQ.AnimationManager.SagCategory,
      n = channel.sags.length,
      i,
      item,
      floorSag = {
        t: -1,
        sag: null
      };
    for (i = 0; i < n; i++) {
      item = channel.sags[i];
      if (!item) {
        continue;
      }
      switch (item.categoryId) {
        case SagCategory.IN:
          if (t < item.t2) {
            floorSag.t1 = 0;
            floorSag.t = item.t2;
            floorSag.sag = item;
            return floorSag;
          } else {
            if (floorSag.t < item.t2) {
              floorSag.t1 = 0;
              floorSag.t = item.t2;
              floorSag.sag = item;
            }
          }
          break;
        case SagCategory.OUT:
          if (item.t1 < t) {
            floorSag.t1 = item.t1;
            floorSag.t = item.t2;
            floorSag.sag = item;
            return floorSag;
          } else {
            if (floorSag.t < item.t2) {
              floorSag.t1 = item.t1;
              floorSag.t = item.t2;
              floorSag.sag = item;
            }
          }
          break;
        default:
          if ((item.t1 <= t) && (t <= item.t2)) { // idle SAG
            floorSag.t1 = item.t1;
            floorSag.t = item.t2;
            floorSag.sag = item;
            return floorSag;
          } else {
            if ((t > item.t2) && (floorSag.t < item.t2)) {
              floorSag.t1 = item.t1;
              floorSag.t = item.t2;
              floorSag.sag = item;
            }
          }
      }
    }
    return floorSag;
  }

  function calSag(sag, channel, t) {
    if (!TQ.FrameCounter.isPlaying()) { //编辑状态下， InSag显示其结果，idle和OutSag都显示其开始
      if (sag.categoryId === TQ.AnimationManager.SagCategory.IN) {
        t = sag.t2;
      } else {
        t = sag.t1;
      }
    }

    if (sag.categoryId === TQ.AnimationManager.SagCategory.IDLE) {
      return calIdleSag(sag, channel, t)
    }

    return calDumpSag(sag, channel, t);
  }

  function calDumpSag(sag, channel, t) {
    // 通用于各个SAG， x,y,z,   scale, rotation, alpha, etc
    var dampingT0 = TQ.SpringEffect.getDampingT0(sag),
      deltaY = 0;
    if (t > dampingT0) { // 对于SAG结束后的状态， 保留SAG最后一刻的值
      if (t < sag.t2) {
        deltaY = TQ.SpringEffect.cal(sag, t - dampingT0);
      }
      t = dampingT0;
    } else if (t < sag.t1) {
      t = sag.t1;
    }
    return sag.value0 + (t - sag.t1) * sag.actualSpeed + deltaY;
  }

  function calVisible(sag, channel, t) {
    if (t > sag.t2) { // 确保在结束的时候， 屏幕上可见
      return 1;
    }

    var T = sag.hideT + sag.showT,
      cycleNumber = Math.floor((t - sag.t1) / T),
      thisCycle = t - sag.t1 - T * cycleNumber;
    if (thisCycle < sag.showT) {
      return 1;
    }
    return 0;
  }

  function calIdleSag(sag, channel, t) {
    if (TQ.FrameCounter.finished()) { // 播放结束之后， 复原
      t = 0;
    }
    if (sag.typeId === TQ.AnimationManager.SagType.TWINKLE) {
      return calVisible(sag, channel, t);
    }
    if (sag.typeId === TQ.AnimationManager.SagType.FLOAT_X) {
      return calFloatX(sag, channel, t);
    }
    if (sag.typeId === TQ.AnimationManager.SagType.ROTATE) {
      return calRotate(sag, channel, t);
    }
    return calDumpSag(sag, channel, t);
  }

  function calFloatX(sag, channel, t) {
    // 公式
    //    fx = (x0 + v*t)
    //    dl = xMax - xMin;
    //    fx2 = fx - Math.floor((fx - xMin) / dl) * dl;
    //

    var fx = sag.value0 + (t - sag.t1) * sag.actualSpeed,
      xMin = sag.extraData.xMin,
      dl = sag.extraData.xMax - xMin;

    return fx - Math.floor((fx - xMin) / dl) * dl;
  }

  function calRotate(sag, channel, t) {
    // 公式
    //    fx = (x0 + v*t)
    //    dl = 360;
    //    fx2 = fx - Math.floor(fx / dl) * dl;
    //

    var fx = sag.value0 + (t - sag.t1) * sag.actualSpeed,
      dl = 360;

    return fx - Math.floor(fx / dl) * dl;
  }

  function calTrack(channel, t)
  {
    var floorKfa = {};
    channel.searchInterval(t);
    if (channel.tid1 == channel.tid2) {
      floorKfa.t1 = floorKfa.t2 = channel.t[channel.tid1];
      floorKfa.value = channel.value[channel.tid1];
      return floorKfa;
    }
    var t1 = channel.t[channel.tid1];
    var t2 = channel.t[channel.tid2];
    var v1 = channel.value[channel.tid1];
    var v2 = channel.value[channel.tid2];
    var v = v1; //不插补， 脉冲替换, 适用于 正向播放， 不是倒放

    floorKfa.t1 = t1;
    floorKfa.t2 = t2;
    if (t1 > t2) {  // 容错, 发现错误的轨迹数据
      TQ.Log.out("Data Error, Skip t=" + t + " t1=" + t1 +" t2 = " + t2 +" id1=" +channel.tid1 + " tid2=" + channel.tid2);
      floorKfa.value = v1;
      return floorKfa;
    }

    if (t <= t1) {  // 下超界
      v = v1;
    } else if (t >= t2) { //  上超界，
      v = v2;
    } else {
      if (channel.c[channel.tid2] == TQ.Channel.LINE_INTERPOLATION) { // 0： interpolation
        v = ((t - t1) * (v1 - v2) / (t1 - t2)) + v1;
      } else {
        v = v1;
      }
    }
    floorKfa.value = v;
    return floorKfa;
  }

  function ensureObjectPos(eleParent, x, y) {
    var needToObject = false;
    if (typeof x === 'object') {
      if (x.isSag) {
        needToObject = true;
      }
      x = x.value;
    }

    if (typeof y === 'object') {
      if (y.isSag) {
        needToObject = true;
      }
      y = y.value;
    }

    var pos = {x: x, y: y};
    if (needToObject && eleParent) {
      pos = eleParent.world2Object(pos);
    }
    return pos;
  }

  TQ.TrackDecoder = TrackDecoder;
}());
