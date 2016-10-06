'use strict';

angular.module('com.module.core')
.directive('communitiesGraph', communitiesDirective);

function communitiesDirective() {
  return {
    controller: communitiesGraphController,
    // link: link
  };

  // function link(scope, elem, attrs, ctrls) {
  //   ctrls.createGraph(null, angular.noop);
  // }
}

function communitiesGraphController($scope, ClusterLink, PostsCluster) {
  function createGraph(event, start, end, callback) {
    var query = {
      filter: {
        where: {
          end_time_ms: { between: [start, end] }
        }
      }
    };
    return ClusterLink.find(query)
      .$promise
      .then(getGraphData)
      .then(graphCommunities)
      .then(callback || angular.noop)
      .catch(console.error);
  }

  $scope.loadCommunityGraph = function(start, end, callback) {
    if ($scope.communityGraphSvg)
      $scope.communityGraphSvg.remove();

    return createGraph(null, start, end, callback);
  };

  function graphCommunities(graphData) {
    var nodes = graphData.nodes,
      edges = graphData.links,
      $container = $('.communities-container'),
      width = $container.width(),
      height = $container.height(),
      color = d3.scaleOrdinal().range(d3.schemeCategory20);

    var svg = d3.select('.communities-container').append('svg')
      .attr('width', width)
      .attr('height', height);

    $scope.communityGraphSvg = svg;

    var communities = createCommunities(nodes, edges);

    var node = svg.selectAll('.circle')
      .data(communities)
      .enter()
      .append('circle')
      .attr('class', 'circle')
      .attr('fill', '#fff')
      .attr('stroke', function(d, i) { return color(i); })
      .attr('stroke-width', 8)
      .attr('r', function(d) {
        var min = 5, len = d.member_ids.length;
        return len < min ? min : len;
      })
      .on('click', function(d) {
        showClustersDetails(d.member_ids);
      })

    var simulation = d3.forceSimulation(communities)
      .force('charge', d3.forceManyBody())
      .force('center', d3.forceCenter(width / 2, height / 2))
      .on('tick', ticked);

    function ticked() {
      node
        .attr('cx', function(d) { return d.x; })
        .attr('cy', function(d) { return d.y; });
    }

  }

  function showClustersDetails(ids) {
    PostsCluster.find({
      filter: {
        where: {
          id: {inq: ids}
        }
      }
    }).$promise
      .then($scope.getClusterDetails)
      .catch(console.error);
  }
}

function getGraphData(links) {
  // jLouvain lib expects nodes like ['a', 'b'] and
  // edges like [{source: 'a', target: 'b'}]
  var graph = {};
  graph.links = links;
  graph.nodes = [];
  graph.links.forEach(function(link){
    graph.nodes.push(link.source);
    graph.nodes.push(link.target);
  });

  graph.nodes = _.uniq(graph.nodes);

  return graph;
}


function createCommunities(nodes, edges) {
  var communityFinder = jLouvain()
    .nodes(nodes)
    .edges(edges);

  var communities = communityFinder();

  // convert to: [{community_id: 1, member_ids: []}, ...]
  var communityMembers = [];

  _.forOwn(communities, function(v, k) {
    var matcher = function(members) { return members.community_id == v };
    var existing = _.find(communityMembers, matcher);
    if (existing)
      existing.member_ids.push(k);
    else
      communityMembers.push({community_id: v, member_ids: [k]});
  });

  return communityMembers;
}
