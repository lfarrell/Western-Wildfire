/**
 * Load historic graphs
 */
d3.csv('data/full_data_all.csv', function(data) {
    var margin = {top: 20, right: 100, left: 70, bottom: 50},
        height = 375 - margin.top - margin.bottom,
        svg_width = document.getElementById("fires"),
        format = d3.time.format("%Y").parse;

    data.forEach(function(d) {
        d.avg_size = Math.round(d.acres / d.fires);
        d.string_year = d.year;
        d.year = format(d.year);
        d.acres = +d.acres;
        d.precip = +d.precip;
        d.precip_anomoly = +d.precip_anomoly;
        d.temp = +d.temp;
        d.temp_anomoly = +d.temp_anomoly;
    });

    var fires = d3.select('#fires').append('svg');
    var rain = d3.select('#rain').append('svg');
    var temp = d3.select('#temperature').append('svg');

    function build_graph() {
        var width = svg_width.clientWidth - margin.left - margin.right;

        graph_type(fires, 'fires', 'ca', width, 0);
        graph_type(rain, 'precip', 'ca', width, 2);
        graph_type(temp, 'temp', 'ca', width, 1);

        localStorage.setItem('fire_field', 'fires');
        localStorage.setItem('rain_field', 'precip');
        localStorage.setItem('temp_field', 'temp');
    }

    build_graph();

    function graph_type(graph, field, state, width, j) {
        graph.attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append('g');

        var filtered = data.filter(function(d) {
            return d.state == state.toUpperCase();
        });

        var info_box = d3.select('#results ul');

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
            .attr("id", field + "_1")
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
            .on("mouseout", function() {
                focus.style("display", "none");
                info_box.html('');
            })
            .on("mousemove",  mousemove)
            .attr("transform", "translate(" + margin.left+ "," + margin.top + ")");

        function mousemove() {
            var fire_field = localStorage.getItem('fire_field'),
                rain_field = localStorage.getItem('rain_field'),
                temp_field = localStorage.getItem('temp_field');

            var x0 = xScale.invert(d3.mouse(this)[0]),
                t = bisectDate(filtered, x0, 1),
                d0 = filtered[t - 1],
                d1 = filtered[t];

            if(d1 === undefined) d1 = Infinity;
            var d = x0 - d0.year > d1.year - x0 ? d1 : d0;

            var fires_transform = "translate(" + (xScale(d.year) + margin.left) + "," + (yScale(d[fire_field]) + margin.top) + ")";
            var precip_transform = "translate(" + (xScale(d.year) + margin.left) + "," + (yScale(d[rain_field]) + margin.top) + ")";
            var temp_transform = "translate(" + (xScale(d.year) + margin.left) + "," + (yScale(d[temp_field]) + margin.top) + ")";

            d3.select("#fires circle.y0").attr("transform", fires_transform);
            d3.select("#fires text.y0").attr("transform", fires_transform)
                .tspans([
                    "Year: " + d.string_year,
                    "Fires: " + numFormat(d[fire_field])
                ]);

            d3.select("#rain circle.y0").attr("transform", precip_transform);
            d3.select("#rain text.y0").attr("transform", precip_transform)
                .tspans([
                    "Year: " + d.string_year,
                    "Rainfall: " + d[rain_field]
                ]);

            d3.select("#temperature circle.y0").attr("transform", temp_transform);
            d3.select("#temperature text.y0").attr("transform", temp_transform)
                .tspans([
                    "Year: " + d.string_year,
                    "Avg. Temp: " + d[temp_field]
                ]);

            info_box.html(
                "<li><strong>Year:</strong> " + d.string_year + "</li>" +
                "<li><strong>Fires:</strong> " + numFormat(d[fire_field]) + "</li>" +
                "<li><strong>Avg. Temp:</strong> " + d[temp_field] + "</li>" +
                "<li><strong>Rainfall Total (Inches):</strong> " + d[rain_field] + "</li>"
            );
        }

        // Update Charts
        function chart_update(datz, graph, selected_field) {
           var graph_linez =  d3.svg.line()
                .x(function(d) { return xScale(d.year); })
                .y(function(d) { return yScale(d[selected_field]); });
            var chart;

            if(graph == 'fires' || !/anomoly/.test(selected_field)) {
                yScale.domain([d3.max(datz, function(d) { return d[selected_field]; }), 0]);
            } else {
                yScale.domain(d3.extent(datz, function(d) { return d[selected_field]; }));
                console.log(d3.extent(datz, function(d) { return d[selected_field]; }))
            }


            if(graph === 'fires') {
                chart = '#fires'
            } else if(graph === 'precip') {
                chart = '#rain';
            } else {
                chart = "#temperature";
            }

            d3.select(chart + " g.y").transition().duration(1000).ease("sin-in-out").call(yAxis);
            d3.select(chart + "_1").transition().duration(1000).ease("sin-in-out").attr("d", graph_linez(datz));
        }

        d3.select('#fire-options').on('click', function() {
            var field = d3.event.target.id;

            var which_graph = field.split('-');
            var graph_name = which_graph[0];
            var graph_field = which_graph[1];

            selected_field(graph_field);
            chart_update(filtered, graph_name, graph_field);
        });
    }

    window.addEventListener("resize", build_graph);
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

function selected_field(graph_field) {
    var fire_field, rain_field, temp_field;

    if(graph_field == 'fires') {
        if(graph_field == 'fires') {
            fire_field = 'fires'
        } else if (graph_field == 'acres') {
            fire_field = 'acres'
        } else {
            fire_field == 'avg_size'
        }

        localStorage.setItem("fire_field", fire_field);
    } else if(graph_field == 'precip') {
        if(graph_field == 'fires') {
            rain_field = 'precip';
        } else {
            rain_field = 'precip__anomoly';
        }

        localStorage.setItem('rain_field', rain_field);
    } else {
        if(graph_field == 'temp') {
            temp_field = 'temp';
        } else {
            temp_field = 'temp__anomoly';
        }

        localStorage.setItem('temp_field', temp_field);
    }
}