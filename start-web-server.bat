echo off 
echo " 启动简单web服务器"

http-server %~dp0\test -p 80 -o index.html -C E:/data/wwwz/show_udoido_cn.crt -K E:/data/wwwz/udoido.cn-myserver.key"


echo on
pause
