<?php
ini_set('memory_limit','-1');
include 'simple_html_dom.php';

$base_link = "http://cdfdata.fire.ca.gov/incidents/incidents_current";
$base_link_next = "http://cdfdata.fire.ca.gov/incidents/incidents_current?pc=50&cp=";
$map_base = "http://cdfdata.fire.ca.gov/incidents/incidents_details_maps?incident_id=";
$fh = fopen('cal_fire.csv', 'wb');
fputcsv($fh, array('name','size', 'lat', 'lng', 'cause', 'date', 'fuels', 'personnel', 'contained', 'location', 'events', 'weather', 'link', 'last_updated'));

for($i=0; $i<3; $i++) {
    $html = file_get_html($base_link_next . $i);
    $fire_links = $html->find('.header_td a');

    foreach($fire_links as $fire_link) {
        $data = array();
        // pre-populate the rest of info as some fields might be missing
        for($j=0; $j<13; $j++) {
            $data[$j] = '';
        }

        $full_record = 'http://cdfdata.fire.ca.gov' . $fire_link->href;
        $incident_id = clean(preg_split('/=/', $fire_link->href)[1]);
        $fire = file_get_html($full_record);
        $fire_title = $fire->find('h3.incident_h3');
        $fire_name = clean($fire_title[0]->plaintext);
        $data[0] = $fire_name;

        $fire_infos = $fire->find('table.incident_table');
        foreach($fire_infos as $fire_info) {
            $rows = $fire_info->find('tr');

            foreach($rows as $row) {
                $f = $row->find('td', 0);
                $field_name = clean($f->plaintext);

                if($field_name == 'Long/Lat:') {
                    $ll = $row->find('td', 1);
                    $lat_long = clean($ll->plaintext);

                    $latitude_longitude = preg_split('/(\/|,)/', $lat_long);

                    if(!preg_match('/^-/', clean($latitude_longitude[0]))) {
                        $lat = clean($latitude_longitude[0]);
                        $lng = clean($latitude_longitude[1]);
                    } else {
                        $lat = clean($latitude_longitude[1]);
                        $lng = clean($latitude_longitude[0]);
                    }

                    $data[2] = $lat;
                    $data[3] = $lng;
                } elseif($field_name == 'County:') {
                    $ct = $row->find('td', 1);
                    $county = clean($ct->plaintext);
                    $data[9] = $county;
                } elseif($field_name == 'Cause:') {
                    $c = $row->find('td', 1);
                    $cause = clean($c->plaintext);
                    $data[4] = $cause;
                } elseif($field_name == 'Date/Time Started:') {
                    $f = $row->find('td', 1);
                    $date_time = clean($f->plaintext);
                    $data[5] = $date_time;
                } elseif($field_name == 'Total Fire Personnel:') {
                    $p = $row->find('td', 1);
                    $personnel = clean($p->plaintext);
                    $data[7] = $personnel;
                } elseif($field_name == 'Acres Burned - Containment:'){
                    $c = $row->find('td', 1);
                    $vals = clean($c->plaintext);

                    $fields = preg_split('/-/', $vals);
                    $acres = str_replace('acres', '', $fields[0]);

                    $fire_size = clean($acres);
                    $data[1] = clean_num($fire_size);
                    $contained = preg_split('/\s+/', clean($fields[1]))[0];
                    $data[8] = $contained;
                } elseif($field_name == 'Injuries:') {
                    $e = $row->find('td', 1);
                    $events = clean($e->plaintext);
                    $data[10] .= "Injuries: $events<br />";
                } elseif($field_name == 'Structures Destroyed:') {
                    $d = $row->find('td', 1);
                    $destroyed = clean($d->plaintext);
                    $data[10] .= "Structures Destroyed: $destroyed<br />";
                } elseif($field_name == 'Structures Threatened:') {
                    $t = $row->find('td', 1);
                    $threatened = clean($t->plaintext);
                    $data[10] .= "Structures Threatened: $threatened<br />";
                } elseif($field_name == 'Last Updated:') {
                    $lu = $row->find('td', 1);
                    $last_updated = clean($lu->plaintext);
                    $data[13] = $last_updated;
                }
            }
        }

        $data[12] = $full_record;
        fputcsv($fh, $data);
        echo $fire_name . "\n";
    }
}

function clean($value) {
    $clean = strip_tags(trim($value));

    return preg_replace('/(\s+&nbsp;|&nbsp;)/', '', $clean);
}

function clean_num($value) {
    return str_replace(',', '', $value);
}