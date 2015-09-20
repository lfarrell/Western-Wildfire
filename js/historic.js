/**
 * Load historic graphs
 */
d3.csv('data/full_data_all.csv', function(data) {
    var margin = {top: 20, right: 130, left: 100, bottom: 80},
        height = 350 - margin.top - margin.bottom,
        svg_width = document.getElementById("ak"),
        graphs = ['AK', 'AZ', 'CA', 'CO', 'ID', 'MT', 'NM', 'NV', 'OR', 'UT', 'WA', 'WY'];

    data.forEach(function(d) {
        d.avg_size = Math.round(d.acres / d.fires).toFixed(1);
    });

    for(var i=0, size=graphs.length; i<size; i++) {
        var svg = d3.select(graphs[i]).append('svg');

        function build_graph() {
            var width = svg_width.clientWidth - margin.right - margin.left;
            var filtered = data.filter(function(d) {
                return d.state == graphs[i];
            });
            
            var xScale = d3.time.scale().range([0, width]);
            xScale.domain(d3.extent(filtered, function(d) {
                return d.year;
            }));
            
            var yScale = d3.scale.linear().range([0, height]);
            yScale.domain([0, d3.max(filtered, function(d) { return d.fires; })]);

            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left");

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate("+ margin.left + "," + (height + margin.top) + ")")
                .call(xAxis);

            svg.append("text")
                .attr("x", width / 1.5)
                .attr("y", height + margin.bottom)
                .style("text-anchor", "zs")
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
                .text(y_text);
        }
    }

    build_graph();
    window.addEventListener("resize", build_graph);
});

