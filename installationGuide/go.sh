#!/bin/sh
#
# 部署工具（2019版）
# 安装新版本的前端和后端，
# 只重新启动WWW服务器，
# 不重新启动数据库服务器
#
# 前台： 解压所有的zip文件（可能不存在）,
# 放到： wwwz/card2/www目录下
#
mkdir /data
mkdir /data/wwwz
mkdir /data/wwwz/card2
mkdir /data/wwwz/card2/www
cd /data/wwwz/card2/www
mv /home/andrewzhi/releaseAll1.0.0.zip .
unzip -o releaseAll1.0.0.zip
rm releaseAll1.0.0.zip

mv /home/andrewzhi/wwwArts.zip .
unzip -o wwwArts.zip
rm wwwArts.zip

mv /home/andrewzhi/www.zip .
unzip -o www.zip
rm www.zip

#
# 前台：搬移 index和lib
#

#
# 后台：
#
cd /data/wwwz/card2/backoffice
mv /home/andrewzhi/backOffice.zip .
unzip -o backOffice.zip
rm backOffice.zip

#
# 以上是 udoido主项目， 以下是派生项目：
#

cd /data/wwwz/card2/wwwKs
mv /home/andrewzhi/wwwKs.zip .
unzip -o wwwKs.zip
rm wwwKs.zip

#
# 重新启动系统（不重启硬件）
#
killall node
cd /data/wwwz/card2
nohup node backOffice/bin/server.js

