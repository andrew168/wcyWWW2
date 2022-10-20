/**
 * Created by admin on 11/1/2015.
 */
var TQ = TQ || {};
var zh_lang = null;
(function(lib) {
  var $lang = {};
  $lang['title'] = '动漫型课件制作，发布，分享，幼教，学前教育';
  $lang['keywords'] = '动漫型课件制作，发布，分享，幼教，学前教育，动漫学外语，动漫学数学，动漫学汉字，课件制作大赛';
  $lang['description'] = '教师邦汇集了一批优秀的教师，制作课件，分享课件。举办课件制作大赛，奖励优秀作者';
  $lang['home'] = '首页';
  $lang['search'] = '搜索';
  $lang['zuopinfenlei'] = '作品类型';
  $lang['fenxiang'] = '分享';
  $lang['shoucang'] = '收藏';
  $lang['quxiao'] = '取消';
  $lang['queding'] = '确定';
  $lang['footer_banquan'] = '© 2014 图强科技 版权所有';
  /**/
  $lang['xuanfefenlei'] = '选择分类';
  $lang['xuanzeshouchangfenlei'] = '请选择收藏分类';
  $lang['weidenglu'] = '您没有登录，请先登录！';
  $lang['shouchangchenggong'] = '添加收藏成功！';
  $lang['yijingshouchang'] = '您已经收藏过该作品！';
  $lang['yijingfollow'] = '您已经Follow过该作品！';
  $lang['followchenggong'] = 'Follow成功';
  /*引导*/
  $lang['wolaishishi'] = '我来试试';
  $lang['menu_bbs'] = '论坛';
  $lang['menu_jixiaoshanghoutai'] = '经销商后台';
  $lang['menu_chuangjianxinzuopin'] = '创作新作品';
  $lang['menu_gerenzhuye'] = '个人主页';
  $lang['menu_guanlihoutai'] = '管理后台';
  $lang['menu_logout'] = '退出';
  $lang['menu_login'] = '登陆';
  $lang['menu_register'] = '注册';

  $lang['menu_index_1'] = '全部';
  $lang['menu_index_2'] = '人气';
  $lang['menu_index_3'] = '热门';
  $lang['menu_index_4'] = '推荐';
  $lang['menu_user_1'] = '画廊';
  $lang['menu_user_2'] = '比赛';
  $lang['menu_user_3'] = '明星';
  $lang['menu_user_4'] = '教程';
  $lang['menu_user_5'] = '新闻';
  $lang['menu_mx_1'] = '微友推荐';
  $lang['menu_mx_2'] = '精品达人';
  $lang['menu_mx_3'] = '明日之星';
  $lang['menu_bc_1'] = '正在比赛';
  $lang['menu_bc_2'] = '往期比赛';
  $lang['menu_bc_3'] = '我的比赛';

  /*javascript*/
  $lang['chuangjianbiaoqianchenggong'] = '创建标签成功！';
  $lang['yonghumingbunengweikong'] = '用户名不能为空！';
  $lang['yanzhengmacuowu'] = '验证码错误，请重新输入！';
  $lang['zuiduoliugezi'] = '最多六个字哦';
  $lang['biaoqianyicunzai'] = '标签已经存在！';
  $lang['biaoqianbucunzai'] = '标签不存在！';
  /*message*/
  $lang['message_miaohoutiaozhuan'] = '秒后自动跳转，';
  $lang['message_content'] = '不想等待请猛戳此处';
  /* 个人中心 */
  $lang['user_wodezuopin'] = '我的作品';
  $lang['user_tadezuopin'] = 'TA的作品';
  $lang['user_wodeshoucang'] = '我的收藏';
  $lang['user_wodeguanzhu'] = '我的关注';
  $lang['user_sucaiguanli'] = '素材管理';
  $lang['user_siyou'] = '私有';
  $lang['user_quxiao'] = '取消';
  $lang['user_xuanze'] = '选择';
  $lang['user_quanxuan'] = '全选';
  $lang['user_gongkai'] = '公开';
  $lang['user_bianji'] = '编辑';
  $lang['user_shanchu'] = '删除';
  $lang['user_rename'] = '重命名';
  $lang['user_quxiaoshoucang'] = '取消收藏';
  $lang['user_shangchuansucai'] = '上传素材';
  $lang['user_genghuantouxiang'] = '更换头像';
  $lang['user_qianmingbianji'] = '签名编辑';
  $lang['user_youxiaoqi'] = '有效期';
  $lang['user_wodejifeng'] = '我的积分';
  $lang['user_xiugaimima'] = '修改密码';
  $lang['user_chongzhi'] = '我要充值';
  $lang['user_guanzhu'] = '关注';
  $lang['user_yiguanzhu'] = '已关注';
  $lang['user_fensi'] = '粉丝';
  $lang['user_beishoucang'] = '被收藏';
  $lang['user_yuanjian'] = '元件';
  $lang['user_weidongman'] = '微动慢';
  $lang['user_tupian'] = '图片';
  $lang['user_shengyin'] = '声音';
  $lang['user_bangding'] = '点击绑定';
  $lang['user_quxiaobangding'] = '取消绑定';
  $lang['user_edit_info_content'] = '你也说点什么吧 O(∩_∩)O最多50个字哦';
  $lang['user_gengxinmimachenggong'] = '更新密码成功，下次登录请使用新密码！';
  $lang['user_gengxinmimashibai'] = '更新密码失败！';
  $lang['user_feifa'] = '非法参数';
  $lang['user_emailsuccess'] = '发送邮件成功!';
  $lang['user_emailerror'] = '发送邮件失败!';
  $lang['user_verifysuccess'] = '验证成功!';
  $lang['user_verifyerror'] = '验证失败!';
  $lang['user_register_success'] = '验证失败!';
  $lang['user_register_name_error'] = '注册失败！用户名已经存在!';
  $lang['user_register_email_error'] = '注册失败！邮箱已经存在!';
  $lang['user_register_card_error'] = '注册失败！会员卡号或密码错误!';
  $lang['user_register_name_password_error'] = '用户名或密码错误！';
  $lang['user_register_islogin'] = '此用户已经登陆！';
  $lang['user_jifen'] = '积分';
  $lang['user_menu_zuoye'] = '作业管理';
  $lang['user_menu_wodezuoye'] = '我的作业';
  $lang['user_info_works'] = '作品';
  $lang['user_info_fensi'] = '粉丝';
  /*photo_update*/
  $lang['photo_update_xuanzetupian'] = '选择图片';
  $lang['photo_update_kaishishangchuan'] = '开始上传';

  /*user verification*/
  $lang['user_verification_shurushoujihaoma'] = '请输入手机号码';
  $lang['user_verification_jieshouyanzhengma'] = '请输入手机接收到的验证码';
  $lang['user_verification_tijiaoyanzheng'] = '提交验证';
  $lang['user_verification_yanzhengshoujihao'] = '验证手机号码';
  $lang['user_verification_yanzhengemail'] = '验证邮箱';
  $lang['user_verification_youjianyifasong'] = '邮件已发送，请登录邮箱查看';
  /*welcome index*/
  $lang['index_video_img_title_1'] = '场景元素，自由搭配';
  $lang['index_video_img_title_2'] = '拖拖拽拽，随心编辑';
  $lang['index_video_img_title_3'] = '文字，声音一个也不少';
  $lang['index_video_img_title_4'] = '即时发布，即时分享';
  $lang['index_video_img_title_5'] = '操作简单，易于上手';
  $lang['index_video_img_content_1'] = '丰富的场景，元素，完全按照你的想法自由搭配，在动画里，实现你“你环游世界”的梦想。';
  $lang['index_video_img_content_2'] = '无论是表情，还是动作，拖拖拽拽，全都交由你去实现，在动画里充分表达喜怒哀乐吧。';
  $lang['index_video_img_content_3'] = '亲手为你的动画加上台词和配音吧，未来的小导演！';
  $lang['index_video_img_content_4'] = '就在下一秒，让你的创想随着作品分享给更多的伙伴吧！';
  $lang['index_video_img_content_5'] = '一台电脑，一根网线，最简单的动画制作方式等你来一探究竟';
  $lang['index_title_1'] = '更多样的功能满足更多教学需求。';
  $lang['index_title_2'] = '打分，评定，课业批改线上完成。';
  $lang['index_title_3'] = '超过十万的教育工作者互助分享。';
  $lang['index_title_4'] = '与超过一百万的未来“小导演”一同成长。';
  $lang['index_title_5'] = '与家人和小伙伴一同完成动画创想。';
  $lang['index_title_6'] = '分享，比赛，更多乐趣等你发现。';
  $lang['index_title_7'] = '受到了孩子们的热烈欢迎。大家争相来体验自己动手做动画的乐趣';
  /*register*/
  $lang['username'] = '用户名';
  $lang['password'] = '密&nbsp;&nbsp;&nbsp;码';
  $lang['password2'] = '确认密码';
  $lang['email'] = '电子邮箱';
  $lang['huiyuanka'] = '会员卡';
  $lang['huiyuanka_kahao'] = '会员卡卡号';
  $lang['huiyuanka_mima'] = '会员卡密码';
  $lang['you'] = '有';
  $lang['meiyou'] = '没有';
  $lang['zhaohuifangshi'] = '找回方式';
  $lang['yanzhengma'] = '验证码';
  $lang['shuruyanzhengma'] = '请输入验证码';
  $lang['yanzhengmakanbuqin'] = '看不清，换一张';
  $lang['tijiao'] = '提交';
  $lang['queren'] = '确认';
  $lang['guanbi'] = '关闭';
  $lang['fangqi'] = '放弃';
  $lang['baocun'] = '保存';
  /*upload*/
  $lang['upload_type'] = '选择上传类型';
  $lang['upload_img'] = '图片';
  $lang['upload_sound'] = '声音';
  $lang['upload_yuanjian'] = '元件';
  $lang['upload_title_tupian'] = '图片';
  $lang['upload_title_fujian'] = '附件';
  $lang['upload_title_jiage'] = '价格';
  $lang['upload_title_xiazaijiage'] = '下载价格';
  $lang['upload_title_tianjiashijian'] = '添加时间';
  $lang['upload_title_zhuangtai'] = '状态';
  $lang['upload_yuan'] = '元';
  $lang['upload_shangchuan_chenggong'] = '上传成功';
  $lang['upload_shangchuan_shibai'] = '上传失败';
  $lang['upload_dianjixiazai'] = '点击下载';
  $lang['upload_kaishishangchuan'] = '开始上传';
  $lang['upload_dangqianfenlei'] = '当前分类';
  $lang['upload_shuruxinfenlei'] = '输入新分类';
  $lang['upload_select'] = '请选择';
  $lang['upload_xiugaifenlei'] = '修改分类';
  $lang['upload_xiugaimingcheng'] = '修改名称';
  $lang['upload_shuruxinmingcheng'] = '请输入新名称';
  $lang['upload_xiugaichenggong'] = '修改成功！';
  $lang['upload_shuruguanjianci'] = '请输入关键词！<br/>';
  $lang['upload_guanjiancibunengbaohan'] = '关键词中不能包含“微动漫”或“元件”！<br/>';
  $lang['upload_img_xuanze_1'] = '选择图片（图片不能大于：';
  $lang['upload_img_xuanze_2'] = 'M，格式:';
  $lang['upload_fenlei'] = '分类';
  $lang['upload_shurubiaoqian'] = '请输入标签，用逗号分隔';
  $lang['upload_geshi'] = '上传附件(zip,rar格式)';
  $lang['upload_zhuangtai'] = '发布';
  $lang['upload_biaojian'] = '标签';
  $lang['upload_fabu'] = '发布';
  $lang['upload_siyou'] = '私有';
  $lang['upload_meiwancishiyong'] = '每万次使用';
  $lang['upload_meicixiazai'] = '元，每1次下载';
  $lang['upload_tuyuan'] = '图元（100%）';
  $lang['upload_xiugaifenleishibai'] = '修改分类失败';
  $lang['upload_sound_msg_1'] = '选择声音文件（文件不能大于';
  $lang['upload_sound_msg_2'] = 'M，格式';
  $lang['upload_bianquan_title'] = '版权说明';
  $lang['upload_bianquan_content'] = '版权和收入归作者所有，作者授权本网展示、销售，授权本网用户通过本网提供的方法合理使用.';

  $lang['upload_max_count'] = '文件数量最大只能上传';
  $lang['upload_file_type_error'] = '文件类型错误';
  $lang['upload_file_taida_error'] = '文件太大';
  $lang['upload_file_kuandu_error'] = '宽度太大';
  $lang['upload_file_gaodu_error'] = '高度太大';
  $lang['upload_file_unknown_error'] = '未知错误';

  $lang['dianjibiaoqianshoucang'] = '点击下面标签，自动收藏';
  $lang['tianjiaxinbiaoqian'] = '添加新标签';
  $lang['chongzhizhongxin'] = '充值中心';
  $lang['chongzhichenggong'] = '充值成功！';
  $lang['chongzhishibai'] = '充值失败！';
  $lang['card_kahao'] = '卡 号';
  $lang['card_mima'] = '密 码';
  $lang['card_queren'] = '确认充值';
  $lang['jiumimabunengweikong'] = '旧密码不能为空！</br>';
  $lang['xinmimabunengweikong'] = '新密码不能为空！</br>';
  $lang['querenxinmimabunengweikong'] = '确认新密码不能为空！</br>';
  $lang['xiugaichenggong_shiyongxinimima'] = '修改成功，请重新登录，并且请使用新密码！';
  $lang['xiugaishibai'] = '修改失败！</br>';
  $lang['shurujiumima'] = '请输入旧密码';
  $lang['shuruxinmima'] = '请输入新密码';
  $lang['querenxinmima'] = '确认新密码';
  $lang['querenxiugai'] = '确认修改';
  $lang['register'] = '注册账号';
  $lang['new_register'] = '新用户注册';
  $lang['zhaohuimima'] = '找回密码';
  $lang['xuanzeyonghuleibie'] = '请选择用户类别</br>';
  $lang['shuruyonghuming'] = '请输入用户名</br>';
  $lang['shurumima'] = '请输入密码</br>';
  $lang['mimachangdu'] = '密码长度不能小于6个字符！</br>';
  $lang['liangcimimabuyizhi'] = '两次密码不一致</br>';
  $lang['shuruemail'] = '请输入有效的电子邮箱</br>';
  $lang['shuruyouxiaoemail'] = '输入有效的电子邮箱';
  $lang['banben'] = '版&nbsp;&nbsp;&nbsp;本';
  $lang['leixing'] = '类型';
  $lang['xiugaiemailchenggong'] = '修改邮箱成功！';
  $lang['xiugaiemailshibai'] = '修改邮箱失败！';
  $lang['shuruxinemail'] = '输入新邮箱';
  $lang['haokexi'] = '好可惜！';
  $lang['zhanghuguoqi'] = '您的账号已过期，快去充值吧！';
  $lang['woyaogoumai'] = '我要购买';
  $lang['woyoukahao'] = '我有卡号';
  $lang['quchongzhi'] = '去充值';
  $lang['tishixinxi'] = '提示信息';
  $lang['querenshanchu'] = '确认要删除？';
  $lang['tijiaozuoyechenggong'] = '提交作业成功';
  $lang['yijingtijiaozuo'] = '您已经提交该作品作业！';
  $lang['ShouQuanChengGong'] = '授权成功';
  $lang['QuXiaoShouQuanChengGong'] = '取消授权成功！';
  /*show*/
  $lang['show_jifeng_tongzhi_title'] = '积分通知';
  $lang['show_jifeng_tongzhi_content_1_1'] = '游客浏览了您的作品';
  $lang['show_jifeng_tongzhi_content_1_2'] = '奖励';
  $lang['show_jifeng_tongzhi_content_1_3'] = '个积分。';
  $lang['show_jifeng_tongzhi_content_2_1'] = '祝贺你增加了新的团队成员';
  $lang['show_jifeng_tongzhi_content_2_2'] = '奖励';
  $lang['show_jifeng_tongzhi_content_2_3'] = '个积分。';
  $lang['show_jifeng_tongzhi_content_3_1'] = '第一次成功登陆';
  $lang['show_jifeng_tongzhi_content_3_2'] = '奖励';
  $lang['show_jifeng_tongzhi_content_3_3'] = '个积分。';
  $lang['show_jifeng_tongzhi_content_4_1'] = '第一次成功发布作品';
  $lang['show_jifeng_tongzhi_content_4_2'] = '奖励';
  $lang['show_jifeng_tongzhi_content_4_3'] = '个积分。';
  $lang['show_jifeng_tongzhi_content_5_1'] = '第一次成功上传作品';
  $lang['show_jifeng_tongzhi_content_5_2'] = '奖励';
  $lang['show_jifeng_tongzhi_content_5_3'] = '个积分。';

  $lang['show_yisuoding'] = '已锁定';
  $lang['show_weisuoding'] = '未锁定';
  $lang['show_bianji'] = '编辑';
  $lang['show_xiazai'] = '下载';
  $lang['show_shoucang'] = '收藏';
  $lang['show_zan'] = '赞';
  $lang['show_fenxiang'] = '分享';
  $lang['show_fanhuichuangkou'] = '返回窗口';
  $lang['show_kaitou'] = '开头';
  $lang['show_kuaitui'] = '快退';
  $lang['show_tingzhi'] = '停止';
  $lang['show_bofang'] = '播放';
  $lang['show_xunhuan'] = '循环';
  $lang['show_kuaijin'] = '快进';
  $lang['show_jiewei'] = '结尾';
  $lang['show_quanpin'] = '全屏';
  /*browser*/
  $lang['browser_tips'] = '请使用下面的浏览器';
  $lang['page_notfound'] = '当前页面不存在';
  /*favorites*/
  $lang['shezhichenggong'] = '设置成功';
  $lang['shezhishibai'] = '设置失败';
  $lang['quanbubiaoqian'] = '全部标签';
  /*jifen*/
  $lang['jifen_mingxi'] = '积分明细';
  $lang['jifen_title'] = '标题';
  $lang['jifen_content'] = '内容';
  $lang['jifen_sj'] = '时间';
  $lang['jifen_caozuo'] = '操作';
  $lang['jifen_xin'] = '新';
  $lang['jifen_info'] = '详细';
  $lang['jifen_del'] = '删除';
  /**/
  $lang['win_yiduxiacibuzaitanchu'] = '已读，下次不再弹出';
  $lang['news_more'] = '更多>>';
  $lang['news_video_more'] = '视频新闻';
  $lang['news_wenzi_more'] = '文字新闻';
  /* share */
  $lang['share_xuanze'] = '请选择要发送的分享平台！';
  $lang['share_sending'] = '正在发送...';
  $lang['share_send_error'] = '发送失败';
  $lang['share_sina'] = '新浪微博';
  $lang['share_tencent'] = '腾讯微博';
  $lang['share_send_error_msg'] = '发送失败,如果未授权，请点击加粗文字授权后，重新发送';
  $lang['share_content'] = '请输入摘要内容，不要超过140字符';
  $lang['share_fabu'] = '发布';
  $lang['share_weishouquan'] = '未授权';
  $lang['share_shouquanchenggong'] = '授权成功';
  $lang['share_send_mobile'] = '发送到手机';
  $lang['share_send_mobile_haoma'] = '号码';
  $lang['share_send_mobile_mms'] = '彩信';
  $lang['share_summary'] = '让生活享受动漫！---- 图强微创意引擎支持 - 我的创意，送给你！';
  $lang['share_qianru'] = '嵌入';
  /*welcome works*/
  $lang['index_works_zuopinfenlei'] = '作品分类';
  $lang['index_works_xueshengleixing'] = '学生类型';
  /*wcy index*/
  $lang['wcy_index_suoyoufenlei'] = '所有分类';
  $lang['wcy_index_zhen'] = '帧';
  $lang['wcy_index_action'] = '动作';
  $lang['wcy_index_action_name'] = '名称';
  $lang['wcy_index_action_kaishi'] = '开始针';
  $lang['wcy_index_action_zhi'] = '至';
  $lang['wcy_index_action_jieshu'] = '结束针';
  $lang['wcy_index_action_yiyoudongzuo'] = '已有动作';
  $lang['wcy_index_action_genghuantupian'] = '点击更换图片';
  $lang['wcy_index_action_name2'] = '动作名';
  $lang['wcy_index_action_xunhuancishu'] = '循环次数';
  $lang['wcy_index_action_xunhuancishu_wuxian'] = '无限';
  $lang['wcy_index_action_shijianzhou'] = '时间轴';
  $lang['wcy_menu_beijing'] = '场景';
  $lang['wcy_menu_linjian'] = '零件';
  $lang['wcy_menu_zhuti'] = '主题';
  $lang['wcy_menu_daoju'] = '道具';
  $lang['wcy_menu_renwu'] = '人物';
  $lang['wcy_menu_charuwenben'] = '插入文本';
  $lang['wcy_menu_hudonganniu'] = '互动按钮';
  $lang['wcy_menu_mohuananniu'] = '魔幻按钮';
  $lang['wcy_menu_sounds'] = '声音';
  $lang['wcy_menu_my'] = '我的素材';
  $lang['wcy_gongneng_button_1'] = '进入/退出零件编辑模式';
  $lang['wcy_gongneng_button_2'] = '进入/退出连续动画模式';
  $lang['wcy_gongneng_button_3'] = '消除所选对象的动画';
  $lang['wcy_gongneng_button_4'] = '删除';
  $lang['wcy_gongneng_button_5'] = '录音';
  $lang['wcy_gongneng_button_6'] = '播放';
  $lang['wcy_gongneng_button_7'] = '编辑';
  $lang['wcy_gongneng_button_8'] = '开头';
  $lang['wcy_gongneng_button_9'] = '快退';
  $lang['wcy_gongneng_button_10'] = '停止';
  $lang['wcy_gongneng_button_11'] = '循环';
  $lang['wcy_gongneng_button_12'] = '快进';
  $lang['wcy_gongneng_button_13'] = '结尾';
  $lang['wcy_gongneng_button_14'] = '新建';
  $lang['wcy_gongneng_button_15'] = '保存草稿';
  $lang['wcy_gongneng_button_16'] = '保存并发布';
  $lang['wcy_gongneng_button_17'] = '隐藏/显示';
  $lang['wcy_gongneng_button_18'] = '锁定物体,防止误操作';
  $lang['wcy_gongneng_button_19'] = '最顶层';
  $lang['wcy_gongneng_button_20'] = '上一层';
  $lang['wcy_gongneng_button_21'] = '下一层';
  $lang['wcy_gongneng_button_22'] = '最底层';
  $lang['wcy_gongneng_button_23'] = '镜像X';
  $lang['wcy_gongneng_button_24'] = '镜像Y';
  $lang['wcy_gongneng_button_25'] = '打包成3D元素';
  $lang['wcy_gongneng_button_26'] = '打包成复合大物体';
  $lang['wcy_gongneng_button_27'] = '拆散复合物体';
  $lang['wcy_gongneng_button_28'] = '加关节';
  $lang['wcy_gongneng_button_29'] = '设置关节的最小位置';
  $lang['wcy_gongneng_button_30'] = '设置关节的最大位置';
  $lang['wcy_gongneng_button_31'] = '去关节';
  $lang['wcy_gongneng_button_32'] = '换皮肤';
  $lang['wcy_gongneng_button_33'] = '画笔';
  $lang['wcy_gongneng_button_34'] = '保留轨迹';
  $lang['wcy_gongneng_button_35'] = '允许多选';
  $lang['wcy_gongneng_button_36'] = '添加动作';
  $lang['wcy_gongneng_button_37'] = '动作';
  $lang['wcy_gongneng_button_38'] = '互动按钮事件';
  $lang['wcy_changjing_1'] = '场景';
  $lang['wcy_changjing_add'] = '添加新的场景';
  $lang['wcy_sound'] = '声音';
  $lang['wcy_mohuan_daxiao'] = '大小';
  $lang['wcy_mohuan_midu'] = '密度';
  $lang['wcy_mohuan_fangxiang'] = '方向';
  $lang['wcy_mohuan_kaishi'] = '开始';
  $lang['wcy_mohuan_tingzhi'] = '停止';
  $lang['wcy_deferloadhtml_save_1'] = '保存为';
  $lang['wcy_deferloadhtml_save_2'] = '选择类型';
  $lang['wcy_deferloadhtml_save_3'] = '微动漫';
  $lang['wcy_deferloadhtml_save_4'] = '元件';
  $lang['wcy_deferloadhtml_save_5'] = '标&nbsp;&nbsp;&nbsp;题';
  $lang['wcy_deferloadhtml_save_6'] = '分&nbsp;&nbsp;&nbsp;类';
  $lang['wcy_deferloadhtml_texteditor_1'] = '红色';
  $lang['wcy_deferloadhtml_texteditor_2'] = '绿色';
  $lang['wcy_deferloadhtml_texteditor_3'] = '蓝色';
  $lang['wcy_deferloadhtml_texteditor_4'] = '黑色';
  $lang['wcy_deferloadhtml_action_1'] = '动作名称';
  $lang['wcy_deferloadhtml_action_2'] = '起始帧ID';
  $lang['wcy_deferloadhtml_action_3'] = '结束帧ID';
  $lang['wcy_deferloadhtml_action_4'] = '循环方式';
  $lang['wcy_deferloadhtml_action_5'] = '操作';
  $lang['wcy_deferloadhtml_action_6'] = '添加动作';
  /*mail*/
  $lang['mail_forgot_password_title'] = 'udoido.cn 忘记密码 <NO REPLY>';
  $lang['mail_forgot_password_content_1'] = '亲爱的';
  $lang['mail_forgot_password_content_2'] = '</br>我们刚刚收到了您udoido.cn!账户的密码恢复请求。要重新设定您的密码，请使用该链接，此链接只有一次有效：</br>';
  $lang['mail_forgot_password_content_3'] = '谢谢</br>';

  $lang['mail_verification_title'] = 'udoido.cn 验证邮箱 <NO REPLY>';
  $lang['mail_verification_content_1'] = '亲爱的';
  $lang['mail_verification_content_2'] = '</br>请使用该链接验证邮箱，此链接只有一次有效：</br>';
  $lang['mail_verification_content_3'] = '谢谢，</br>';

  /*wcy*/
  $lang['LoginPlease'] = '请先登录！';
  $lang['fontFace'] = '隶书';
  $lang['defaultText'] = '用克隆键C批量添加文字更快捷';
  $lang['OK'] = '确定';
  $lang['Return'] = '返回';
  $lang['Cancel'] = '取消';
  $lang['CommaCh'] = '，';
  $lang['Save'] = '保存';
  $lang['Component'] = '元件';
  $lang['MiniAnime'] = '微动漫';
  $lang['PleaseSelectText'] = '应该先选中字符串';
  $lang['PleaseSelectHost'] = '请先选择主物体';
  $lang['PleaseSelectOne'] = '必须有一个选中点';
  $lang['CanntReentry'] = '不能重复进入';
  $lang['TextEditor'] = '文字编辑';
  $lang['SelectColor'] = '选择字体颜色';
  $lang['Selected'] = '选中';
  $lang['isDepreciated'] = '是否已经废弃?, 只是和保钓兼容???';
  $lang['ParentMatrixFromLastIteration'] = '父矩阵是上一个迭代计算的';
  $lang['MustBeBatchMode'] = '必须是BatchMode';
  $lang['CurrentState'] = '当前状态:';
  $lang['CounterValidation'] = '计数器合法值 > 0';
  $lang['FoundNull'] = '发现Null,或者未定义的对象';
  $lang['Load'] = '调入';
  $lang['Frame'] = '帧';
  $lang['ShareTitle'] = '让生活享受动漫！---- 图强微创意引擎支持';
  $lang['ShareSummary'] = '我的创意，送给你！';
  $lang['CanntDelete'] = '系统保留文件,不能删除！';
  $lang['INVALID_FILENAME'] = '非法的文件名';
  $lang['INVALID_LOGIC'] = '非法逻辑';
  $lang['INVALID_PARAMETER'] = '非法参数值，数值出界或为空';
  $lang['Locked'] = '物体已经锁定,如需操作,请先解锁';
  // 菜单部分
  $lang['MenuNewScene'] = '创建新的微创意';
  $lang['MenuSave'] = '保存微创意, 保存元件';
  $lang['MenuUndo'] = '撤销(Ctrl + Z)';
  $lang['MenuRedo'] = '重做(Ctrl + Y)';
  $lang['MenuDelete'] = '删除当前微创意';
  $lang['MenuNewLevel'] = '插入新场景';
  $lang['MenuInsertText'] = '插入文本';
  $lang['MenuSkinning'] = '换皮肤';
  $lang['MenuJoint'] = '加关节';
  $lang['MenuLockIt'] = '锁定物体,防止误操作';
  $lang['MenuUploadImage'] = '上传图片';
  $lang['MenuPreviousLevel'] = '上一场景';
  $lang['MenuNextLevel'] = '下一场景';
  $lang['MenuAnimation'] = '动作表';
  $lang['MenuGroup'] = '打包成复合大物体';
  $lang['MenuBeginning'] = '开头';
  $lang['MenuEnd'] = '结尾';
  $lang['MenuSubElement'] = '进入/退出零件编辑模式';
  $lang['MenuLinearMode'] = '进入/退出连续动画模式';
  $lang['MenuStop'] = '停止';
  $lang['MenuPlay'] = '播放动画';
  $lang['MenuPlayRecord'] = '播放';
  $lang['MenuStopRecord'] = '播放';
  $lang['Menubackward'] = '快退';
  $lang['Menuforward'] = '快进';
  $lang['Menurewind'] = '自动循环';
  $lang['MenuKeepTrace'] = '保留轨迹';
  $lang['MenuTbVkeyCtrl'] = '保留轨迹';
  $lang['MenuActionAddBtn'] = '添加动作';
  $lang['MenuActionBtn'] = '动作按钮';
  $lang['MenuHudongAddBtn'] = '互动按钮事件';
  $lang['NAME_EXIST'] = '名字已经存在';
  $lang['NAME_NOT_EXIST'] = '名字不存在';
  // 文件保存， 删除， 打开
  $lang['IS_SAVING'] = '正在保存，请勿关闭页面！';
  $lang['FAILED'] = '不成功';
  $lang['SaveItPlease'] = '当前文件已经修改， 要保存吗？';
  $lang['Yes'] = '是';
  $lang['No'] = '不';
  $lang['IS_PROCESSING'] = '正在处理，请稍后......';
  $lang['Win_xuanzhongsucai'] = '请先选中一个素材！';
  $lang['Win_yuansuweidingyidongzuo'] = '此素材没有已定义的动作!';
  $lang['Label_allcategory'] = '所有分类';
  $lang['Label_selectText'] = '请选择';
  $lang['MC_Label_1'] = '图片格式错误，请上传gif图片！';
  $lang['MC_Label_2'] = '名称不能为空！';
  $lang['Scenes_Label_1'] = '场景';
  $lang['save_win_1'] = '名称已经存在，确认替换？';
  $lang['save_win_2'] = '请选择保存的类型！';
  $lang['save_win_3'] = '请输入名称！';
  $lang['save_win_4'] = '请选择完整的分类!';
  $lang['category_putong_button'] = '普通按钮';
  $lang['category_gongneng_button'] = '功能按钮';
  $lang['luyinqianzhui'] = '录音';
  $lang['zhengzaibaocunluyin'] = '正在保存声音，请稍候……';
  $lang['shenheweitongguo'] = '审核未通过';
  $lang['shenhetongguo'] = '审核通过';
  $lang['weishenhe'] = '未审核';
  $lang['label_guanli'] = '标签管理';
  $lang['label_tuichuguanli'] = '退出管理';
  $lang['user_jxszhuqnqu'] = '经销商专区';
  $lang['user_jxszhuqnqu_1'] = '发展客户';
  $lang['user_jxszhuqnqu_2'] = '客户列表';
  $lang['user_jxszhuqnqu_3'] = '我的账户';
  $lang['user_jxszhuqnqu_4'] = '我的级别';
  $lang['user_jxszhuqnqu_5'] = '积分记录';
  $lang['user_jxszhuqnqu_6'] = '时间';
  $lang['user_jxszhuqnqu_7'] = '用户名';
  $lang['user_jxszhuqnqu_8'] = '首页';
  $lang['user_jxszhuqnqu_9'] = '上一页';
  $lang['user_jxszhuqnqu_10'] = '下一页';
  $lang['user_jxszhuqnqu_11'] = '末页';
  $lang['user_jxszhuqnqu_12'] = '开始时间';
  $lang['user_jxszhuqnqu_13'] = '结束时间';
  $lang['user_jxszhuqnqu_14'] = '类型';
  $lang['user_jxszhuqnqu_15'] = '查询';
  $lang['user_jxszhuqnqu_16'] = '积分';
  $lang['user_jxszhuqnqu_17'] = '销售代表';
  $lang['user_jxszhuqnqu_18'] = '全部类型';
  $lang['user_jifen_leixing_1'] = '播放界面';
  $lang['user_jifen_leixing_2'] = '用户注册';
  $lang['user_jifen_leixing_3'] = '发布第一篇作品';
  $lang['user_jifen_leixing_4'] = '第一次登陆';
  $lang['user_jifen_leixing_5'] = '第一次上传资源';

  zh_lang = $lang;
}());
TQ.Lang = zh_lang;
