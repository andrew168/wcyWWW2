#!/bin/bash

rm -f /var/lock/subsys/node-server

echo "#### for mongod ####"
not_found=0
pgrep mongod || not_found=1

if [ ${not_found} = 1 ] ; then
    echo "not found mongod"
    killall node
    nohup mongod &
else
    echo "find mongod"
fi

echo "#### for node ####"
not_found=0
ps -aefw | grep "/data/wwwz/card2/backoffice/bin/server.js" | grep -v " grep "|| not_found=1

if [ ${not_found} = 1 ] ; then
    echo "not found node"
    nohup node  /data/wwwz/card2/backoffice/bin/server.js  &
else
    echo "find node"
fi
