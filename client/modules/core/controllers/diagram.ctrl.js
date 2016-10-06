angular.module('com.module.core')
  .controller('DiagramCtrl', DiagramCtrl);

function DiagramCtrl($scope, PostsCluster, SocialMediaPost, $q) {
  $scope.cluster = undefined;
  $scope.clusterText = '';
  $scope.clusterTerm = '';

  $scope.showDetails = function(cluster) {
    $scope.clusters = PostsCluster.findOne({
      filter: {
        where: {
          id: cluster.id
        }
      }
    }).$promise
      .then(function(cluster) {
        var unique = new Set();
        cluster.similar_ids.forEach(function(id){
          unique.add(id);
        });
        cluster.similar_ids = [...unique];
        if (cluster.data_type === 'text'){
          $scope.getClusterText(cluster);
        } else if (cluster.data_type === 'hashtag'){
          $scope.getClusterHashtags(cluster);
        } else if (cluster.data_type === 'image'){
          $scope.getClusterImages(cluster);
        }

        $scope.cluster = cluster;
      })
      .catch(console.error);
  };

  $scope.dateRangeSelected = function(start, end) {
    $scope.showSpinner = true;
    $q.all([
      $scope.loadNetworkGraph(start, end),
      $scope.loadCommunityGraph(start, end)
    ])
    .then(function() {
      $scope.showSpinner = false;
    })
    .catch(console.error);
  };

  $scope.getClusterDetails = function(clusters) {
    $scope.getClusterText(clusters);
    $scope.getClusterHashtags(clusters);
    $scope.getClusterImages(clusters);
  };

  $scope.getClusterText = function(clusters) {
    if (!_.isArray(clusters)) clusters = [clusters];

    $scope.showSpinner = true;

    $scope.clusterText = '';

    var similar_ids = _(clusters).map('similar_ids')
      .flatten().compact().uniq().value();

    var ids = _.sampleSize(similar_ids, 100);

    SocialMediaPost.find({
      filter: {
        where: {
          id: {inq: ids}
        }
      }
    }).$promise
      .then(posts => {
        var allText = posts.map(p => p.text).join(' ');
        $scope.clusterText = allText;
        $scope.showSpinner = false;
      })
      .catch(console.error);
  };

  //cheat a bit here just to show the hashtag in the cloud
  $scope.getClusterHashtags = function(clusters) {
    if (!_.isArray(clusters)) clusters = [clusters];

    var terms = _(clusters).map('term')
      .flatten().compact().value().join(', ');

    $scope.clusterTerm = terms;
  };

  $scope.getClusterImages = function(clusters) {
    if (!_.isArray(clusters)) clusters = [clusters];

    var imageUrls = _(clusters).map('similar_image_urls')
      .flatten().compact().value();

    if (imageUrls.length) {
      $scope.imageUrls = imageUrls;
    } else {// TODO: should only get here if bad/missing data?
      $scope.imageUrls = null;
      console.info('no similar_image_urls');
    }
  };
}
