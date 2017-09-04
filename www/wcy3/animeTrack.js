/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 * 动画轨迹， 只是数据， 没有操作. 操作完全来自 AnimeController
 */
TQ = TQ || {};

(function () {
    function AnimeTrack (desc) {
        this.initialize(desc);
    }
    var FALSE_NUM_0 = 0, // false
        TRUE_NUM_1 = 1;
    var p = AnimeTrack.prototype;
    p.erase = function(track) {
        if (this.x) this.x.erase();
        if (this.y) this.y.erase();
        if (this.rotation) this.rotation.erase();
        if (this.sx) this.sx.erase();
        if (this.sy) this.sy.erase();
        if (this.visible) this.visible.erase();
    };

    p.initialize = function(desc)
    {
        assertNotNull(TQ.Dictionary.FoundNull, desc); // 应该在element已经验证了, 补全了
        assertNotNull(TQ.Dictionary.FoundNull, desc.x);
        assertNotNull(TQ.Dictionary.FoundNull, desc.y);
        assertNotNull(TQ.Dictionary.FoundNull, desc.rotation);
        assertNotNull(TQ.Dictionary.FoundNull, desc.sx);
        assertNotNull(TQ.Dictionary.FoundNull, desc.sy);
        assertNotNull(TQ.Dictionary.FoundNull, desc.alpha);
        assertNotNull(TQ.Dictionary.FoundNull, desc.color);
        if (!desc.animeTrack) {
            desc.animeTrack = {};
        }

        this.hasSag = !!desc.animeTrack.hasSag;

        if (!desc.animeTrack.x) {
            this.x = new TQ.OneChannel(desc.x);
        } else {
            this.x = new TQ.OneChannel(desc.animeTrack.x);
        }

        if (!desc.animeTrack.y) {
            this.y = new TQ.OneChannel(desc.y);
        } else {
            this.y = new TQ.OneChannel(desc.animeTrack.y);
        }

        if (!desc.animeTrack.rotation) {
            this.rotation = new TQ.OneChannel(desc.rotation);
        } else {
            this.rotation = new TQ.OneChannel(desc.animeTrack.rotation);
        }

        if (!desc.animeTrack.sx) {
            this.sx = new TQ.OneChannel(desc.sx);
        } else {
            this.sx = new TQ.OneChannel(desc.animeTrack.sx);
        }

        if (!desc.animeTrack.sy) {
            this.sy = new TQ.OneChannel(desc.sy);
        } else {
            this.sy = new TQ.OneChannel(desc.animeTrack.sy);
        }

        if (!desc.animeTrack.alpha) {
            this.alpha = new TQ.OneChannel(desc.alpha);
        } else {
            this.alpha = new TQ.OneChannel(desc.animeTrack.alpha);
        }

        if (!desc.animeTrack.colorR) {
            this.colorR = new TQ.OneChannel(TQ.Utility.getColorR(desc.color));
            this.colorG = new TQ.OneChannel(TQ.Utility.getColorG(desc.color));
            this.colorB = new TQ.OneChannel(TQ.Utility.getColorB(desc.color));
        } else {
            this.colorR = new TQ.OneChannel(desc.animeTrack.colorR);
            this.colorG = new TQ.OneChannel(desc.animeTrack.colorG);
            this.colorB = new TQ.OneChannel(desc.animeTrack.colorB);
        }

        if (!desc.animeTrack.visible) { // 即时添加的元素
            this.visible = new TQ.OneChannel(desc.isVis ? TRUE_NUM_1 : FALSE_NUM_0, TQ.TrackDecoder.JUMP_INTERPOLATION);
            if (!TQ.FrameCounter.isAtBeginning()) {
                TQ.TrackRecorder.recordOneChannel(this, this.visible, 0.0, FALSE_NUM_0, TQ.TrackDecoder.JUMP_INTERPOLATION);
            }
        } else { // 从文件中读入的元素
            this.visible = new TQ.OneChannel(desc.animeTrack.visible);
        }

        // action, 如果有，则建立它； 如果没有， 不补充；
        if ((desc.animeTrack) && (desc.animeTrack.action)) {
            this.action = new TQ.OneChannel(desc.animeTrack.action);
        }
    };

    p.getInSagName = function() {
        if (!this.hasSag) {
            return null;
        }

        return TQ.TrackDecoder.getInSagType(this.x) ||
            TQ.TrackDecoder.getInSagType(this.y) ||
            TQ.TrackDecoder.getInSagType(this.sx) ||
            TQ.TrackDecoder.getInSagType(this.sy) ||
            TQ.TrackDecoder.getInSagType(this.rotation) ||
            TQ.TrackDecoder.getInSagType(this.visible) ||
            TQ.TrackDecoder.getInSagType(this.alpha) ||
            TQ.TrackDecoder.getInSagType(this.colorR) ||
            TQ.TrackDecoder.getInSagType(this.colorG) ||
            TQ.TrackDecoder.getInSagType(this.colorB);
    };

    p.getInSag = function () {
        var inSag = null;
        this.forEachChannel(function (channel) {
            if (!inSag) {
                inSag = channel.getInSag();
            }
        });

        return inSag;
    };

    AnimeTrack.validate = function(tracks) {
        AnimeTrack._validateOne(tracks.x);
        AnimeTrack._validateOne(tracks.y);
        AnimeTrack._validateOne(tracks.rotation);
        AnimeTrack._validateOne(tracks.sx);
        AnimeTrack._validateOne(tracks.sy);
        AnimeTrack._validateOne(tracks.visible);
        AnimeTrack._validateOne(tracks.alpha);
        AnimeTrack._validateOne(tracks.colorR);
        AnimeTrack._validateOne(tracks.colorG);
        AnimeTrack._validateOne(tracks.colorB);
    };

    p.forEachChannel = function(callback) {
        var prop,
            channel,
            self = this;

        for (prop in self) {
            channel = self[prop];
            if (channel instanceof TQ.OneChannel) {
                callback(channel);
            }
        }
    };

    AnimeTrack._validateOne = function(channel) {
        channel.tid1 = (channel.tid1 == undefined) ? 0: channel.tid1;
        channel.tid2 = (channel.tid2 == undefined) ? 0: channel.tid2;
    };

    AnimeTrack.calculateLastFrame = function(track) {
        assertTrue(TQ.Dictionary.INVALID_LOGIC, !!track);
        var tMax = 0;
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.x));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.y));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.sx));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.sy));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.rotation));
        tMax = Math.max(tMax, TQ.TrackDecoder.calculateLastFrame(track.visible));
        return tMax;
    };

    AnimeTrack.hideToNow = function(ele, t) {
        changeVisibility(ele, 0, FALSE_NUM_0, t, TRUE_NUM_1);
    };

    AnimeTrack.hide = function(ele, t) {
        changeVisibility(ele, 0, FALSE_NUM_0, t, FALSE_NUM_0);
    };

    AnimeTrack.unHide = function(ele, t) {
        changeVisibility(ele, 0, FALSE_NUM_0, t, TRUE_NUM_1);
    };

    function changeVisibility(ele, t1, vis1, t2, vis2) {
        var track = ele.animeTrack;
        TQ.TrackRecorder.recordOneChannel(track, track.visible, t1, vis1, TQ.TrackDecoder.JUMP_INTERPOLATION);
        TQ.TrackRecorder.recordOneChannel(track, track.visible, t2, vis2, TQ.TrackDecoder.JUMP_INTERPOLATION);
    }

    AnimeTrack.setButton = function(ele, t) {
        var lifeTime = 3/20; // 3 frame;
        // var currentTime = TQ.FrameCounter.t();
        ele.animeTrack.visible.reset();
        AnimeTrack.hideToNow(ele, t);
        var track = ele.animeTrack;
        TQ.TrackRecorder.recordOneChannel(track, track.visible, t + lifeTime, FALSE_NUM_0, TQ.TrackDecoder.JUMP_INTERPOLATION);
    };

    TQ.AnimeTrack = AnimeTrack;
})();
