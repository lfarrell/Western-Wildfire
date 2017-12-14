/**
 *  Load  map
 */
queue().defer(d3.csv,'fires.csv')
    .defer(d3.csv,'data/cal_fire.csv')
    .await(function(error, inci_web, cal_fire) {

    var data = inci_web.concat(cal_fire);
    var screen_height = document.documentElement.clientHeight;

    if(screen_height >= 550) {
        d3.selectAll('#map, #fire-info').style('height', screen_height);
    }

    /*
     * Load main map
     */
    var map = L.map('map');

    map.setView([40.8, -120.82082], 5);

    L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
        maxZoom: 18
    }).addTo(map);

    /*
     * Process data for adding circles
     */
    data.sort(function(a,b) {
        return +b.size - +a.size;
    });

    data.forEach(function(d){
        d.latLng = [+d.lat,+d.lng];
    });


    /*
     * Add initial record & sub-map to show
     */
    d3.select('#fire-data').html(record_to_show(data[0]));
    var sub_map = L.map('sub-map').setView([data[0].lat, data[0].lng], 8);

    L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
        maxZoom: 18
    }).addTo(sub_map);

    var marker = L.marker([data[0].lat, data[0].lng]).addTo(sub_map);
    marker.bindPopup(data[0].name).openPopup();

    /*
     * Show all markers on main map
     */
    var firesOverlay = L.d3SvgOverlay(function(sel,proj){
        var circle_size = d3.scale.sqrt().domain(d3.extent(data, function(d) {
            return +d.size;
        })).range([3, 15]).clamp(true);

        var fire_map = sel.selectAll('circle').data(data);

        fire_map.enter()
            .append('circle')
            .attr('r',function(d){ return circle_size(d.size); })
            .attr('cx',function(d){return proj.latLngToLayerPoint(d.latLng).x; })
            .attr('cy',function(d){return proj.latLngToLayerPoint(d.latLng).y; })
            .on('click', function(d) {
                var full_record = record_to_show(d);
                d3.select('#fire-data').html(full_record);

                var newLatLng = new L.LatLng(d.lat, d.lng);
                sub_map.panTo(newLatLng);
                marker.setLatLng(newLatLng);
                marker.bindPopup(d.name).openPopup();
            })
            .on("mouseover", function(d) {
                d3.select(this).attr('r', function(d) {
                    return circle_size(d.size) * 1.5;
                });
            })
            .on("mouseout", function(d) {
                d3.select(this).attr('r', function(d) {
                    return circle_size(d.size);
                });
            });

        var circles = document.querySelectorAll('.d3-overlay circle');

        for(var i=0; i<circles.length; i++) {
            L.tooltip({
                target: circles[i],
                map: map,
                html: data[i].name,
                showDelay: 100,
                hideDelay: 100
            });
        }
    });

    firesOverlay.addTo(map);
});

function numFormat(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function record_to_show(d) {
    d.date = (d.date !== '') ? d.date : "Not Reported";
    d.location = (d.location !== '') ? d.location : "Not Reported";
    d.contained = (d.contained !== '') ? d.contained : "Not Reported";
    d.personnel = (d.personnel !== '') ? d.personnel: "Not Reported";
    d.cause = (d.cause !== '') ? d.cause : "Not Reported";
    d.fuels = (d.fuels !== '') ? d.fuels : "Not Reported";
    d.events = (d.events !== '') ? d.events : "None Reported";
    d.weather = (d.weather !== '') ? d.weather : "Not Reported";

    var full_record = '<h2>' + d.name + '</h2>';

    full_record += '<ul class="list-unstyled">' +
        '<li><strong>Start Date:</strong> ' + d.date +'</li>' +
        '<li><strong>Location:</strong> ' + d.location +'</li>' +
        '<li><strong>Acres Burned:</strong> ' + numFormat(d.size) +'</li>' +
        '<li><strong>Pct. Contained:</strong> ' + d.contained +'</li>' +
        '<li><strong>Total Personnel:</strong> ' + d.personnel +'</li>' +
        '<li><strong>Cause:</strong> ' + d.cause +'</li>' +
        '<li><strong>Fuels:</strong> ' + d.fuels +'</li>' +
        '<li><strong>Events:</strong> ' + d.events +'</li>' +
        '<li><strong>Weather:</strong> ' + d.weather +'</li>' +
        '<li><a target="_blank" href="' + d.link +'">More Information</a></li>'
    '</ul>';

    return full_record;
}