/**
 * Load historic graphs
 */
d3.csv('data/full_data_all.csv', function(data) {
    var margin = {top: 20, right: 25, left: 75, bottom: 50},
        height = 375 - margin.top - margin.bottom,
        svg_width = document.getElementById("ak_0"),
        format = d3.time.format("%Y").parse,
        graphs = ['ak', 'az', 'ca', 'co', 'id', 'mt', 'nm', 'nv', 'or', 'ut', 'wa', 'wy'];

    data.forEach(function(d) {
        d.avg_size = Math.round(d.acres / d.fires);
        d.year = format(d.year);
    });

    for(var i=0, size=graphs.length; i<size; i++) {
        for(var j=0; j<3; j++) {
            var svg = d3.select('#' + graphs[i] + '_' + j).append('svg');

            function build_graph() {
                var width = svg_width.clientWidth - margin.left - margin.right;

                svg.attr("width", width + margin.left + margin.right)
                    .attr("height", height + margin.top + margin.bottom)
                    .append('g');

                var filtered = data.filter(function(d) {
                    return d.state == graphs[i].toUpperCase();
                });

                var xScale = d3.time.scale().range([0, width]);
                xScale.domain(d3.extent(filtered, function(d) {
                    return d.year;
                }));

                var yScale = d3.scale.linear().range([0, height]);
                yScale.domain([d3.max(filtered, function(d) { return d.fires; }), 0]);

                var xAxis = d3.svg.axis()
                    .scale(xScale)
                    .ticks(8)
                    .tickFormat(d3.time.format('%y'))
                    .orient("bottom");

                var yAxis = d3.svg.axis()
                    .scale(yScale)
                    .ticks(10)
                    .orient("left");

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate("+ margin.left + "," + (height + margin.top) + ")")
                    .call(xAxis);

                svg.append("text")
                    .attr("x", width / 1.5)
                    .attr("y", height + margin.bottom)
                    .style("text-anchor", "end")
                    .text("Date");

                svg.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                    .call(yAxis);

                svg.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("x", -height/2)
                    .attr("y", 6)
                    .attr("dy", ".71em")
                    .style("text-anchor", "end")
                // .text(y_text);
            }

            build_graph();
        }
    }


    window.addEventListener("resize", build_graph);

    d3.select('#fire-options').on('click', function() {
        console.log("the thing that was actually clicked:", d3.event.target.id)
    });
});

function graph_type(graph_num) {
    if(graph_num === 0) {
        return 'fires';
    } else if(graph_num == 1) {
        return 'temp';
    } else {
        return 'precip';
    }
}

