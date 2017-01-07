rem mongod -dbpath D:\Tools\dbMongo\db
rem  --fork=true
mongod -dbpath D:\Tools\dbMongo\db --bind_ip=127.0.0.1 --port=27098 --fork=true --logpath=D:\Tools\dbMongo\mongod.log &
