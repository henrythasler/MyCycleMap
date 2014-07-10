<?php
header('Content-type: application/xml');
  $url = 'http://overpass-api.de/api/interpreter?data='.$_GET['q'];
  // $url = 'http://overpass.osm.rambler.ru/cgi/interpreter?data='.$_GET['q'];
 // echo $url;
  $ch = curl_init(str_replace ( ' ', '%20', $url));
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  $output = curl_exec($ch);
  curl_close($ch);
  echo $output;
?>