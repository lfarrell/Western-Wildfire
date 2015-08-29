d3.csv('data/fires.csv', function(data) {
    var map = L.map('map').setView([40.8, -120.82082], 5);

    L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
        maxZoom: 18
    }).addTo(map);

    data.sort(function(a,b) {
        return b.size - a.size;
    });

    data.forEach(function(d){
        d.latLng = [+d.lat,+d.lng];
    });

    var firesOverlay = L.d3SvgOverlay(function(sel,proj){
        var circle_size = d3.scale.linear().domain(d3.extent(data, function(d) {
            return d.size;
        })).range([2, 10]).clamp(true);

        var tip = d3.tip()
            .attr('class', 'd3-tip')
            .html(function(d) { return '<span>' + d.name + '</span>'; });
        console.log(tip)

        var fire_map = sel.selectAll('circle').data(data);

        sel.call(tip);

        fire_map.enter()
            .append('circle')
            .attr('r',function(d){ return circle_size(d.size); })
            .attr('cx',function(d){return proj.latLngToLayerPoint(d.latLng).x; })
            .attr('cy',function(d){return proj.latLngToLayerPoint(d.latLng).y; })
            .attr('stroke','black')
            .attr('stroke-width',1)
            .attr('fill', 'firebrick')
            .style('opacity', '.5')
            .on('click', function(d) {
                d.location = (d.location !== '') ? d.location : "None Reported";
                d.events = (d.events !== '') ? d.events : "None Reported";
                d.contained = (d.contained !== '') ? d.contained : "Not Reported";

                var full_record = '<h2>' + d.name + '</h2>';

                full_record += '<ul class="list-unstyled">' +
                    '<li><strong>Start Date:</strong> ' + d.date +'</li>' +
                    '<li><strong>Location:</strong> ' + d.location +'</li>' +
                    '<li><strong>Acres Burned:</strong> ' + numFormat(d.size) +'</li>' +
                    '<li><strong>Pct. Contained:</strong> ' + d.contained +'</li>' +
                    '<li><strong>Total Personnel:</strong> ' + d.personnel +'</li>' +
                    '<li><strong>Cause:</strong> ' + d.cause +'</li>' +
                    '<li><strong>Fuels:</strong> ' + d.fuels +'</li>' +
                    '<li><strong>Events:</strong> ' + d.events +'</li>'
                '</ul>'
                d3.select('#fire-data').html(full_record);
            })
            .on("mouseover", function(d) {
                tip.show;

                d3.select(this).attr('r', function(d) {
                    return circle_size(d.size) * 1.5;
                }).style('cursor', 'pointer');
            })
            .on("mouseout", function(d) {
                tip.hide;

                d3.select(this).attr('r', function(d) {
                    return circle_size(d.size);
                });
            });
    });

    firesOverlay.addTo(map);
});

function numFormat(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};