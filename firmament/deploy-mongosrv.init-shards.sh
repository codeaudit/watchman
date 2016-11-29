#!/bin/bash
#    This script should be run in the VM hosting the mongo container (e.g. main watchman deployment) to initialize sharding via mongos
#
cat | (docker exec -i mongo /bin/bash) <<__END_INIT_SHARDING_OUTER__
cat | /usr/bin/mongo localhost:27017 << __END_INIT_SHARDING__
sh.addShard( "rs0/mongo-rs0-0:27017,mongo-rs0-1:27017" )
sh.addShard( "rs1/mongo-rs1-0:27017,mongo-rs1-1:27017" )
sh.addShard( "rs2/mongo-rs2-0:27017,mongo-rs2-1:27017" )
use rancor
sh.enableSharding( "rancor" )
sh.shardCollection( "rancor.aggregateCluster", { "_id_" : 1 } )
sh.shardCollection( "rancor.clusterLink", { "idx_uniq" : 1 } )
sh.shardCollection( "rancor.event", { "_id_" : 1 } )
sh.shardCollection( "rancor.feedObject", { "_id_" : 1 } )
sh.shardCollection( "rancor.jobMonitor", { "_id_" : 1 } )
sh.shardCollection( "rancor.postsCluster", { "_id_" : 1 } )
sh.shardCollection( "rancor.socialMediaPost", { "_id_" : 1 } )
sh.shardCollection( "rancor.textFeed", { "_id_" : 1 } )
__END_INIT_SHARDING__
exit
__END_INIT_SHARDING_OUTER__

