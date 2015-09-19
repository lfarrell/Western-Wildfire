<?php
$state_list = array(
    'AK' => 50,
    'AZ' => 2,
    'CA' => 4,
    'CO' => 5,
    'ID' => 10,
    'MT' => 24,
    'NV' => 26,
    'NM' => 29,
    'OR' => 35,
    'UT' => 42,
    'WA' => 45,
    'WY' => 48
);

foreach($state_list as $state => $number) {
    $links = [
        'temp' => "http://www.ncdc.noaa.gov/cag/time-series/us/$number/00/tavg/ytd/12/2002-2014.csv?base_prd=true&firstbaseyear=1925&lastbaseyear=2000",
        'precip' => "http://www.ncdc.noaa.gov/cag/time-series/us/$number/00/pcp/ytd/12/2002-2014.csv?base_prd=true&firstbaseyear=1925&lastbaseyear=2000"
    ];
    foreach($links as $key => $link) {
        $ch = curl_init($link);
        $fp = fopen("data/weather/$state" . '_' . "$key.csv", "wb");

        curl_setopt($ch, CURLOPT_FILE, $fp);
        curl_setopt($ch, CURLOPT_HEADER, 0);

        curl_exec($ch);
        curl_close($ch);
        fclose($fp);
    }
    echo $state . " processed\n";
}

$files = scandir('data/weather');

foreach($files as $file) {
    if(!is_dir($file)) {
        $fh = fopen("data/cleaned_weather/$file", "wb");
        if (($handle = fopen("data/weather/$file", "r")) !== FALSE) {
            $i = 0;
            while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                if($i > 3) {
                    $data[0] = substr($data[0], 0, 4);
                }

                if($i > 2) {
                    fputcsv($fh, $data);
                }

                $i++;
            }
            fclose($handle);
        }
        fclose($fh);
    }
}

$clean_files_rain = scandir('data/cleaned_weather/rain');
$clean_files_temp = scandir('data/cleaned_weather/temp');


$fc = fopen("data/full_data.csv", "wb");
fputcsv($fc, array('fires','acres','state','year', 'precip', 'precip_anomoly', 'temp', 'temp_anomoly'));
merge_all($fc, $clean_files_rain, 'rain');
fclose($fc);

$fq = fopen("data/full_data_all.csv", "wb");
fputcsv($fq, array('fires','acres','state','year', 'precip', 'precip_anomoly', 'temp', 'temp_anomoly'));
merge_all($fq, $clean_files_temp, 'temp');
fclose($fq);

unlink('data/full_data.csv');


function merge_all($fc, $clean_files, $type) {
    $main_file = ($type == 'rain') ? 'fire_data_all.csv' : 'full_data.csv';
    foreach($clean_files as $file) {
        if(!is_dir($file)) {
            if (($handle = fopen("data/cleaned_weather/$type/$file", "r")) !== FALSE) {
                while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                    if (($handle2 = fopen("data/$main_file", "r")) !== FALSE) {
                        $state = substr($file, 0, 2);
                        while (($data2 = fgetcsv($handle2, 1000, ",")) !== FALSE) {
                            if($data[0] == $data2[3] && $state == $data2[2]) {
                                if(preg_match('/precip/', $file)) {
                                    $data2[4] = $data[1];
                                    $data2[5] = $data[2];
                                } else {
                                    $data2[6] = $data[1];
                                    $data2[7] = $data[2];
                                }
                                fputcsv($fc, $data2);
                            }
                        }
                        fclose($handle2);
                    }
                }
                fclose($handle);
            }
        }
    }
}