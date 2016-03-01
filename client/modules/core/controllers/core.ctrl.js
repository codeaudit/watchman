angular.module('com.module.core')
    .controller('CoreCtrl',['$scope','$http',function($scope,$http) {

        $scope.request_model = {
            'dataString':'This is a test string rocking all the way to 1st and Congress, Austin Tx.'
        };

        $scope.submit = function(){

            $http.post("/api/extract/process", $scope.request_model).success(function(data, status) {
                console.log(data);
            })
        };

    }]);
