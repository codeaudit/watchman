#!/bin/bash
#    This script should be run in the VM hosting the mongo container (e.g. main watchman deployment) to initialize sharding via mongos
#
cat | (docker exec -i mongo /bin/bash) <<__END_SHARD_COLLECTIONS_OUTER__
cat | /usr/bin/mongo localhost:27017 << __END_SHARD_COLLECTIONS__
use rancor
sh.enableSharding( "rancor" )
sh.shardCollection( "rancor.aggregateCluster", { "_id" : 1 } )
sh.shardCollection( "rancor.clusterLink", { "source" : 1, "target" : 1, "end_time_ms" : 1 } )
sh.shardCollection( "rancor.event", { "_id" : 1 } )
sh.shardCollection( "rancor.feedObject", { "_id" : 1 } )
sh.shardCollection( "rancor.jobMonitor", { "_id" : 1 } )
sh.shardCollection( "rancor.postsCluster", { "_id" : 1 } )
sh.shardCollection( "rancor.socialMediaPost", { "_id" : 1 } )
sh.shardCollection( "rancor.textFeed", { "_id" : 1 } )
__END_SHARD_COLLECTIONS__
exit
__END_SHARD_COLLECTIONS_OUTER__

