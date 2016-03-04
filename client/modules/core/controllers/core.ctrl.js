angular.module('com.module.core')
    .controller('CoreCtrl',['$scope','$http','ParsedEvent',function($scope,$http,ParsedEvent) {
        angular.extend($scope, {
            markers: {}
        });

        $scope.eventCount = 0;

        $scope.request_model = {
            'dataString':"North Korea leader Kim Jong Un ordered his country to be ready to use its nuclear weapons at any time"
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
                    $scope.removeMarkers();
                    return;
                }
                $scope.removeMarkers();
                $scope.addEvents(JSON.parse(JSON.stringify(parsedEvents)));
            });
        },5000);

    }]);
