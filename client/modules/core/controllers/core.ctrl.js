angular.module('com.module.core')
    .controller('CoreCtrl',['$scope','$http',function($scope,$http) {
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
                if(!data){
                    return;
                }
                $scope.eventCount++;
                var newEvent = {
                    'id':$scope.eventCount.toString(),
                    'people':data.PERSON,
                    'organizations':data.ORGANIZATION,
                    'when':data.DATE,
                    'where':data.LOCATION,
                    'message':$scope.request_model.dataString
                };
                if(data.LOCATION && data.LOCATION.length > 0){
                    $scope.extractLocation(data.LOCATION[0],newEvent);
                }
            })
        };

        $scope.extractLocation = function(locationString,newEvent){
            $http.get("/api/geocoder/geocode?locationString=" + locationString).success(function(data, status) {
                console.log(data);
                newEvent.lat = data.latitude;
                newEvent.lng = data.longitude;
                var newEvents = {};
                newEvents.id = newEvent;
                $scope.removeMarkers();
                $scope.addEvents(newEvents);
            })
        };

        $scope.addEvents = function(newEvents) {
            angular.extend($scope, {
                markers: newEvents
            });
        };

        $scope.removeMarkers = function() {
            $scope.markers = {};
        }

    }]);
