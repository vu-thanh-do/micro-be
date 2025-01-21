mongod --port 27017 --dbpath "C:\data\db" --replSet rs0 --bind_ip localhost
mongod --port 27018 --dbpath "C:\data\db1" --replSet rs0 --bind_ip localhost
mongod --port 27019 --dbpath "C:\data\db2" --replSet rs0 --bind_ip localhost