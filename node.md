mongod --port 27017 --dbpath "C:\data\db" --replSet rs0 --bind_ip localhost
mongod --port 27018 --dbpath "C:\data\db1" --replSet rs0 --bind_ip localhost
mongod --port 27019 --dbpath "C:\data\db2" --replSet rs0 --bind_ip localhost

cfg = rs.conf();
cfg.members[0].priority = 2;  // Ưu tiên cao nhất cho node 27017
cfg.members[1].priority = 1;  // Mức trung bình
cfg.members[2].priority = 0.5; // Ưu tiên thấp nhất
rs.reconfig(cfg, { force: true });
