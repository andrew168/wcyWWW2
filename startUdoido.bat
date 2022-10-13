chcp 65001
echo off 
echo caller' current directory:%CD%
echo batch file's full path: %~f0
echo batch file's full path2: %0
echo batch file's directory: %~dp0
echo 

echo 切换disk，这里有certification
E:
echo 切换bat的工作目录，决定服务器的根目录(特别是文件./resource/fbPageTemplate.html)
cd %~dp0\backOffice

echo 启动数据库服务器
cd %~dp0\backOffice
start %~dp0\backOffice\db-start.bat

echo wait 5-10秒，确保数据库ready
echo linux wait 
sleep 5
echo windows wait
timeout 5

echo 启动web服务器（包括web，api和后台)
node %~dp0\backOffice\bin\server.js

echo on
pause
