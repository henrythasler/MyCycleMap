<?php

// image-type can be 'png' or 'jpg'
$img_type = 'jpg';

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
    $db = new SQLite3('tiledb/MyCycleMap-'.$img_type.'.sqlitedb');

    // filter input strings to prevent db-injection hacks
    $x = (filter_var($_GET['x'], FILTER_VALIDATE_INT, $options)) ? $_GET['x'] : 0;
    $y = (filter_var($_GET['y'], FILTER_VALIDATE_INT, $options)) ? $_GET['y'] : 0;
    $zoom = (filter_var($_GET['z'], FILTER_VALIDATE_INT, $options)) ? (17-$_GET['z']) : 0;
    
    
    $result = $db->querySingle('SELECT image FROM tiles WHERE x='.$x.' AND y='.$y.' AND z='.$zoom);

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
    $db->close();
}
    
catch(Exception $e){
    senderror($img_dberror);
}    
?>
