/**
 * Load historic graphs
 */
d3.csv('data/full_data_all.csv', function(data) {
    var margin = {top: 20, right: 25, left: 70, bottom: 50},
        height = 375 - margin.top - margin.bottom,
        svg_width = document.getElementById("fires"),
        format = d3.time.format("%Y").parse;

    data.forEach(function(d) {
        d.avg_size = Math.round(d.acres / d.fires);
        d.string_year = d.year;
        d.year = format(d.year);
        d.acres = +d.acres;
        d.precip = +d.precip;
        d.precip__anomoly = +d.precip__anomoly;
        d.temp = +d.temp;
        d.temp_anomoly = +d.temp_anomoly;
    });

    var fires = d3.select('#fires').append('svg');
    var precip = d3.select('#precip').append('svg');
    var temp = d3.select('#temperature').append('svg');

    function build_graph() {
        var width = svg_width.clientWidth - margin.left - margin.right;

        graph_type(fires, 'acres', 'ca', width, 0);
        graph_type(precip, 'precip', 'ca', width, 2);
        graph_type(temp, 'temp', 'ca', width, 1);
    }

    build_graph();

    function graph_type(graph, field, state, width, j) { console.log(field)
        graph.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append('g');

        var filtered = data.filter(function(d) {
            return d.state == state.toUpperCase();
        });

        var xScale = d3.time.scale().range([0, width]);
        xScale.domain(d3.extent(filtered, function(d) {
            return d.year;
        }));

        var yScale = d3.scale.linear().range([0, height]);
        yScale.domain([d3.max(filtered, function(d) { return d[field]; }), 0]);

        var bisectDate = d3.bisector(function(d) { return d.year; }).right;

        var graph_line =  d3.svg.line()
            .x(function(d) { return xScale(d.year); })
            .y(function(d) { return yScale(d[field]); });

        var xAxis = d3.svg.axis()
            .scale(xScale)
            .ticks(8)
            .tickFormat(d3.time.format('%y'))
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(yScale)
            .ticks(10)
            .orient("left");

        var y_text = graph_text(j);

        graph.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate("+ margin.left + "," + (height + margin.top) + ")")
            .call(xAxis);

        graph.append("text")
            .attr("x", width/ 1.3)
            .attr("y", height + margin.bottom)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Date");

        graph.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(yAxis);

        graph.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height/2)
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(y_text);

        /**
         * Show values on mouseover
         */
        graph.append("g")
            .append("path")
            .attr("d", graph_line(filtered))
            .attr("id", "capacity")
            .attr("fill", "none")
            .attr("stroke", line_color(j))
            .attr("stroke-width", 2)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var focus = graph.append("g")
            .attr("class", "focus")
            .style("display", "none");

        focus.append("circle")
            .attr("class", "y0")
            .attr("r", 4.5);

        focus.append("text")
            .attr("class", "y0")
            .attr("x", 9)
            .attr("dy", ".35em");

        graph.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .on("mouseover", function() { focus.style("display", null); })
            .on("mouseout", function() { focus.style("display", "none"); })
            .on("mousemove",  mousemove)
            .attr("transform", "translate(" + margin.left+ "," + margin.top + ")");

        function mousemove() {
            var x0 = xScale.invert(d3.mouse(this)[0]),
                t = bisectDate(filtered, x0, 1),
                d0 = filtered[t - 1],
                d1 = filtered[t];

            if(d1 === undefined) d1 = Infinity;
            var d = x0 - d0.year > d1.year - x0 ? d1 : d0;

            var fires_transform = "translate(" + (xScale(d.year) + margin.left) + "," + (yScale(d.acres) + margin.top) + ")";
            var precip_transform = "translate(" + (xScale(d.year) + margin.left) + "," + (yScale(d.precip) + margin.top) + ")";
            var temp_transform = "translate(" + (xScale(d.year) + margin.left) + "," + (yScale(d.temp) + margin.top) + ")";

            d3.select("#fires circle.y0").attr("transform", fires_transform);
            d3.select("#fires text.y0").attr("transform", fires_transform)
                .tspans([
                    "Year: " + d.string_year,
                    "Fires: " + d.fires
                ]);

            d3.select("#precip circle.y0").attr("transform", precip_transform);
            d3.select("#precip text.y0").attr("transform", precip_transform)
                .tspans([
                    "Year: " + d.string_year,
                    "Rainfall: " + d.precip
                ]);

            d3.select("#temperature circle.y0").attr("transform", temp_transform);
            d3.select("#temperature text.y0").attr("transform", temp_transform)
                .tspans([
                    "Year: " + d.string_year,
                    "Avg. Temp: " + d.temp
                ]);

            d3.select('#wy').html("Year: " + d.string_year + "<br/>Fires: " +d.fires + "<br/>Avg. Temp: " + d.temp + "<br/>Rainfall Total: " + d.precip).style("text-align", "center");
        }
    }

        window.addEventListener("resize", build_graph);

        d3.select('#fire-options').on('click', function() {
            console.log("the thing that was actually clicked:", d3.event.target.id)
        });

       /* d3.select('rect').on('mousemove', function() {
            console.log("the thing that was actually clicked:", d3.event.target.id)
        }); */
});

function graph_text(graph_num) {
    if(graph_num === 0) {
        return 'Fires';
    } else if(graph_num == 1) {
        return 'Avg. Temp (F)';
    } else {
        return 'Rainfall (inches)';
    }
}

function line_color(graph_num) {
    if(graph_num === 0) {
        return 'firebrick';
    } else if(graph_num == 1) {
        return 'green';
    } else {
        return 'orange';
    }
}