
#!/bin/bash

rm -f /var/lock/subsys/node-server

# run it only when no process is running
echo for node.....
not_found=0
pgrep node || not_found=1

if [ ${not_found} = 1 ] ; then
    echo "not found node"
    nohup node  /data/wwwz/card2/backoffice/bin/server.js  &
else
    echo "find node"
fi

