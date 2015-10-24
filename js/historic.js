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
    
    var y_texts = [
        'Fires',
        'Avg. Temp (F)',
        'Rainfall (inches)',
        'Total Acres Burned',
        'Avg. Acres Burned',
        'Temp Anomaly (F)',
        'Rainfall Anomaly (inches)'
    ];

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
        localStorage.setItem('fire_text', 0);
        localStorage.setItem('rain_text', 2);
        localStorage.setItem('temp_text', 1);
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
            .attr("class", "y_text_" + j)
            .style("text-anchor", "end")
            .text(y_texts[j]);

        graph.append("g")
            .append("path")
            .attr("d", graph_line(filtered))
            .attr("id", field + "_1")
            .attr("fill", "none")
            .attr("stroke", line_color(j))
            .attr("stroke-width", 2)
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var circles = graph.selectAll("circle")
            .data(filtered);

        circles.enter()
            .append('circle')
            .attr('class', 'line-circles')
            .attr('r', 4)
            .attr('cx', function(d) { return xScale(d.year); })
            .attr('cy', function(d) { return yScale(d[field]); })
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .style('fill', line_color(j))
            .on('click', function(d) {
                var fire_field = localStorage.getItem('fire_field'),
                    rain_field = localStorage.getItem('rain_field'),
                    temp_field = localStorage.getItem('temp_field'),
                    fire_text = localStorage.getItem('fire_text'),
                    rain_text = localStorage.getItem('rain_text'),
                    temp_text = localStorage.getItem('temp_text');

                info_box.html(
                    "<li><strong>Year:</strong> " + d.string_year + "</li>" +
                    "<li><strong>" + y_texts[fire_text] + ":</strong> " + numFormat(d[fire_field]) + "</li>" +
                    "<li><strong>" + y_texts[rain_text] + ":</strong> " + d[rain_field] + "</li>" +
                    "<li><strong>" + y_texts[temp_text] + ":</strong> " + d[temp_field] + "</li>"
                );
            });

        circles.exit().remove();

        // Update Charts
        function chart_update(datz, graph, selected_field, y_text) {
            var chart, y_text_option;
            var graph_linez =  d3.svg.line()
                .x(function(d) { return xScale(d.year); })
                .y(function(d) { return yScale(d[selected_field]); });

            yScale.domain([d3.max(datz, function(d) { return d[selected_field]; }), 0]);

            if(graph === 'fires') {
                chart = '#fires';
                y_text_option = '.y_text_0';
                localStorage.setItem('fire_text', y_text);
            } else if(graph === 'precip') {
                chart = '#rain';
                y_text_option = '.y_text_2';
                localStorage.setItem('rain_text', y_text);
            } else if(graph === 'temp') {
                chart = "#temperature";
                y_text_option = '.y_text_1';
                localStorage.setItem('temp_text', y_text);
            } else {
                chart = ['#fires', '#rain', '#temperature'];
            }

            if(y_text_option !== undefined) {
                d3.selectAll(y_text_option).text(y_texts[y_text]);
            }

            d3.select(chart + " g.y").transition().duration(1000).ease("sin-in-out").call(yAxis);
            d3.select('#' + graph + "_1").transition().duration(1000).ease("sin-in-out").attr("d", graph_linez(datz));
            d3.selectAll(chart + " circle").transition()
                .duration(1000)
                .ease("sin-in-out")
                .attr('cy', function(d) { return yScale(d[selected_field]); })

        }

        d3.select('#state_list').on('change', function() {
            var state_list = {
                AK: "Alaska",
                AZ: "Arizona",
                CA: "California",
                CO: "Colorado",
                ID: "Idaho",
                MT: "Montana",
                NV: "Nevada",
                NM: "New Mexico",
                WA: "Washington",
                WY: "Wyoming"
            };
            var state = d3.select(this);
            var selected_state = state.property("value");
            var filtered = data.filter(function(d) {
                return d.state == selected_state;
            });

         //   chart_update(filtered, 'all', );

            d3.select('#state_name').text(state_list[selected_state]);
            state.property('value', '');

        });

        d3.select('#fire-options').on('click', function() {
            var field = d3.event.target.id;

            var which_graph = field.split('-');
            var graph_name = which_graph[0];
            var graph_field = which_graph[1];
            var graph_text = which_graph[2];

            selected_field(graph_name, graph_field);
            chart_update(filtered, graph_name, graph_field, graph_text);
        });
    }

    window.addEventListener("resize", build_graph);
});

function line_color(graph_num) {
    if(graph_num === 0) {
        return 'firebrick';
    } else if(graph_num == 1) {
        return 'green';
    } else {
        return 'orange';
    }
}

function selected_field(graph_name, graph_field) {
    if(graph_name == 'fires') {
        localStorage.setItem('fire_field', graph_field);
    } else if(graph_name == 'precip') {
        localStorage.setItem('rain_field', graph_field);
    } else {
        localStorage.setItem('temp_field', graph_field);
    }
}