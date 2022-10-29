chcp 65001
echo off 

echo "确认Node版本是14.18.2"
node --version
rem 生成cat 文件
start gulp

echo "minify： 先delay, 并确认所需要的文件exist，再开始"
timeout /T 1 /nobreak
start gulp rel
