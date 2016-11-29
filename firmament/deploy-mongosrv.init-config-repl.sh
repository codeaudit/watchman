#!/bin/bash
#    This script should be run in the first VM to initialize the configuration replica set
#
cat | (docker exec -i mongo-cfg-0 /bin/bash) <<__END_INIT_REPL_SET_OUTER__
cat | /usr/bin/mongo localhost:27019 << __END_INIT_REPL_SET__
rs.initiate( {
   _id: "configReplSet",
   configsvr: true,
   members: [
      { _id: 0, host: "mongo-cfg-0:27019" },
      { _id: 1, host: "mongo-cfg-1:27019" },
      { _id: 2, host: "mongo-cfg-2:27019" }
   ]
} )
__END_INIT_REPL_SET__
exit
__END_INIT_REPL_SET_OUTER__

