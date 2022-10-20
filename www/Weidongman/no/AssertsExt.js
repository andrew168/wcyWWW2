/*
 * 对 谷歌 assert的扩充， 适合于 jsTestDriver
 * 可以比较任意的对象，数组对象， 等等
 * */
// 比较任意的对象，
function assertEqualsObject(msg, expected, actual) {
  var v1 = prettyPrintEntity_(expected);
  var v2 = prettyPrintEntity_(actual);
  return assertEquals(msg, v1, v2);
}

function assertNotEqualsObject(msg, expected, actual) {
  var v1 = prettyPrintEntity_(expected);
  var v2 = prettyPrintEntity_(actual);
  return assertNotEquals(msg, v1, v2);
}

function assertEqualsMatrix(msg, expected, actual) {
  var v1 = prettyPrintEntity_(expected.multiply(100));  // 放大100倍，否则精度不够，不相等
  var v2 = prettyPrintEntity_(actual.multiply(100));
  return assertEquals(msg, v1, v2);
}

function assertNotEqualsMatrix(msg, expected, actual) {
  var v1 = prettyPrintEntity_(expected.multiply(100));  // 放大100倍，否则精度不够，不相等
  var v2 = prettyPrintEntity_(actual.multiply(100));
  return assertNotEquals(msg, v1, v2);
}

function assertNotHere(msg) {
  return assertTrue(TQ.Dictionary.INVALID_LOGIC + ", " + msg, false);
}

function assertValid(msg, obj)
{
  assertNotUndefined(TQ.Dictionary.FoundNull + ": " + msg, obj);
  assertNotNull(msg +"null", obj);
}

function assertDepreciated(msg)
{
  assertTrue(msg, false);
}