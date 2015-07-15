angular.module('westernWildfire').directive('mapGraph', ['tipService', 'StatsService', 'chartService', function(tipService, StatsService, chartService) {
    function link(scope, element, attrs) {
        var margin = {top: 20, right: 20, left: 20, bottom: 20},
            height = 750 - margin.top - margin.bottom,
            width = 1000 - margin.left - margin.right,
            tip = tipService.tipDiv();

        scope.$watchGroup(['map', 'fires'], function(values) {
            if (!values[0] || !values[1]) { return; }

            var map_data = values[0];
            var fires = values[1];

            fires.sort(function(a,b) {
                var a_size = +a.size;
                var b_size = +b.size;
                if(b_size < a_size) {
                    return -1;
                } else if(b_size > a_size) {
                    return 1;
                } else {
                    return 0;
                }
            });

            chartService.legend('#map_legend', true);

            var mapScale = chartService.mapScale(fires);
            var scale = 1,
                projection = d3.geo.mercator()
                    .scale(scale)
                    .translate([width/2, height/2]),
                center = d3.geo.centroid(map_data),
                path = d3.geo.path().projection(projection);

            // using the path determine the bounds of the current map and use
            // these to determine better values for the scale and translation
            var bounds  = path.bounds(map_data);
            var hscale  = scale*width  / (bounds[1][0] - bounds[0][0]);
            var vscale  = scale*height / (bounds[1][1] - bounds[0][1]);
                scale   = (hscale < vscale) ? hscale : vscale; console.log(scale)
            var offset  = [width - (bounds[0][0] + bounds[1][0])/2,
            height - (bounds[0][1] + bounds[1][1])/2]; console.log(offset)

            // new projection
            projection = d3.geo.mercator().center(center)
                .scale(500).translate([880,325]);
            path = path.projection(projection);

            var zoom = d3.behavior.zoom()
                .scaleExtent([1, 10])
                .on("zoom", zooming);

            var drag = d3.behavior.drag()
                .origin(function(d) { return d; })
                .on("drag", dragged);

            var map_svg = d3.select('#map').append('svg')
                .attr('height', height)
                .attr('width', width)
                .call(zoom);

            var map = map_svg.append('g');

            map.selectAll("path")
                .data(map_data.features)
                .enter()
                .append("path")
                .attr("d", path);

            map.selectAll("circle")
                .data(fires)
                .enter()
                .append("circle")
                .attr("class", "map-circle")
                .attr("cx", function(d) {
                    return projection([d.lng, d.lat])[0]; })
                .attr("cy", function(d) {
                    return projection([d.lng, d.lat])[1]; })
                .attr("r", function(d) {
                    return mapScale(d.size);
                })
                .style("fill", function(d) {
                    return "firebrick";//chartService.resColors(d.pct_capacity);
                })
                .style("stroke", "black")
                .on("mouseover", function(d) {
                    if(!d.fuels) { d.fuels = 'Unknown'; }
                    if(!d.cause) { d.cause = 'Unknown'; }

                    var text =  d.name + "<br>" +
                        "Start Date: " + d.date + "<br>" +
                        "Size: " + StatsService.numFormat(d.size) + " acres<br>" +
                        "Cause: " + d.cause + "<br>" +
                        "Fuels: " + d.fuels;

                    tipService.tipShow(tip, text);

                    d3.select(this).attr('r', function(d) {
                        return mapScale(d.size) * 1.5;
                    });
                })
                .on("mouseout", function(d) {
                    tipService.tipHide(tip);

                    d3.select(this).attr('r', function(d) {
                        return mapScale(d.size);
                    });
                });

            function zooming() {
                map.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
                // if(d3.event.scale > 2) {
                //     d3.selectAll('#map circle').attr("r", 1.5);
                // }
            }

            function dragged(d) {
                d3.event.sourceEvent.stopPropagation();
                d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
            }
        });
    }

    return {
        restrict: 'C',
        link: link,
        scope: {
            'map': '=',
            'fires': '='
        }
    }
}]);
