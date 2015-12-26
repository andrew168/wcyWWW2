/**
 * Created by admin on 11/27/2015.
 */
/*
获取access token 和 jsapi tickets 并且缓存，到 localstation中，
同时， 自动定时刷新此数据。
启动的时候， 先从配置文件中读入此数据，
如果没有， 马上取一个
如果过期， 也马上取
如果有
 */
$appid = "wx9a9eb662dd97612f";
$secret = "7375b13e9c859d48b71a6097790d8358";
$get_token_url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid='.$appid.'&secret='.$secret.'&code='.$code.'&grant_type=authorization_code';

$ch = curl_init();
curl_setopt($ch,CURLOPT_URL,$get_token_url);
curl_setopt($ch,CURLOPT_HEADER,0);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1 );
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
$res = curl_exec($ch);
curl_close($ch);
$json_obj = json_decode($res,true);

//根据openid和access_token查询用户信息
$access_token = $json_obj['access_token'];
$openid = $json_obj['openid'];
$get_user_info_url = 'https://api.weixin.qq.com/sns/userinfo?access_token='.$access_token.'&openid='.$openid.'&lang=zh_CN';

$ch = curl_init();
curl_setopt($ch,CURLOPT_URL,$get_user_info_url);
curl_setopt($ch,CURLOPT_HEADER,0);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1 );
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
$res = curl_exec($ch);
curl_close($ch);

//解析json
$user_obj = json_decode($res,true);
$_SESSION['user'] = $user_obj;
print_r($user_obj);

