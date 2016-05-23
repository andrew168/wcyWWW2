#!/bin/bash

rm -f /var/lock/subsys/node-server

# run it only when no process is running
echo for mongod.....
not_found=0
pgrep mongod || not_found=1

if [ ${not_found} = 1 ] ; then
    echo -n "not found db"
    echo "pure string"
    nohup mongod &
else
    echo find db
fi



