<?php
date_default_timezone_set('America/New_York');
include 'simple_html_dom.php';

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

$site_base = 'http://inciweb.nwcg.gov';
$html = file_get_html($site_base);
$fh = fopen('fires.csv', 'wb');
fputcsv($fh, ['name','size', 'lat', 'lng', 'cause', 'date', 'fuels', 'personnel', 'contained', 'location', 'events']);

process_page($html, $states, $site_base, $fh);

$all_links = $html->find('.tab_nav a');
$links = [];

foreach($all_links as $link) {
    $links[] = trim($link->href);
}

$unique_links = array_unique($links);
foreach($unique_links as $unique_link) {
    $html = file_get_html($site_base . $unique_link);
    process_page($html, $states, $site_base, $fh);
}
fclose($fh);

function process_page($html, $states, $site_base, $fh = false) {
    $fires = $html->find('tr');

    foreach($fires as $fire) {
        $active = $fire->find('td', 4);
        $is_active = trim($active->plaintext);

        $size = $fire->find('td', 5);
        $fire_size = str_replace(',', '', trim($size->plaintext));

        $in_west = $fire->find('td', 3);
        preg_match('/(New.Mexico|^[A-Za-z]+)/', trim($in_west->plaintext), $matches);
        $state = trim($matches[0]);

        if($is_active == 'Active' && $fire_size > 0 && in_array($state, $states)) {
            $data = [];
            $name = $fire->find('td a', 0);
            $full_name = trim($name->plaintext);

            $data[] = $full_name;
            $data[] = $fire_size;

            $full_record = $name->href;
            $fire_records = file_get_html($site_base . $full_record);

            $record = process_fire($fire_records, $data);
            if($fh && $record[2] != '') {
                echo $record[0] . " added\n";
                fputcsv($fh, $record);
            }
        }
    }
}

function process_fire($html, $data) {
    $lat_lng = $html->find('#content div');

    // pre-populate the rest of info as some fields might be missing
    for($i=2; $i<10; $i++) {
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
            }elseif($field == 'Significant Events') {
                $events = $info->find('td', 0);
                $total_events = trim($events->plaintext);
                $data[10] = $total_events;
            } else {
                continue;
            }
        }
    }


    return $data;
}

function coordinate($data) {
    preg_match('/-?\d+\.\d+/', trim($data), $matches);
    return $matches[0];
}