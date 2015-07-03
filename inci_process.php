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
fputcsv($fh, ['name', 'lat', 'lng']);

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

        $in_west = $fire->find('td', 3);
        preg_match('/(New.Mexico|^[A-Za-z]+)/', trim($in_west->plaintext), $matches);
        $state = trim($matches[0]);

        if($is_active == 'Active' && in_array($state, $states)) {
            $data = [];
            $name = $fire->find('td a', 0);
            $full_name = trim($name->plaintext);
            $full_record = $name->href;

            $fire_records = file_get_html($site_base . $full_record);
            echo $full_name . "\n";
            $data[] = $full_name;
            $record = process_fire($fire_records, $data);
            if($fh) {
                fputcsv($fh, $record);
            }
        }
    }
}

function process_fire($html, $data) {
    $lat_lng = $html->find('#content div');

    foreach($lat_lng as $coords) {
        $coordinates = $coords->plaintext;
        if(preg_match('/\d+\.\d+\slatitude.*?longitude/', $coordinates, $matches)) {
            $coordinate_parts = preg_split('/,/', $matches[0]);
            $lat = coordinate($coordinate_parts[0]);
            $lng = coordinate($coordinate_parts[1]);
            $data[] = $lat;
            $data[] = $lng;
            echo $lat . ',' . $lng . "\n";
        }
    }

    return $data;
}

function coordinate($data) {
    preg_match('/-?\d+\.\d+/', trim($data), $matches);
    return $matches[0];
}