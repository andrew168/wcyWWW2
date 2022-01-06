2022.1.5： 
后台可以使用了, Node 是14.18.2
方法见：“QuickStart.txt"

30 Oct: 要保持Node 4.8.5， 
* 升级到node 8.2.1不成功，
*** cannot find module 'internal/fs'
*** 即使按照下面的流程： 
 升级node之后， 所有的npm模块都需要重新安装
 先删除所有npm模块，
 在清除cache
 npm cache clean --force
 最后再重新安装
 npm install

///////////////////////////

eCard 主要的API：
1） TQ.CommandMgr系列：
CommandMgr.undo， 
CommandMgr.redo， 。。

2） TQ.WCY
WCY.rainStop， 

