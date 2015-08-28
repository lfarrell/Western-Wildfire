d3.csv('data/fires.csv', function(data) {
    var map = L.map('map').setView([41.3058, -115.82082], 5);

    L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
        maxZoom: 18
    }).addTo(map);

    data.sort(function(a,b) {
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

    data.forEach(function(d){
        d.latLng = [+d.lat,+d.lng];
    });

    var firesOverlay = L.d3SvgOverlay(function(sel,proj){
        var circle_size = d3.scale.linear().domain(d3.extent(data, function(d) {
            return d.size;
        })).range([2, 15]).clamp(true);

        var fire_map = sel.selectAll('circle').data(data);

        fire_map.enter()
            .append('circle')
            .attr('r',function(d){ console.log(circle_size(d.size)); return circle_size(d.size); })
            .attr('cx',function(d){return proj.latLngToLayerPoint(d.latLng).x; })
            .attr('cy',function(d){return proj.latLngToLayerPoint(d.latLng).y; })
            .attr('stroke','black')
            .attr('stroke-width',1)
            .attr('fill', 'firebrick')
            .style('opacity', '.5')
            .on('click', function(d) {

            });
    });

    firesOverlay.addTo(map);
});