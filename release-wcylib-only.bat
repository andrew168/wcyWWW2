chcp 65001
echo off 

echo "确认Node版本是14.18.2"
node --version
rem 生成cat 文件
start gulp

echo "确认cat文件exist，再开始minify, delay 30s"
timeout /T 30 /nobreak
start gulp rel
