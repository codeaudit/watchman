angular.module('com.module.core')
  .controller('EventsCtrl', EventsCtrl);

function EventsCtrl($scope, PostsCluster, Extract, Geocoder, SocialMediaPost, $q) {
  $scope.eventPoints = {};
  $scope.clusterText = '';
  $scope.clusterTerm = '';
  $scope.events = null;
  $scope.selectedEvents = null;
  $scope.selectedEvent= null;
  $scope.filterText = null;
  // obj: represents a cluster but not a loopback model

  $scope.eventSelected = function(evnt){
    visualizeEvent(evnt);
  };

  $scope.eventChanged= function(evnt){
    evnt.$save();
  };

  $scope.filterChanged = function(){
    var tempEvents = $scope.selectedEvents;
    $scope.selectedEvents = [];
    tempEvents.forEach(function(aggEvent){
      filterEvent(aggEvent);
    });
  };

  function filterEvent(evnt){
    PostsCluster.find({
      filter: {
        where: {
          id: { inq: evnt.cluster_ids }
        }
      }
    }).$promise
      .then(clusters => {
        $scope.communityClusters = clusters;
        return clusters;
      })
      .then(clusters => $scope.filter(clusters,evnt))
      .catch(console.error);
  }

  function visualizeEvent(evnt) {
    $scope.selectedEvent = evnt;
    PostsCluster.find({
      filter: {
        where: {
          id: { inq: evnt.cluster_ids }
        }
      }
    }).$promise
      .then(clusters => {
        $scope.communityClusters = clusters;
        return clusters;
      })
      .then($scope.visualize)
      .then(visual => visual.forAll())
      .catch(console.error);
  }

  $scope.dateRangeSelected = function(start, end) {
    $scope.showSpinner = true;
    $q.all([
      getEvents(start,end)
    ])
    .then(function() {
      $scope.showSpinner = false;
    })
    .catch(console.error);
  };

  function getEvents(start, end){
    var events = [];
    $scope.events.forEach(function(aggEvent){
      if(aggEvent.end_time_ms >= start && aggEvent.end_time_ms<=end){
        events.push(aggEvent);
      }
      else if(aggEvent.start_time_ms >= start && aggEvent.start_time_ms<=end){
        events.push(aggEvent);
      }
      else if(aggEvent.start_time_ms <= start && aggEvent.end_time_ms >= end){
        events.push(aggEvent);
      }
    });
    $scope.selectedEvents = events;
  }

  $scope.filter = filter;
  function filter(clusters, evnt){
    function sampleSocialMediaPosts(dataType, sampleSize=100) {
      let similarPostIds = _(clusters).map('similar_post_ids')
        .flatten().compact().uniq().value();

      let ids = _.sampleSize(similarPostIds, sampleSize);

      return SocialMediaPost.find({
        filter: {
          where: {
            post_id: { inq: ids },
            featurizer: dataType
          }
        }
      }).$promise;
    }

    var terms = evnt.hashtags.join(', ');
    if(terms.includes($scope.filterText)){
      $scope.selectedEvents.push(evnt);
      return;
    }

    sampleSocialMediaPosts('text')
      .then(posts => {
        let allText = posts.map(p => p.text).join(' ');
        if(allText.includes($scope.filterText)){
          $scope.selectedEvents.push(evnt);
        }
      })
      .catch(console.error);
  }


   // 'visualize': show me the details
  $scope.visualize = visualize;

  function visualize(clusters) {
    if (!_.isArray(clusters)) clusters = [clusters];

    function sampleSocialMediaPosts(dataType, sampleSize=100) {
      let similarPostIds = _(clusters).map('similar_post_ids')
        .flatten().compact().uniq().value();

      let ids = _.sampleSize(similarPostIds, sampleSize);

      return SocialMediaPost.find({
        filter: {
          where: {
            post_id: { inq: ids },
            featurizer: dataType
          }
        }
      }).$promise;
    }

    let functions = {
      forText() {
        $scope.showSpinner = true;

        $scope.clusterText = '';

        sampleSocialMediaPosts('text')
          .then(posts => {
            let allText = posts.map(p => p.text).join(' ');
            $scope.clusterText = allText;
            $scope.showSpinner = false;
          })
          .catch(console.error);
      },

      forMap(){
        let features = {};
        $scope.selectedEvent.location.forEach(function(location){
          if(location.geo_type !== "point"){
            return;
          }

          features[location.label] = { lat: location.coords[0].lat, lng: location.coords[0].lng, message: location.label, focus: true, draggable: false };
        });
        $scope.eventPoints = features;
      },

      forHashtags() {
        $scope.clusterTerm = $scope.selectedEvent.hashtags.join(', ');
      },

      forImages() {
        $scope.showSpinner = true;
        $scope.imageUrls = $scope.selectedEvent.image_urls;
      },

      forAll() {
        this.forText();
        this.forMap();
        this.forHashtags();
        this.forImages();
      }
    };

    return functions;
  }
}



