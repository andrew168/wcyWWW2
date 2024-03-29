/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 动画轨迹， 只是数据， 没有操作. 操作完全来自 AnimeController
 */
window.TQ = window.TQ || {};

(function() {
  function Channel(value, interpolationStyle) {
    if ((value === undefined) || (value == null)) {
      value = 0;
    }

    if (interpolationStyle === undefined) {
      interpolationStyle = TQ.Channel.LINE_INTERPOLATION;
    }

    this.initialize(value, interpolationStyle);
  }

  Channel.LINE_INTERPOLATION = 1;
  Channel.JUMP_INTERPOLATION = 0;

  var p = Channel.prototype;
  p.t = [];
  p.value = [];
  p.c = [];
  p.initialize = function(value, interpolationStyle) {
    if ((value.value === undefined) || (value.value == null)) {
      var t = (TQ.Config.insertAtT0On ? 0 : TQ.FrameCounter.tGrid());
      this.t = [t]; // 只有一帧, 不能搞出来2
      this.value = [value];
      this.c = [interpolationStyle];
    } else {
      this.t = value.t;
      this.value = value.value;
      this.c = value.c;
      if (value.sags) {
        this.sags = value.sags;
      }
    }

    this.tid1 = 0; // 这是2个临时变量，现在是fixedUp阶段，不需要恢复存盘前的 tid1、2,
    this.tid2 = 0;
  };

  p.record = function(track, t, v, interpolationMethod) {
    assertNotUndefined(TQ.Dictionary.FoundNull, this.tid1);
    assertNotNull(TQ.Dictionary.FoundNull, this.tid1);
    interpolationMethod = (interpolationMethod == null) ? TQ.Channel.LINE_INTERPOLATION : interpolationMethod;
    this.searchInterval(t, this);
    var tid1 = this.tid1;
    var tid2 = this.tid2;

    // 相等的情况, 只修改原来帧的值, 不增加新的帧
    var EPSILON = 0.025;
    var rewrite = false;
    if (this.hasSag()) {
      id = 0;
      rewrite = true;
    } else if (Math.abs(t - this.t[tid1]) < EPSILON) {
      id = tid1;
      rewrite = true;
    } else if (Math.abs(t - this.t[tid2]) < EPSILON) {
      id = tid2;
      rewrite = true;
    }

    if (rewrite) {
      this.value[id] = v;
      this.c[id] = interpolationMethod;
      return v;
    }

    // 以下添加新的帧
    var id = tid2; // 在tid2位置插入: 正好查到区间内 [t1, t, t2]
    if (t >= this.t[tid2]) { // 在末尾插入 [t1, t2, t]
      id = tid2 + 1;
    } else if (t < this.t[tid1]) { // 在前面插入 [t, t1, t2]
      id = tid1;
    }

    // 直接记录, 不优化
    this.t.splice(id, 0, t);
    this.c.splice(id, 0, interpolationMethod);
    this.value.splice(id, 0, v);
    return v;
  };

  p.searchInterval = function(t) {
    assertValid(TQ.Dictionary.INVALID_PARAMETER, this.tid1); // "有效的数组下标"
    // 处理特殊情况, 只有1帧:
    if (this.t.length <= 1) {
      assertTrue(TQ.Dictionary.INVALID_PARAMETER, this.tid1 === 0); // 只有1帧
      this.tid1 = this.tid2 = 0;
      return;
    }

    // 确定下边界: t1, 比 t小
    var tid1 = this.tid1;
    if (t < this.t[tid1]) {
      for (; t <= this.t[tid1]; tid1--) {
        if (tid1 <= 0) {
          tid1 = 0;
          break;
        }
      }
    }
    var tid2 = TQ.MathExt.range(tid1 + 1, 0, (this.t.length - 1));

    // 确定上边界: t2, 比 t大, 同时,容错, 跳过错误的轨迹数据, 在中间的
    if (t > this.t[tid2]) { //  1) 下边界太小了, 不是真正的下边界; 2) 在录制时间段之外;
      for (; t > this.t[tid2]; tid2++) {
        if (this.t[tid1] > this.t[tid2]) {
          // TQ.Log.out("data error, skip t=" + t + " t1=" + this.t[tid1] +" t2 = " + this.t[tid2] +" id1=" +tid1 + " tid2=" +tid2);
        }
        if (tid2 >= (this.t.length - 1)) {
          tid2 = this.t.length - 1;
          break;
        }
      }
    }

    tid1 = TQ.MathExt.range(tid2 - 1, 0, (this.t.length - 1));
    if (this.t[tid1] > this.t[tid2]) { // 容错, 发现错误的轨迹数据, 在末尾
      // TQ.Log.out("data error, skip t=" + t + " t1=" + this.t[tid1] +" t2 = " + this.t[tid2] +" id1=" +tid1 + " tid2=" +tid2);
      tid2 = tid1;
    }
    this.tid1 = tid1;
    this.tid2 = tid2;
  };

  p.trim = function(t1, t2) {
    if (this.hasSag()) {
      return this.trimSags(t1, t2);
    }

    var id1, id2;
    this.searchInterval(t1);
    id1 = this.tid1;
    this.searchInterval(t2);
    id2 = this.tid2;
    if ((id1 > id2) || (id2 === 0)) { // 空的channel，
      return;
    }

    if (t1 < this.t[id1]) { // 左出界
      id1--; // 减1， 确保[0]被cut
    }

    if (this.t[id2] < t2) { // 右出界
      var BIG_NUMBER = 65535;// 因为自动拍摄的数据量很大，
      id2 += BIG_NUMBER; // 大的数字， 确保都cut掉
    }
    // 要保留tid1, 也要保留tid2，中间的n=tid2- tid1 - 1不保存
    if ((id1 + 1) < this.t.length) {
      this.t.splice(id1 + 1, id2 - id1 - 1);
      this.value.splice(id1 + 1, id2 - id1 - 1);
      this.c.splice(id1 + 1, id2 - id1 - 1);
    }

    var tArray = this.t;
    var dt = t2 - t1;
    for (var i = 0; i < tArray.length; i++) {
      if (tArray[i] > t1) {
        tArray[i] -= dt;
      }
    }

    // maintain tid1,tid2
    if (this.t.length <= 1) {
      this.tid1 = this.tid2 = 0;
    }

    if (t1 < 0) {
      t1 = 0;
    }

    this.searchInterval(t1);
  };

  p.trimSags = function(t1, t2) {
    var self = this;
    var hasSag = false;
    var dt = t2 - t1;
    this.sags.forEach(function(sag) {
      if (sag) {
        if (((sag.t1 < t1) && (t1 < sag.t2)) ||
                    ((sag.t1 < t2) && (t2 < sag.t2))) {
          self.removeOneSag(sag.categoryId, sag.typeId);
        } else {
          hasSag = true;
          if (t1 < sag.t1) {
            sag.t1 -= dt;
            sag.t2 -= dt;
          }
        }
      }
    });

    if (!hasSag) {
      delete (this.sags);
    }
  };

  p.erase = function() {
    // 功能单一化， 只是擦除数组中原有的内容，比重新建立新数组要省内存，免回收
    // 只保留t0的数据，如果t0不是当前time， 则可能自动添加当前
    if (this.t) {
      this.t.splice(1);
    }
    if (this.value) {
      this.value.splice(1);
    }

    if (this.c) {
      this.c.splice(1);
    }

    if (this.hasSags) {
      this.sags.splice(1);
    }

    this.tid1 = 0; // 这是2个临时变量，现在是fixedUp阶段，不需要恢复存盘前的 tid1、2,
    this.tid2 = 0;
  };

  p.reset = function() {
    this.t = [this.t[0]]; // 只有一帧, 不能搞出来2
    this.value = [this.value[0]];
    this.c = [1];
    this.tid1 = 0;
    this.tid2 = 0;
  };

  p.removeOneSag = function(categoryId, typeId) {
    if (!this.sags || this.sags.length <= 0) {
      return;
    }

    var n = this.sags.length;
    for (let i = 0; i < n; i++) {
      var item = this.sags[i];
      if (!item) {
        continue;
      }

      if ((item.categoryId === categoryId) && (item.typeId === typeId)) {
        this.sags[i] = null;
        return this.sags[i];
      }
    }
  };

  p.calculateLastFrame = function() {
    var tMax = 0;
    var tInMax = 0;
    var tIdleMax = 0;
    var tOutMax = 0;
    if (this.sags) {
      this.sags.forEach(function(sag) {
        if (sag) {
          switch (sag.categoryId) {
            case TQ.AnimationManager.SagCategory.IN:
              tInMax = Math.max(tInMax, sag.t2);
              break;
            case TQ.AnimationManager.SagCategory.IDLE:
              if (!isNaN(sag.t2)) {
                tIdleMax = Math.max(tIdleMax, sag.t2);
              }
              break;
            case TQ.AnimationManager.SagCategory.OUT:
              if (!isNaN(sag.t2)) {
                tOutMax = Math.max(tOutMax, sag.t2);
              }
              break;
            default :
              break;
          }
        }
      });

      tMax = Math.max(Math.max(tInMax, tIdleMax), tOutMax);
      return tMax;
    }

    if (!this.t) {
      return tMax;
    }
    var num = this.t.length;
    tMax = this.t[0];
    if (num > 1) { // 数据合理性检查
      for (var i = 1; i < num; i++) {
        tMax = Math.max(tMax, this.t[i]);
      }
    }

    tMax = this.t[num - 1];
    return tMax;
  };

  p.adjustIdleSagT1 = function(newT1) {
    if (!this.sags || this.sags.length <= 0) {
      return;
    }

    var idleSag = this.sags[TQ.AnimationManager.SagCategory.IDLE];
    if (idleSag) {
      var dt = newT1 - idleSag.t1;
      idleSag.t1 = newT1;
      idleSag.t2 += dt;
    }
  };

  p.getSags = function() {
    if (!this.sags) {
      return null;
    }

    var sags = [];
    for (const item in TQ.AnimationManager.SagCategory) {
      var sagType = TQ.AnimationManager.SagCategory[item];
      const sag = this.sags[sagType];
      if (sag) {
        sags[sagType] = sag;
      }
    }

    if (sags.length > 0) {
      return sags;
    }
    return null;
  };

  p.hasSag = function() {
    return (this.sags && this.sags.length > 0);
  };

  Channel.upgradeTo3_8 = function(channel) {
    if (channel && channel.sags) {
      for (const sagType in channel.sags) {
        var oneSag = channel.sags[sagType];
        if (oneSag) {
          if (oneSag.categoryID !== undefined) {
            oneSag.categoryId = oneSag.categoryID;
            delete oneSag.categoryID;
          }
          if (oneSag.typeID !== undefined) {
            oneSag.typeId = oneSag.typeID;
            delete oneSag.typeID;
          }
        }
      }
    }
  };
  TQ.OneChannel = Channel;
  TQ.Channel = Channel;
})();
