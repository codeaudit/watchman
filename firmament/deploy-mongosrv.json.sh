#!/bin/bash
#  Takes 10 parameters:  
#     1) VM_NUM which should be set to 0, 1, 2 or 3
#           VM 0 generates the mongo-s firmament config that will attach to the 
#           mongo cloud created by configs 1, 2 and 3
#     2) Nine IPs, expectation is that these are from 3 VMs
#         VM.0.IP.0 : MONGO_CFG_IP0
#         VM.0.IP.1 : MONGO_RS0_IP0
#         VM.0.IP.2 : MONGO_RS1_IP0
#         VM.1.IP.0 : MONGO_CFG_IP1
#         VM.1.IP.1 : MONGO_RS0_IP1
#         VM.1.IP.2 : MONGO_RS2_IP0
#         VM.2.IP.0 : MONGO_CFG_IP2
#         VM.2.IP.1 : MONGO_RS1_IP1
#         VM.2.IP.2 : MONGO_RS2_IP1
#
#  Generates: deploy-mongosrv-$1.json  firmament deployment file
#
#  This will create a triply sharded dually written Mongo data cloud
#  using 3 VMs each having 3 Bridged NICs
#  

MONGO_CFG_IP0=$2
MONGO_RS0_IP0=$3
MONGO_RS1_IP0=$4
MONGO_CFG_IP1=$5
MONGO_RS0_IP1=$6
MONGO_RS2_IP0=$7
MONGO_CFG_IP2=$8
MONGO_RS1_IP1=$9
MONGO_RS2_IP1=${10}

if [ $1 -eq 0 ]
then 
    NAME0=mongo-s
    RS0=configReplSet
elif [ $1 -eq 1 ]
then 
    NAME0=mongo-cfg-0
    NAME1=mongo-rs0-0
    NAME2=mongo-rs1-0
    IP0=$MONGO_CFG_IP0
    IP1=$MONGO_RS0_IP0
    IP2=$MONGO_RS1_IP0
    RS0=configReplSet
    RS1=rs0
    RS2=rs1
elif [ $1 -eq 2 ]
then
    NAME0=mongo-cfg-1
    NAME1=mongo-rs0-1
    NAME2=mongo-rs2-0
    IP0=$MONGO_CFG_IP1
    IP1=$MONGO_RS0_IP1
    IP2=$MONGO_RS2_IP0
    RS0=configReplSet
    RS1=rs0
    RS2=rs2
elif [ $1 -eq 3 ]
then
    NAME0=mongo-cfg-2
    NAME1=mongo-rs1-1
    NAME2=mongo-rs2-1
    IP0=$MONGO_CFG_IP2
    IP1=$MONGO_RS1_IP1
    IP2=$MONGO_RS2_IP1
    RS0=configReplSet
    RS1=rs1
    RS2=rs2
fi

if [ $1 -eq 0 ]
then
cat > deploy-mongos.json << __UNTIL_HERE_S__
[
  {
    "name": "$NAME0",
    "Image": "mongo:3.2",
    "DockerFilePath": "",
    "Hostname": "$NAME0",
    "Cmd": ["/usr/bin/mongos", "--configdb", "$RS0/mongo-cfg-0:27019,mongo-cfg-1:27019,mongo-cfg-2:27019"],
    "HostConfig": {
      "Binds": [
        "/srv/data-$NAME0:/data"
      ],
      "ExtraHosts": [
        "mongo-cfg-0:$MONGO_CFG_IP0","mongo-rs0-0:$MONGO_RS0_IP0","mongo-rs1-0:$MONGO_RS1_IP0",
        "mongo-cfg-1:$MONGO_CFG_IP1","mongo-rs0-1:$MONGO_RS0_IP1","mongo-rs2-0:$MONGO_RS2_IP0",
        "mongo-cfg-2:$MONGO_CFG_IP2","mongo-rs1-1:$MONGO_RS1_IP1","mongo-rs2-1:$MONGO_RS2_IP1"],
      "PortBindings": {
        "27017/tcp": [
          {
            "HostPort": "27017"
          }
        ]
      }
    }
  }
]
__UNTIL_HERE_S__
else
cat > deploy-mongosrv-$1.json << __UNTIL_HERE_SRV__
[
  {
    "name": "$NAME0",
    "Image": "mongo:3.2",
    "DockerFilePath": "",
    "ExposedPorts": {"27019/tcp" : {}},
    "Hostname": "$NAME0",
    "Cmd": ["/usr/bin/mongod", "--configsvr", "--replSet", "$RS0"],
    "HostConfig": {
      "Binds": [
        "/srv/data-$NAME0:/data"
      ],
      "ExtraHosts": [
        "mongo-cfg-0:$MONGO_CFG_IP0","mongo-rs0-0:$MONGO_RS0_IP0","mongo-rs1-0:$MONGO_RS1_IP0",
        "mongo-cfg-1:$MONGO_CFG_IP1","mongo-rs0-1:$MONGO_RS0_IP1","mongo-rs2-0:$MONGO_RS2_IP0",
        "mongo-cfg-2:$MONGO_CFG_IP2","mongo-rs1-1:$MONGO_RS1_IP1","mongo-rs2-1:$MONGO_RS2_IP1"],
      "PortBindings": {
        "27017/tcp": [ {"HostIp": "$IP0", "HostPort": "27017" }],
        "27019/tcp": [ {"HostIp": "$IP0", "HostPort": "27019" }]
      }
    }
  },
  {
    "name": "$NAME1",
    "Image": "mongo:3.2",
    "DockerFilePath": "",
    "Hostname": "$NAME1",
    "Cmd": ["/usr/bin/mongod", "--replSet", "$RS1"],
    "HostConfig": {
      "Binds": [
        "/srv/data-$NAME1:/data"
      ],
      "ExtraHosts": [
        "mongo-cfg-0:$MONGO_CFG_IP0","mongo-rs0-0:$MONGO_RS0_IP0","mongo-rs1-0:$MONGO_RS1_IP0",
        "mongo-cfg-1:$MONGO_CFG_IP1","mongo-rs0-1:$MONGO_RS0_IP1","mongo-rs2-0:$MONGO_RS2_IP0",
        "mongo-cfg-2:$MONGO_CFG_IP2","mongo-rs1-1:$MONGO_RS1_IP1","mongo-rs2-1:$MONGO_RS2_IP1"],
      "PortBindings": {
        "27017/tcp": [ { "HostIp": "$IP1", "HostPort": "27017" } ]
      }
    }
  },
  {
    "name": "$NAME2",
    "Image": "mongo:3.2",
    "DockerFilePath": "",
    "Hostname": "$NAME2",
    "Cmd": ["/usr/bin/mongod",  "--replSet",  "$RS2"],
    "HostConfig": {
      "Binds": [
        "/srv/data-$NAME2:/data"
      ],
      "ExtraHosts": [
        "mongo-cfg-0:$MONGO_CFG_IP0","mongo-rs0-0:$MONGO_RS0_IP0","mongo-rs1-0:$MONGO_RS1_IP0",
        "mongo-cfg-1:$MONGO_CFG_IP1","mongo-rs0-1:$MONGO_RS0_IP1","mongo-rs2-0:$MONGO_RS2_IP0",
        "mongo-cfg-2:$MONGO_CFG_IP2","mongo-rs1-1:$MONGO_RS1_IP1","mongo-rs2-1:$MONGO_RS2_IP1"],
      "PortBindings": {
        "27017/tcp": [ { "HostIp": "$IP2", "HostPort": "27017" } ]
      }
    }
  },
  {
    "name": "mongos-srv-$1",
    "Image": "mongo:3.2",
    "DockerFilePath": "",
    "Hostname": "mongos-srv-$1",
    "Cmd": ["/usr/bin/mongos", "--configdb", "configReplSet/mongo-cfg-0:27019,mongo-cfg-1:27019,mongo-cfg-2:27019"],
    "HostConfig": {
      "Binds": [
        "/srv/data-mongos-srv-$1:/data"
      ],
      "ExtraHosts": [
        "mongo-cfg-0:$MONGO_CFG_IP0","mongo-rs0-0:$MONGO_RS0_IP0","mongo-rs1-0:$MONGO_RS1_IP0",
        "mongo-cfg-1:$MONGO_CFG_IP1","mongo-rs0-1:$MONGO_RS0_IP1","mongo-rs2-0:$MONGO_RS2_IP0",
        "mongo-cfg-2:$MONGO_CFG_IP2","mongo-rs1-1:$MONGO_RS1_IP1","mongo-rs2-1:$MONGO_RS2_IP1"],
      "PortBindings": {
        "27017/tcp": [ { "HostIp": "127.0.0.1", "HostPort": "27017" } ]
      }
    }
  }
]
__UNTIL_HERE_SRV__
fi
