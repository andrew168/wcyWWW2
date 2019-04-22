/**
 * Created by Andrewz on 4/21/2017.
 */

exports.ERROR = {
    NO : 0,
    DISPLAY_NAME_INVALID_OR_TAKEN : 1,
    NAME_IS_TAKEN: 2,
    NAME_IS_INVALID: 3,
    NAME_IS_INVALID_OR_TAKEN: 4,
    PASSWORD_IS_INVALID_OR_INCORRECT : 5,
    DISPLAY_NAME_INVALID: 6,
    PASSWORD_IS_INVALID : 7,
    GENERAL_ERROR: 99
};

exports.HTTP = {
    STATUS_200_OK: 200,
    STATUS_400_BAD_REQUEST: 400,
    STATUS_401_UNAUTHORIZED: 401,
    STATUS_409_CONFLICT: 409,
    STATUS_500_INTERNAL_SERVER_ERROR: 500
};

var AUTH = {
    FACEBOOK: 'facebook',
    TWITTER: 'twitter',
    GOOGLE: 'google',
    WX: 'wx'
};

var AUTH_PREFIX = {};
AUTH_PREFIX[AUTH.FACEBOOK] = 'fb';
AUTH_PREFIX[AUTH.TWITTER] = 'tt';
AUTH_PREFIX[AUTH.GOOGLE] = 'gg';
AUTH_PREFIX[AUTH.WX] = 'wx';

var MAT_TYPE = {
  BKG_IMAGE: 10,
  PROP_IMAGE: 20, // 'propimage',
  PEOPLE_IMAGE: 30, // 'peopleimage',
  SOUND: 40 //,'audio';
};

exports.AUTH = AUTH;
exports.AUTH_PREFIX = AUTH_PREFIX;
exports.SUCCESS = 1;
exports.FAILED = 0;
exports.MAT_TYPE = MAT_TYPE;
exports.DEFAULT_WX_GUEST_NAME = '微信用户';
