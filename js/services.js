angular.module('westernWildfire').service('StatsService', function() {
    /**
     * Add , to make numbers easier to read
     * @param number
     * @returns {string}
     */
    this.numFormat = function(number) {
        return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
});

angular.module('westernWildfire').service('LoadService', function() {
    this.data_load = function($scope, map_path, data_path) {
        $scope.graphloading = true;
        $scope.graphloaded = false;

        d3.json(map_path, function(map_data) {
            $scope.map_data = map_data;

            d3.csv(data_path, function(data) {
                $scope.fires = data;
                $scope.graphloading = false;
                $scope.graphloaded = true;
                $scope.$apply();
            });
            $scope.$apply();
        });
    };
});

angular.module('westernWildfire').service('tipService', function() {
    this.tipDiv = function() {
        var tip = document.querySelectorAll(".tooltip"); // check that there's not already a tip div

        if(tip.length) {
            return d3.select(".tooltip");
        }

        return d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

    };

    this.tipShow = function(tip, text) {
        tip.transition()
            .duration(200)
            .style("opacity", .9);

        tip.html(text)
            .style("top", (d3.event.pageY-38)+"px")
            .style("left", (d3.event.pageX+38)+"px");

    };

    this.tipHide = function(tip) {
        tip.transition()
            .duration(500)
            .style("opacity", 0);
    };
});

angular.module('westernWildfire').service('chartService', function() {
    this.chart = function(selector, graph_height, graph_width, margin, xAxis, yAxis, y_text) {
        var chart = d3.select(selector).append("svg")
            .attr("width", graph_width + margin.left + margin.right)
            .attr("height", graph_height + margin.top + margin.bottom);

        chart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate("+ margin.left + "," + (graph_height + margin.top) + ")")
            .call(xAxis);

        chart.append("text")
            .attr("x", graph_width / 1.5)
            .attr("y", graph_height + margin.bottom)
            .style("text-anchor", "zs")
            .text("Date");

        chart.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(yAxis);

        chart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -graph_height/2)
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text(y_text);

        return chart;
    };

    this.legend = function(selector, is_map, check) {
        var compare = document.querySelectorAll('#compare_legend .legend');
        if(check && compare.length) return;

        var keys, colors, width;
        if(is_map) {
            keys = ['75%+', '50%+', 'Less than 50%', 'Current Level Unavailable'];
            colors = ['green', '#FCE883', 'red', 'gray'];
            width = 450;
        } else {
            keys = ['Capacity', 'Avg Levels', 'Current Storage'];
            colors = ['green', '#FCE883', 'steelblue'];
            width = 300;
        }

        var legend = d3.select(selector)
            .append("svg")
            .attr("width", width)
            .attr("height", 55)
            .attr("class", "legend");

        var j = 0;

        legend.selectAll('g').data(keys)
            .enter()
            .append('g').attr("width",width)
            .each(function(d, i) {
                var g = d3.select(this);

                g.append("rect")
                    .attr("x", j)
                    .attr("y", 15)
                    .attr("width", 10)
                    .attr("height", 10)
                    .style("fill", colors[i]);

                g.append("text")
                    .attr("x", j + 15)
                    .attr("y", 25)
                    .attr("height",30)
                    .attr("width", d.length * 50)
                    .text(d);

                j += (d.length * 5) + 40;
            });
    };

    this.resColors = function(d) {
        if(d >= 75) {
            return 'green';
        } else if (d >= 50) {
            return '#FCE883';
        } else if (d < 50) {
            return 'red';
        } else {
            return 'lightgray';
        }
    };

    this.graphPadding = function(formatting) {
        var graph_padding = moment().add(8, 'month');
        var date_string = (formatting !== undefined) ? 'MM/YY' : 'MM/YYYY';

        return graph_padding.format(date_string);
    };

    this.rotate = function() {
        d3.selectAll("g.x text").attr('transform', "rotate(35)")
            .attr('dx', 27)
            .attr('dy', 10);
    };

    this.displayMonth = function() {
        var current_date = moment().subtract(1, 'month');
        var today = current_date.format('MM/YYYY');
        return current_date.format('MMMM YYYY');
    };

    this.mapScale = function(data, state) {
        var vals;

        if(state === 'CA') {
            vals = [2, 7];
        } else {
            vals = [3, 8];
        }
        return d3.scale.linear()
            .domain(d3.extent(data, function(d) { return d.size * .2; }))
            .range(vals);
    };
});