/*
 * 对 谷歌 assert的扩充， 适合于 jsTestDriver
 * 可以比较任意的对象，数组对象， 等等
 * */
// extending ChaiAssert
var TQ = TQ || {};
(function() {
  function AssertExt() {
  }

  AssertExt.depreciated = depreciated;
  AssertExt.invalidLogic = invalidLogic;
  AssertExt.isNotNull = isNotNull;
  AssertExt.isTrue = isTrue;
  AssertExt.expectObject = expectObject;

  function depreciated(name) {
    if (TQ.Config.depreciateCheckOn) {
      TQ.Assert.isTrue(false, "depreciated: " + name);
    }
  }

  function invalidLogic(exp, str) {
    TQ.Assert.isTrue(exp, str + ': ' + TQ.Dictionary.INVALID_LOGIC );
  }

  function isNotNull(exp) {
    TQ.Assert.isNotNull(exp, TQ.Dictionary.INVALID_LOGIC );
  }

  function isTrue(exp, msg) {
    TQ.Assert.isTrue(exp, msg);
  }

  function expectObject(exp) {
    TQ.Assert.isNotNull(exp, TQ.Dictionary.FoundNull);
  }

  TQ.AssertExt = AssertExt;
}());


function assertNotHere(msg) {
  return assertTrue(TQ.Dictionary.INVALID_LOGIC + ", " + msg, false);
}

function assertValid(msg, obj)
{
  assertNotUndefined(TQ.Dictionary.FoundNull + ": " + msg, obj);
  assertNotNull(msg +"null", obj);
}

function assertDepreciated(name)
{
  TQ.AssertExt.depreciated(name);
}

function assertTrue(msg, actual) {
  TQ.Assert.isTrue(actual, msg);
}

function assertFalse(msg, actual) {
  TQ.Assert.isFalse(actual, msg);
}

function assertEquals(msg, expected, actual) {
  TQ.Assert.equal(actual, expected, msg);
}

function assertNotEquals(msg, expected, actual) {
  TQ.Assert.notEqual(actual, expected, msg);
}

function assertNotNull(msg, actual) {
  TQ.Assert.isNotNull(actual, msg);
}

function assertNotUndefined(msg, actual) {
  TQ.Assert.isDefined(actual, msg);
}

function assertEqualsDelta(msg, expected, actual, epsilon) {
  TQ.Assert.closeTo(actual, expected, epsilon, msg);
}

function assertArray(msg, actual) {
  TQ.Assert.isArray(actual, msg);
}

var assert = assertTrue;
