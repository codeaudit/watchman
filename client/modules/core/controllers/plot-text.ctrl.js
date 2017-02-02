'use strict';

angular.module('com.module.core')
.controller('PlotTextCtrl',['$scope','$http', PlotTextCtrl]);

function PlotTextCtrl($scope, $http) {
  $scope.mapPoints = {};
  $scope.textAreaText = '';
  $scope.textChanged = function() {

    var commonRegex = new CommonRegex();

    var addy = commonRegex.getAddresses($scope.textAreaText);

    console.log(addy);
    let points = {};
    let count = addy.length;
    let finished = 0;
    addy.forEach(address => {
      $http.post('/api/geocoder/forward-geo', {"address": address})
        .success(function (data, status) {
          finished++;
          if(!data || data.length === 0) return;
          $scope.mapPoints = {};
          points[address] = {
            lat: data[0].latitude,
            lng: data[0].longitude,
            message: address,
            focus: true,
            draggable: false
          };
          if(finished === count)
            $scope.mapPoints = points;
        })
    });
  };

  $scope.populateMap = function() {
    let points = {};
    let locations = $scope.selectedEvent.location.sort((a, b) => b.weight - a.weight);
    locations.forEach(location => {
      if (location.geo_type !== 'point')
        return;

      points[location.label] = {
        lat: location.coords[0].lat,
        lng: location.coords[0].lng,
        message: location.label,
        focus: true,
        draggable: false
      };
    });
    $scope.mapPoints = _.isEmpty(points) ? null : points;
  };

}
