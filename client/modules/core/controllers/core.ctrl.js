angular.module('com.module.core')
  .controller('CoreCtrl',['$scope','$http','ParsedEvent','TextFeed',
    function($scope,$http,ParsedEvent,TextFeed) {
    angular.extend($scope, {
      markers: {}
    });

    $scope.eventCount = 0;

    $scope.myModel = {
      'dataString':"North Korea leader Kim Jong Un ordered his country to be ready to use its nuclear weapons at any time"
    };

    $scope.submit = function(){

      $http.post("/api/extract/process", $scope.myModel)
      .success(function(data, status) {
        console.log(data);
      })
    };

    $scope.destroyData = function() {
      ParsedEvent.destroyData()
      .$promise
      .then(function(data) { console.log(data); })
      .catch(console.error);
    }

    $scope.processNewsFeed = function(start) {

      if(!start){
        TextFeed.stopFeeds()
        .$promise
        .then(function(data) { console.log(data); })
        .catch(console.error);
        return;
      }

      TextFeed.startFeeds()
      .$promise
      .then(function(data) { console.log(data); })
      .catch(console.error);

      // dump the sections if we want to filter below
      // $http.get('http://api.nytimes.com/svc/news/v3/content/section-list?api-key=238cd8a60d87d3b49ce118ef1d94850c:8:74624285')
      // .then(console.log);

      // TODO: get more pages once we stop killing the server
      // for (var i=0; i<=1; i++) {
      //   $http.get('http://api.nytimes.com/svc/news/v3/content/all/all/48?offset=' + i*20 +
      //     '&api-key=238cd8a60d87d3b49ce118ef1d94850c:8:74624285')
      //   .then(function(data) {
      //     console.log(data);
      //     var submissions = [];
      //     var results = data.data.results;
      //     results.forEach(function(res) {
      //       if ( res.material_type_facet == 'News' ) {
      //         // var news = {
      //         //   title: res.title,
      //         //   time: res.created_date,
      //         //   locations: geo_facet.join('|'),
      //         // };
      //         var news = [res.abstract, res.title, res.created_date, res.geo_facet.toString()].join('|');
      //         console.log(news);
      //         submissions.push(news);
      //       }
      //     });

      //     submissions.forEach(function(sub) {
      //       $http.post("/api/extract/process", {dataString: sub})
      //       .then(function(data, status) {
      //         console.log(data);
      //       })
      //       .catch(console.error);
      //     });
      //   })
      //   .catch(console.error);
      // }
    };

    $scope.addEvents = function(events) {
      angular.extend($scope, {
        markers: events
      });
    };

    $scope.removeMarkers = function() {
      $scope.markers = {};
    };

    setInterval(function(){
      var filter={
        filter: {
          where: {
            geocoded:true
          }
        }
      };

      ParsedEvent.find(filter)
      .$promise
      .then(function(parsedEvents){
        if(!parsedEvents.length){
          $scope.removeMarkers();
          return;
        }
        $scope.removeMarkers();
        $scope.addEvents(JSON.parse(JSON.stringify(parsedEvents)));
      });
    },5000);

  }]);
