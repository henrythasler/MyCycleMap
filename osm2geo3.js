/**************************************************************************
 *                 OSM2GEO - OSM to GeoJSON converter
 * OSM to GeoJSON converter takes in a .osm XML file as input and produces
 * corresponding GeoJSON object.
 *
 * AUTHOR: P.Arunmozhi <aruntheguy@gmail.com>
 * DATE  : 26 / Nov / 2011 
 * MODIFIED: H.Thasler, 2013-03-20
 * LICENSE : WTFPL - Do What The Fuck You Want To Public License
 * LICENSE URL: http://sam.zoy.org/wtfpl/
 *
 * DEPENDENCY: OSM2GEO entirely depends on jQuery for the XML parsing and
 * DOM traversing. Make sure you include <script src="somewhere/jquery.js">
 * </script> before you include osm2geo.js
 *
 * USAGE: This script contains a single function -> geojson osm2geo(osmXML)
 * It takes in a .osm (xml) as parameter and retruns the corresponding 
 * GeoJson object.
 *
 * ***********************************************************************/

var osm2geo = function (osm) {
    "use strict";
    // Check wether the argument is a Jquery object and act accordingly
    // Assuming it as a raw server response for now
    var $xml = jQuery(osm), i, j, k, 
        geo = {
            "type": "FeatureCollection",
            "features": []
        };

    function getBounds(bounds) {
        var bbox = [];
        bbox.push(parseFloat(bounds.attr("minlon")));
        bbox.push(parseFloat(bounds.attr("minlat")));
        bbox.push(parseFloat(bounds.attr("maxlon")));
        bbox.push(parseFloat(bounds.attr("maxlat")));
        return bbox;
    }
    geo.bbox = getBounds($xml.find("bounds"));

    // Function to set props for a feature

    function setProps(element) {
        var properties = {},
            $tags = $(element).find("tag");
        $tags.each(function (index, tag) {
            properties[$(tag).attr("k")] = $(tag).attr("v");
        });
        return properties;
    }
    // Generic function to create a feature of given type

    function getFeature(element, type) {
        return {
            "geometry": {
                "type": type,
                "coordinates": []
            },
            "type": "Feature",
            "properties": setProps(element)
        };
    }
    // Ways

    // var $ways = $("way", $xml);
    // var $polynodes = $("node", $xml);
    var $ways = $xml.find("way"),
        $polynodes = $xml.find("node");
	
    for (j = 0; j < $ways.length; j++) {

        var feature = {},


        // List all the nodes
        $nodes = $ways.eq(j).find("nd");

	
// modified to convert polygons to point	
        var t = $nodes.eq(0).attr("ref");
            for (i = 0; i < $polynodes.length; i++) {
                if ($polynodes.eq(i).attr("id") === t) {
		    feature = getFeature($ways.eq(j), "Point");
		    feature.geometry.coordinates.push(parseFloat($polynodes.eq(i).attr("lon")));
		    feature.geometry.coordinates.push(parseFloat($polynodes.eq(i).attr("lat")));
                    break;
                }
            }
// end mod            
	
/*	
        // If first and last nd are same, then its a polygon
        if ($nodes.last().attr("ref") === $nodes.first().attr("ref")) {
            feature = getFeature($ways.eq(j), "Polygon");
            feature.geometry.coordinates.push([]);
        } else {
            feature = getFeature($ways.eq(j), "LineString");
        }
        for (k = 0; k < $nodes.length; k++) {
            var t = $nodes.eq(k).attr("ref");
            for (i = 0; i < $polynodes.length; i++) {
                if ($polynodes.eq(i).attr("id") === t) {
                    var cords = [parseFloat($polynodes.eq(i).attr("lon")), parseFloat($polynodes.eq(i).attr("lat"))];
                    if (feature.geometry.type === "Polygon") {
                        feature.geometry.coordinates[0].push(cords);
                    } // if just Line push inside cords[] 
                        else {
                        feature.geometry.coordinates.push(cords);
                    }
                    break;
                }
            }
        }
*/        
        // Save the LineString in the Main object
        geo.features.push(feature);
    }

    // Points (POI)
    var $points = $("node:has('tag')", $xml);
    for (j = 0; j < $points.length; j++) {
        var feature = getFeature($points.eq(j), "Point");
        feature.geometry.coordinates.push(parseFloat($points.eq(j).attr('lon')));
        feature.geometry.coordinates.push(parseFloat($points.eq(j).attr('lat')));
        // Save the point in Main object
        geo.features.push(feature);
    }
    // Finally return the GeoJSON object
    return geo;

};