/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */

/**
 * JS编程的基本工具
 */


window.TQ = window.TQ || {};

/**
 * 通用函数：用于定义namespace命名空间
 * @param ns：命名空间字符串， 用句点分割，例如： TQ.Element
 * @return {*}
 */
TQ.namespace = function(ns) {
    var parts = ns.split('.'),
        parent = TQ,
        i;
    if (parts[0] === "TQ") {
        parts = parts.slice(1);
    }

    for (i = 0; i < parts.length; i++) {
        if (typeof parent[parts[i]] === "undefined") {
            parent[parts[i]] = {};
        }
        parent = parent[parts[i]];
    }

    return parent;
};

/**
 * 类定义的实用函数， 用例见： CompositeCommand的定义
 * @type {*}
 */
var inherit = (function() {
    var F = function() {};
    return function(C, P) {
        F.prototype = P.prototype;
        C.prototype = new F();
        C.uber = P.prototype;
        C.prototype.constructor = C;
    }
}());


// 保留6位小数
Math.truncate6 = function(f) {
    return Math.floor(f * 1000000) / 1000000;
};