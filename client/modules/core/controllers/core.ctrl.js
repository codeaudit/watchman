angular.module('com.module.core')
    .controller('CoreCtrl',['$scope','$http','ParsedEvent',function($scope,$http,ParsedEvent) {
        angular.extend($scope, {
            markers: {}
        });

        $scope.eventCount = 0;

        $scope.request_model = {
            'dataString':'This is a test string rocking all the way to 1st and Congress, Austin Tx.'
        };

        $scope.submit = function(){

            $http.post("/api/extract/process", $scope.request_model).success(function(data, status) {
                console.log(data);
            })
        };

        $scope.addEvents = function(newEvents) {
            angular.extend($scope, {
                markers: newEvents
            });
        };

        $scope.removeMarkers = function() {
            $scope.markers = {};
        };

        setInterval(function(){
            var whereClause={
                filter: {
                    where: {
                        geoCoded:true
                    }
                }
            };

            ParsedEvent.find(whereClause).$promise.then(function(parsedEvents){
                if(parsedEvents.length===0){
                    return;
                }
                $scope.removeMarkers();
                $scope.addEvents(parsedEvents);
            });
        },5000);

    }]);
