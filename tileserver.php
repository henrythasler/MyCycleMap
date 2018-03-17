<?php

// image-type can be 'png' or 'jpg'
$img_type = 'png';

$img_notfound = 'img/notfound.png';
$img_dberror = 'img/dberror.png';

$options = array(
    'options' => array(
                      'min_range' => "0",
                      'max_range' => "1000000",
                      
                      )
);

function senderror($filename)
{
    $fp = fopen($filename, 'rb');
    header("Content-Type: image/png");
    header("Content-Length: " . filesize($filename));
    fpassthru($fp);        
} 


// main part
try{
    // filter input strings to prevent db-injection hacks
    $x = (filter_var($_GET['x'], FILTER_VALIDATE_INT, $options)) ? $_GET['x'] : 0;
    $y = (filter_var($_GET['y'], FILTER_VALIDATE_INT, $options)) ? $_GET['y'] : 0;
    $zoom = (filter_var($_GET['z'], FILTER_VALIDATE_INT, $options)) ? $_GET['z'] : 0;

    $url = 'http://89.163.224.201:8080/'.$_GET['layer'].'/'.$zoom.'/'.$x.'/'.$y.'.'.$img_type;
    
    $ch = curl_init(str_replace ( ' ', '%20', $url));    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $result = curl_exec($ch);
    curl_close($ch);    

    if($result==false){
        // db does not contain specified tile
        senderror($img_notfound);
    }
    else{
        // return tile data
        header('Content-type: image/'.$img_type);
        header("Content-Length: " . strlen($result));
        echo $result;
    }
}
    
catch(Exception $e){
    senderror($img_dberror);
} 
?>
