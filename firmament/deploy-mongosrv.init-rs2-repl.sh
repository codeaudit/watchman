#!/bin/bash
#    This script should be run in the SECOND VM to initialize the rs2 replica set
#
cat | (docker exec -i mongo-rs2-0 /bin/bash) <<__END_INIT_REPL_SET_OUTER__
cat | /usr/bin/mongo localhost:27017 << __END_INIT_REPL_SET__
rs.initiate( {
   _id: "rs2",
   members: [
      { _id: 0, host: "mongo-rs2-0:27017" },
      { _id: 1, host: "mongo-rs2-1:27017" }
   ]
} )
__END_INIT_REPL_SET__
exit
__END_INIT_REPL_SET_OUTER__

