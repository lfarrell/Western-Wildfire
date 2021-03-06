<?php
ini_set('memory_limit','-1');
include 'simple_html_dom.php';

$base_link = "http://www.fire.ca.gov/incidents/incidents_current";
$base_link_next = "http://www.fire.ca.gov/incidents/incidents_current?pc=50&cp=";
$map_base = "http://www.fire.ca.gov/incidents/incidents_details_maps?incident_id=";
$fh = fopen('cal_fire.csv', 'wb');
fputcsv($fh, array('name','size', 'lat', 'lng', 'cause', 'date', 'fuels', 'personnel', 'contained', 'location', 'events', 'weather', 'link'));

$rss = simplexml_load_file("http://www.fire.ca.gov/rss/rss.xml");
$fire_links = array();
 foreach ($rss->channel->item as $item) {
    $fire_links[] = $item->link;
}
 foreach($fire_links as $fire_link) {
    $data = array();
    $exit = false;
    // pre-populate the rest of info as some fields might be missing
    for($i=0; $i<12; $i++) {
        $data[$i] = '';
    }
     $full_record = $fire_link;
    $incident_id = clean(preg_split('/=/', $fire_link)[1]);
    echo $incident_id . "\n";
    $fire = file_get_html($full_record);
    $fire_title = $fire->find('h3.incident_h3');
    $fire_name = clean($fire_title[0]->plaintext);
    $data[0] = $fire_name;
     $fire_infos = $fire->find('table.incident_table');
    foreach($fire_infos as $fire_info) {
        $rows = $fire_info->find('tr');
         $j = 0;
        foreach($rows as $row) {
            $f = $row->find('td', 0);
            $field_name = clean($f->plaintext);
             if($field_name == 'Last Updated:') {
                $l = $row->find('td', 2);
                if(preg_match('/final/', strtolower($l->plaintext))) {
                    $data[13] = 'final';
                }
            } elseif($field_name == 'Long/Lat:') {
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
                 if(preg_match('/CAL\sFIRE/', $acres)) {
                    $exit = true;
                }
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
         //   } elseif($field_name == 'Conditions:') {
          //      $w = $row->find('td', 1);
         //       $weather = clean($w->plaintext);
         //       $data[11] = $weather;
            }
             $j++;
        }
    }
     if($data[2] == '') {
        $lat_lng = file_get_html($map_base . $incident_id);
        $links = $lat_lng->find('.incident_table');
         foreach($links as $link) {
            $maps = $link->find('tr');
             foreach($maps as $map) {
                $map_urls = $map->find('td a');
                 foreach($map_urls as $url) {
                    $link = clean($url->href);
                    if(preg_match('/,/', $link)) {
                        $values = preg_split('/,/', $link);
                        $lat = preg_split('/@/', $values[0])[1];
                        $lng = $values[1];
                         $data[2] = $lat;
                        $data[3] = $lng;
                    }
                }
            }
        }
    }

    if($exit) {
        continue;
    }elseif(!isset($data[13])) {
        $data[12] = $full_record;
        fputcsv($fh, $data);
        echo $fire_name . "\n";
    } else {
        if(copy('cal_fire.csv', 'data/cal_fire.csv')) {
            echo "Cal Fires Updated\n";
        } else {
            echo "Cal Fires Could Not be Updated\n";
        }
        exit;
     //   echo $fire_name . '-' . $data[13] . "\n";
    }
}

function clean($value) {
    $clean = strip_tags(trim($value));

    return preg_replace('/(\s+&nbsp;|&nbsp;)/', '', $clean);
}

function clean_num($value) {
    return str_replace(',', '', $value);
}