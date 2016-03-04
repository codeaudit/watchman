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

        $scope.processNewsFeed = function() {

            // dump the sections if we want to filter below
            $http.get('http://api.nytimes.com/svc/news/v3/content/section-list?api-key=238cd8a60d87d3b49ce118ef1d94850c:8:74624285')
            .then(console.log);

            // TODO: get more pages once we stop killing the server
            for (var i=0; i<=1; i++) {
                $http.get('http://api.nytimes.com/svc/news/v3/content/all/all/48?offset=' + i*20 + 
                    '&api-key=238cd8a60d87d3b49ce118ef1d94850c:8:74624285')
                .then(function(data) {
                    console.log(data)
                    var submissions = [];
                    var results = data.data.results;
                    results.forEach(function(res) {
                        if ( res.material_type_facet == 'News' ) {
                            // var news = {
                            //     title: res.title,
                            //     time: res.created_date,
                            //     locations: geo_facet.join('|'),
                            // };
                            var news = [res.abstract, res.title, res.created_date, res.geo_facet.toString()].join('|')
                            console.log(news)
                            submissions.push(news);
                        }
                    });

                    submissions.forEach(function(sub) {
                        $http.post("/api/extract/process", {dataString: sub})
                        .then(function(data, status) {
                            console.log(data);
                        })
                        .catch(console.error);
                    });
                })
                .catch(console.error);
            }
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
