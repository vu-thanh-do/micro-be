mongod --port 27017 --dbpath "C:\data\db" --replSet rs0 --bind_ip localhost
mongod --port 27018 --dbpath "C:\data\db1" --replSet rs0 --bind_ip localhost
mongod --port 27019 --dbpath "C:\data\db2" --replSet rs0 --bind_ip localhost

cfg = rs.conf();
cfg.members[0].priority = 2;  // Ưu tiên cao nhất cho node 27017
cfg.members[1].priority = 1;  // Mức trung bình
cfg.members[2].priority = 0.5; // Ưu tiên thấp nhất
rs.reconfig(cfg, { force: true });
rs.reconfig({
        "_id" : "rs0",
        "version" : 3,
        "term" : 1,
        "members" : [
                {
                        "_id" : 0,
                        "host" : "10.73.131.60:27017",
                        "arbiterOnly" : false,
                        "buildIndexes" : true,
                        "hidden" : false,
                        "priority" : 1,
                        "tags" : {
                        },
                        "secondaryDelaySecs" : NumberLong(0),
                        "votes" : 1
                }
        ],
        "protocolVersion" : NumberLong(1),
        "writeConcernMajorityJournalDefault" : true,
        "settings" : {
                "chainingAllowed" : true,
                "heartbeatIntervalMillis" : 2000,
                "heartbeatTimeoutSecs" : 10,
                "electionTimeoutMillis" : 10000,
                "catchUpTimeoutMillis" : -1,
                "catchUpTakeoverDelayMillis" : 30000,
                "getLastErrorModes" : {

                },
                "getLastErrorDefaults" : {
                        "w" : 1,
                        "wtimeout" : 0
                },
                "replicaSetId" : ObjectId("67a429980c33671c70a9dcc8")
        }
})