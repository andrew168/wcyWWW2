#!/bin/bash

echo " 必须用root启动， 否则权限不够,页面打不开"
sudo nohup mongod --auth --dbpath /var/lib/mongodb/ --bind_ip=127.0.0.1 --port=57098&

echo linux wait 
sleep 5

echo " 必须用root启动， 否则权限不够,页面打不开"
cd /data/wwwz/card2/backOffice
sudo nohup node  /data/wwwz/card2/backOffice/bin/server.js  &
