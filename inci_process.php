<?php
date_default_timezone_set('America/New_York');
include 'simple_html_dom.php';

$site_base = 'http://inciweb.nwcg.gov';
$html = file_get_html($site_base);
$fh = fopen('fires.csv', 'wb');
fputcsv($fh, ['name','size', 'lat', 'lng', 'cause', 'date', 'fuels', 'personnel', 'contained', 'location', 'events', 'weather', 'link']);

process_page($html, $site_base, $fh);

$unique_links = range(10, 250, 10);

foreach($unique_links as $unique_link) {
    $full_link = $site_base . '/' . $unique_link . '/';


    if($html = file_get_html($full_link)) {
        process_page($html, $site_base, $fh);
    }
}
fclose($fh);

copy('fires.csv', 'data/fires.csv');

function process_page($html, $site_base, $fh = false) {
    $states = [
        'Alaska',
        'Arizona',
        'California',
        'Colorado',
        'Idaho',
        'Montana',
        'New Mexico',
        'Oregon',
        'Texas',
        'Utah',
        'Washington',
        'Wyoming'
    ];

    $fire_names = [];
    $fires = $html->find('tr');

    foreach($fires as $fire) {
        $active = $fire->find('td', 4);
        $is_active = trim($active->plaintext);

        $size = $fire->find('td', 5);
        $fire_size = str_replace(',', '', trim($size->plaintext));

        $in_west = $fire->find('td', 3);
        preg_match('/(New.Mexico|^[A-Za-z]+)/', trim($in_west->plaintext), $matches);
        $state = trim($matches[0]);

        if($is_active == 'Active' && $fire_size > 0 && in_array($state, $states)) { //
            $data = [];
            $name = $fire->find('td a', 0);
            $full_name = trim($name->plaintext);

            $data[] = $full_name . ', ' . $state;
            $data[] = $fire_size;

            $full_record = $name->href;
            $full_link = $site_base . $full_record;
            $fire_records = file_get_html($full_link);
            $record = process_fire($fire_records, $data, $full_link);

            if($fh && $record[2] != '' && !in_array($full_name, $fire_names)) {
                echo $record[0] . " added\n";
                fputcsv($fh, $record);

                $fire_names[] = $full_name . ', ' . $state;
            }
        }
    }
}

function process_fire($html, $data, $full_link) {
    $lat_lng = $html->find('#content div');

    // pre-populate the rest of info as some fields might be missing
    for($i=2; $i<12; $i++) {
        $data[$i] = '';
    }

    foreach($lat_lng as $coords) {
        $coordinates = $coords->plaintext;
        if(preg_match('/\d+\.\d+\slatitude.*?longitude/', $coordinates, $matches)) {
            $coordinate_parts = preg_split('/,/', $matches[0]);
            $lat = coordinate($coordinate_parts[0]);
            $lng = coordinate($coordinate_parts[1]);
            if(!$lat || !$lng) {
                unset($data);
                continue;
            }
            $data[2] = $lat;
            $data[3] = $lng;
        }
    }

    $details = $html->find('table.data');

    foreach($details as $detail) {
        $infos = $detail->find('tr');
        foreach($infos as $info) {
            $f = $info->find('th', 0);
            $field = trim($f->plaintext);

            if($field == 'Cause') {
                $cause = $info->find('td', 0);
                $fire_cause = trim($cause->plaintext);
                $data[4] = $fire_cause;
            } elseif($field == 'Date of Origin') {
                $date = $info->find('td', 0);
                $fire_date = trim($date->plaintext);
                $data[5] = $fire_date;
            } elseif($field == 'Fuels Involved') {
                $fuel = $info->find('td', 0);
                $fire_fuel = trim($fuel->plaintext);
                $data[6] = $fire_fuel;
            } elseif($field == 'Total Personnel') {
                $personnel = $info->find('td', 0);
                $total_personnel = trim($personnel->plaintext);
                $data[7] = $total_personnel;
            } elseif($field == 'Percent of Perimeter Contained') {
                $contained = $info->find('td', 0);
                $pct_contained = trim($contained->plaintext);
                $data[8] = $pct_contained;
            } elseif($field == 'Location') {
                $location = $info->find('td', 0);
                $total_location = trim($location->plaintext);
                $data[9] = $total_location;
            } elseif($field == 'Significant Events') {
                $events = $info->find('td', 0);
                $total_events = trim($events->plaintext);
                $data[10] = $total_events;
            } elseif($field == 'Weather Concerns') {
                $weather = $info->find('td', 0);
                $weather_notes = trim($weather->plaintext);
                $data[11] = $weather_notes;
            } else {
                continue;
            }
        }
    }

    $data[12] = $full_link;

    return $data;
}

function coordinate($data) {
    preg_match('/-?\d+\.\d+/', trim($data), $matches);
    return $matches[0];
}

// See http://stackoverflow.com/questions/8803730/check-if-link-exists
function url_exists($url) {
    $ch = @curl_init($url);
    @curl_setopt($ch, CURLOPT_HEADER, TRUE);
    @curl_setopt($ch, CURLOPT_NOBODY, TRUE);
    @curl_setopt($ch, CURLOPT_FOLLOWLOCATION, FALSE);
    @curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    $status = array();
    preg_match('/HTTP\/.* ([0-9]+) .*/', @curl_exec($ch) , $status);
    return ($status[1] == 200);
}