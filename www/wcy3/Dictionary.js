/**
 * 图强动漫引擎,
 * 专利产品 领先技术
 */
window.TQ = window.TQ || {};

/// 所有中文信息的唯一来源
(function () {
    function Dictionary() {
    }
    Dictionary.LoginPlease = "请先登录！";
    Dictionary.fontFace = "隶书";
    Dictionary.defaultText = "用克隆键C批量添加文字更快捷";
    Dictionary.OK = "确定";
    Dictionary.Return = "返回";
    Dictionary.Cancel = "取消";
    Dictionary.CommaCh = "，";
    Dictionary.Save = "保存";
    Dictionary.Component = "元件";
    Dictionary.MiniAnime = "微动漫";
    Dictionary.PleaseSelectText = "应该先选中字符串";
    Dictionary.PleaseSelectHost = "请先选择主物体";
    Dictionary.PleaseSelectOne = "必须有一个选中点";
    Dictionary.CanntReentry = "不能重复进入";
    Dictionary.TextEditor = "文字编辑";
    Dictionary.SelectColor = "选择字体颜色";
    Dictionary.Selected = "选中";
    Dictionary.isDepreciated = "是否已经废弃?, 只是和保钓兼容???";
    Dictionary.ParentMatrixFromLastIteration = "父矩阵是上一个迭代计算的";
    Dictionary.MustBeBatchMode = "必须是BatchMode";
    Dictionary.CurrentState = "当前状态:";
    Dictionary.CounterValidation = "计数器合法值 > 0";
    Dictionary.FoundNull = "发现Null,或者未定义的对象";
    Dictionary.Load = "调入";
    Dictionary.Frame = "帧";
    Dictionary.ShareTitle = '让生活享受动漫！---- 图强微创意引擎支持';
    Dictionary.ShareSummary = '我的创意，送给你！';
    Dictionary.CanntDelete = '系统保留文件,不能删除！';
    Dictionary.INVALID_FILENAME = "非法的文件名";
    Dictionary.INVALID_LOGIC="非法逻辑";
    Dictionary.INVALID_PARAMETER="非法参数值，数值出界或为空";
    Dictionary.SAME_TYPE_SKIN="只有相同类别的元素能够换皮肤";
    Dictionary.Locked="物体已经锁定,如需操作,请先解锁";

    // 菜单部分
    Dictionary.MenuNewScene = "创建新的微创意";
    Dictionary.MenuSave = "保存微创意, 保存元件";
    Dictionary.MenuUndo = "撤销(Ctrl + Z)";
    Dictionary.MenuRedo = "重做(Ctrl + Y)";
    Dictionary.MenuDelete = "删除当前微创意";
    Dictionary.MenuDeleteElements = "删除选中的元素";
    Dictionary.MenuNewLevel = "插入新场景";
    Dictionary.MenuInsertText = "插入文本";
    Dictionary.MenuSkinning = "换皮肤";
    Dictionary.MenuJoint = "加关节";
    Dictionary.MenuMinJointAngle = "设置关节的最小位置";
    Dictionary.MenuMaxJointAngle = "设置关节的最大位置";
    Dictionary.MenuKeyUnjoint = "去关节";
    Dictionary.MenuSetStageSize = "设置舞台的大小";
    Dictionary.MenuLockIt = "锁定物体,防止误操作";
    Dictionary.MenuUploadImage = "上传图片";
    Dictionary.MenuPreviousLevel = "上一场景";
    Dictionary.MenuNextLevel = "下一场景";
    Dictionary.MenuAnimation = "动作表";
    Dictionary.Menu3Dfy = "打包成3D元素";
    Dictionary.MenuGroup =  "打包成复合大物体";
    Dictionary.MenuKeyUngroup = "拆散复合物体";
    Dictionary.MenuBeginning = "开头";
    Dictionary.MenuEnd = "结尾";
    Dictionary.MenuSubElement = "进入/退出零件编辑模式";
    Dictionary.MenuLinearMode = "进入/退出连续动画模式";
    Dictionary.MenuStop = "停止";
    Dictionary.MenuPlay = "播放动画";
    Dictionary.MenuKeyMove = "平移";
    Dictionary.MenuKeyScale = "缩放";
    Dictionary.MenuKeyRotate = "旋转";
    Dictionary.MenuKeyShift = "上下";

    Dictionary.MenuKeyHideShow = "隐藏/显示";
    Dictionary.MenuKeyRemoveTrack = "消除所选对象的动画";

    Dictionary.NAME_EXIST = "名字已经存在";
    Dictionary.NAME_NOT_EXIST = "名字不存在";


    // 文件保存， 删除， 打开
    Dictionary.IS_SAVING = "正在保存，请勿关闭页面！";
    Dictionary.FAILED = "不成功";
    Dictionary.SaveItPlease = "当前文件已经修改， 要保存吗？";
    Dictionary.Yes = "是";
    Dictionary.No = "不";
    Dictionary.IS_PROCESSING = "正在处理，请稍后......";
    TQ.Dictionary = Dictionary;
}());