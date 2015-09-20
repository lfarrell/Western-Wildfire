/**
 *
 * @param config
 * @constructor
 */
function Fires(config) {
    this.config = config;
}

Fires.prototype.constructor = Fires;

/**
 * Create axis scale
 * @param scale
 * @param orientation
 * @returns {*}
 */
Fires.prototype.createAxis = function(scale, orientation) {
    return d3.svg.axis()
        .scale(scale)
        .orient(orientation);
};

/**
 * Draw axis
 * @param svg
 * @param axis
 * @param side
 * @returns {*}
 */
Fires.prototype.writeAxis = function(svg, axis, side) {
    var c, t;

    if(side === 'bottom') {
        c = "x axis";
        t = "translate("+ this.config.margin.left + "," + (this.config.height + this.config.margin.top) + ")";
    } else {
        c = "y axis";
        t = "translate(" + this.config.margin.left + "," + this.config.margin.top + ")";
    }

    svg.append("g")
        .attr("class", c)
        .attr("transform", t)
        .call(axis);

    return svg;
};

/**
 * Axis text
 * @param svg
 * @param anchor
 * @param text
 * @param rotate
 * @param dy
 * @returns {XMLList|string|string|string|string|string|string}
 */
Fires.prototype.axisText = function(svg, anchor, text, rotate, dy) {
    var texts = svg.append("text")
        .attr("x", this.config.x)
        .attr("y", this.config.y)
        .attr("dy", ".71em")
        .style("text-anchor", anchor)
        .text(text);

    if(rotate) {
        texts.attr("transform", "rotate(-90)")
    }

    if(dy) {
        texts.attr("dy", ".71em");
    }

    return texts;
};