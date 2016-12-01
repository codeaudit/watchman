#!/bin/bash
#    This script should be run in the first VM to initialize sharding
#
cat | (docker exec -i mongos-srv-1 /bin/bash) <<__END_INIT_SHARDING_OUTER__
cat | /usr/bin/mongo 127.0.01:27017 << __END_INIT_SHARDING__
sh.addShard( "rs0/mongo-rs0-0:27017,mongo-rs0-1:27017" )
sh.addShard( "rs1/mongo-rs1-0:27017,mongo-rs1-1:27017" )
sh.addShard( "rs2/mongo-rs2-0:27017,mongo-rs2-1:27017" )
__END_INIT_SHARDING__
exit
__END_INIT_SHARDING_OUTER__

