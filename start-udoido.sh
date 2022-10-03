## simplified version for debug
## sudo mongod --dbpath /var/lib/udoidodb --bind_ip=127.0.0.1
## mongo --port=57098

## prod version: run in background without hungup by console session
## start db server and wait 5s for fully started
sudo nohup mongod --auth --dbpath /var/lib/udoidodb --bind_ip=127.0.0.1 --port=57098 &
sleep 5

## start www server
sudo node ./backOffice/bin/server.js



