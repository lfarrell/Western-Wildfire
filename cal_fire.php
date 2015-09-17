<?php
include 'simple_html_dom.php';

$base_link = "http://cdfdata.fire.ca.gov/incidents/incidents_current";
$base_link_next = "http://cdfdata.fire.ca.gov/incidents/incidents_current?pc=50&cp=";
$map_base = "http://cdfdata.fire.ca.gov/incidents/incidents_details_maps?incident_id=";
$fh = fopen('cal_fire.csv', 'wb');

for($i=0; $i<29; $i++) {
    $html = file_get_html($base_link_next . $i);
    $fire_links = $html->find('.header_td a');

    $data = array();
    // pre-populate the rest of info as some fields might be missing
    for($i=0; $i<12; $i++) {
        $data[$i] = '';
    }

    foreach($fire_links as $fire_link) {
        $full_record = 'http://cdfdata.fire.ca.gov' . $fire_link->href;
        $incident_id = clean(preg_split('/=/', $fire_link->href)[1]);
        $fire = file_get_html($full_record);
        $fire_title = $fire->find('h3.incident_h3');
        $fire_name = clean($fire_title[0]->plaintext);
        $data[0] = $fire_name;

        $fire_infos = $fire->find('table.incident_table');
        foreach($fire_infos as $fire_info) {
            $rows = $fire_info->find('tr');

            $j = 0;
            foreach($rows as $row) {
               // if($j == 0) continue;

                $f = $row->find('td', 0);
                $field_name = clean($f->plaintext);

                if($field_name == 'Last Updated:') {
                    $l = $row->find('td', 2);
                    if(preg_match('/final/', $l->plaintext)) break;
                } elseif($field == 'Long/Lat:') {
                    $ll = $row->find('td', 1);
                    $lat_long = clean($ll->plaintext);

                    $latitude_longitude = preg_split('/,/', $lat_lng);

                    $lat = clean($latitude_longitude[1]);
                    $lng = clean($latitude_longitude[0]);

                    $data[2] = $lat;
                    $data[3] = $lng;
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

                    $fire_size = clean($fields[0]);
                    $data[1] = $fire_size;
                    $contained = preg_split('/\s+/', clean($fields[1]))[0];
                    $data[8] = $contained;
                } elseif($field == 'Evacuations:') {
                    $e = $row->find('td', 1);
                    $events = clean($e->plaintext);
                    $data[10] = $events;
                } elseif($field == 'Conditions:') {
                    $w = $row->find('td', 1);
                    $weather = clean($w->plaintext);
                    $data[11] = $weather;
                }

                $j++;
            }

            if($data[2] == '') {
                $lat_lng = file_get_html($map_base . $incident_id);
                $links = $lat_lng->find('.incident_table');

                foreach($links as $link) {
                    $maps = $link->find('tr');

                    foreach($maps as $map) {
                        $map_urls = $map->find('td');

                        foreach($map_urls as $url) {
                            $link = clean($url->href);
                            if(preg_match('/,/', $link, $matches)) {
                                $values = preg_split('/,/', $matches[0]);
                                $lat = preg_split('/@/', $values[0])[1];
                                $lng = $values[1];

                                $data[2] = $lat;
                                $data[3] = $lng;
                            }
                        }
                    }
                }
            }


        }

        fputcsv($fh, $data);
        echo $fire_name . "\n";
    }
}

function clean($value) {
    $clean = strip_tags(trim($value));

    return preg_replace('/(\s+&nbsp;|&nbsp;)/', '', $clean);
}