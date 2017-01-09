rem mongod -dbpath D:\Tools\dbMongo\db
rem  --fork=true
mongod --auth --dbpath D:\Tools\dbMongo\db --bind_ip=127.0.0.1 --port=27098 --logpath=D:\Tools\dbMongo\mongod.log --logappend &
