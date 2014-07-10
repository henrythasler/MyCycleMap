String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) { 
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
};


// http://www.javascriptkit.com/jsref/regexp.shtml
// based on http://stackoverflow.com/a/3890175
function makeLink(inputText) {
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(?:^|[^\/])(www\.[\S]+(?:\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '<a href="http://$1" target="_blank">$1</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /([\w-.]+@[\w-]+\.[a-z]{2,6})/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}



function getTrackProps(points)
{
var 	props = {},
		distance = 0,
		fix=0,
		unit='m';
		
	for(x=1;x<points.length;x++)
		distance += points[x-1].distanceTo( points[x]);
		
	if(distance>50000) {distance/=1000; unit='km';}
	else if(distance>5000) {distance/=1000; unit='km'; fix=2;}

	props.count = points.length;
	props.dist = distance.toFixed(fix);
	props.unit = unit;
	return props;
}	

// from: http://tutorialzine.com/2011/05/generating-files-javascript-php/
(function($){

	// Creating a jQuery plugin:

	$.generateFile = function(options){

		options = options || {};

		if(!options.script || !options.filename || !options.content){
			throw new Error("Please enter all the required config options!");
		}

		// Creating a 1 by 1 px invisible iframe:

		var iframe = $('<iframe>',{
			width:1,
			height:1,
			frameborder:0,
			css:{
				display:'none'
			}
		}).appendTo('body');

		var formHTML = '<form action="" method="post">'+
			'<input type="hidden" name="filename" />'+
			'<input type="hidden" name="content" />'+
			'</form>';

		// Giving IE a chance to build the DOM in
		// the iframe with a short timeout:

		setTimeout(function(){

			// The body element of the iframe document:

			var body = (iframe.prop('contentDocument') !== undefined) ?
							iframe.prop('contentDocument').body :
							iframe.prop('document').body;	// IE

			body = $(body);

			// Adding the form to the body:
			body.html(formHTML);

			var form = body.find('form');

			form.attr('action',options.script);
			form.find('input[name=filename]').val(options.filename);
			form.find('input[name=content]').val(options.content);

			// Submitting the form to download.php. This will
			// cause the file download dialog box to appear.

			form.submit();
		},50);
	};

})(jQuery);


// Parse URL Queries Method from http://www.kevinleary.net/get-url-parameters-javascript-jquery/
(function($){
	$.getQuery = function( query ) {
		query = query.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
		var expr = "[\\?&]"+query+"=([^&#]*)";
		var regex = new RegExp( expr );
		var results = regex.exec( window.location.href );
		if( results !== null ) {
			return results[1];
			return decodeURIComponent(results[1].replace(/\+/g, " "));
		} else {
			return false;
		}
	};
})(jQuery);


// main function
$(document).ready(function() 
{
	var CurrentLayer;
	var xhr; // holds the last ajax request
	
	var Queries = {
		restaurant:'node["amenity"~"restaurant|fast_food"]({0});out body 200;node["tourism"="alpine_hut"]({0});out body 200;',
		// restaurant_way:'node["amenity"~"restaurant|fast_food"]({0});out body;way["amenity"~"restaurant|fast_food"]({0});foreach((._;>;);out body;);node["tourism"="alpine_hut"]({0});out body;way["tourism"="alpine_hut"]({0});foreach((._;>;);out body;);',
		restaurant_way:'(way["amenity"~"restaurant|fast_food"]({0});node(w););out body;(way["tourism"="alpine_hut"]({0});node(w););out body;node["amenity"~"restaurant|fast_food"]({0});out body 50;node["tourism"="alpine_hut"]({0});out body 50;',
		hotel:'node["tourism"="hotel"]({0});out body 100;',
		hotel_way:'(way["tourism"="hotel"]({0});node(w););out body;node["tourism"="hotel"]({0});out body 100;',
		bar:'node["amenity"="pub"]({0});out body 50;node["amenity"~"bar|biergarten"]({0});out body 50;',
		bar_way:'(way["amenity"~"bar|biergarten"]({0});node(w););out body;(way["amenity"="pub"]({0});node(w););out body;node["amenity"~"bar|biergarten"]({0});out body 50;node["amenity"="pub"]({0});out body 50;',
		cycling:'node["shop"="bicycle"]({0});out body 200;',
		cycling_way:'(way["shop"="bicycle"]({0});node(w););out body;node["shop"="bicycle"]({0});out body 100;',
		supermarket:'node["shop"="supermarket"]({0});out body 200;',
		supermarket_way:'(way["shop"="supermarket"]({0});node(w););out body;node["shop"="supermarket"]({0});out body 100;'
		};
		
	var AIcon = L.icon({
		iconUrl: 'img/a-marker.png',
		iconAnchor: [12, 40],
		shadowUrl: 'img/marker-shadow.png',
		iconAnchor: [13, 40]
	});

	var BIcon = L.icon({
		iconUrl: 'img/b-marker.png',
		iconAnchor: [12, 40],
		shadowUrl: 'img/marker-shadow.png',
		iconAnchor: [13, 40]
	});

	var RestaurantIcon = L.icon({
		iconUrl: 'img/restaurant.png',
		iconSize: [32, 37],
		iconAnchor: [16, 37],
		popupAnchor: [0, -28]
	});	
	
	var HotelIcon = L.icon({
		iconUrl: 'img/lodging.png',
		iconSize: [32, 37],
		iconAnchor: [16, 37],
		popupAnchor: [0, -28]
	});	

	var BarIcon = L.icon({
		iconUrl: 'img/bar.png',
		iconSize: [32, 37],
		iconAnchor: [16, 37],
		popupAnchor: [0, -28]
	});	
	
	var CyclingIcon = L.icon({
		iconUrl: 'img/cycling.png',
		iconSize: [32, 37],
		iconAnchor: [16, 37],
		popupAnchor: [0, -28]
	});	
	
	var ShopIcon = L.icon({
		iconUrl: 'img/supermarket.png',
		iconSize: [32, 37],
		iconAnchor: [16, 37],
		popupAnchor: [0, -28]
	});
	
	var lat  = $.getQuery('lat'),
	    lng  = $.getQuery('lng'),
	    zoom = $.getQuery('zoom');

	var EmptyLayer = L.geoJson(0, {});
	
	var HotelMarker = L.geoJson(0, {
		onEachFeature: onEachFeature,
		query: {low: Queries.hotel, high: Queries.hotel_way},
		pointToLayer: function (feature, latlng) {
			return L.marker(latlng, {icon: HotelIcon, riseOnHover:true});
		}
	});
		
	var RestaurantMarker = L.geoJson(0, {
		onEachFeature: onEachFeature,
		query: {low: Queries.restaurant, high: Queries.restaurant_way},
		pointToLayer: function (feature, latlng) {
			return L.marker(latlng, {icon: RestaurantIcon, riseOnHover:true});
		}
	});

	var BarMarker = L.geoJson(0, {
		onEachFeature: onEachFeature,
		query: {low: Queries.bar, high: Queries.bar_way},
		pointToLayer: function (feature, latlng) {
			return L.marker(latlng, {icon: BarIcon, riseOnHover:true});
		}
	});

	var CyclingMarker = L.geoJson(0, {
		onEachFeature: onEachFeature,
		query: {low: Queries.cycling, high: Queries.cycling_way},
		pointToLayer: function (feature, latlng) {
			return L.marker(latlng, {icon: CyclingIcon, riseOnHover:true});
		}
	});

	var ShopMarker = L.geoJson(0, {
		onEachFeature: onEachFeature,
		query: {low: Queries.supermarket, high: Queries.supermarket_way},
		pointToLayer: function (feature, latlng) {
			return L.marker(latlng, {icon: ShopIcon, riseOnHover:true});
		}
	});
    

// sqlite-based	php tileserver
	var funcLayer = new L.tileLayer('tileserver.php?z={z}&x={x}&y={y}', {
		minZoom: 1,
		maxZoom: 18,
		maxNativeZoom: 15,
		continuousWorld: false,
		noWrap: true,
		attribution: 'v'+L.version+',  Map data &copy; OpenStreetMap, Renderstyle &copy; Henry Thasler'
		});


/*
// file-based tiles
	var funcLayer = new L.tileLayer('tiles/{z}/{x}/{y}.png', {
		minZoom: 1,
		maxZoom: 18,
		maxNativeZoom: 15,
		continuousWorld: false,
		noWrap: true,
		attribution: 'v'+L.version+',  Map data &copy; OpenStreetMap, Renderstyle &copy; Henry Thasler'
		});
*/

/*
	  var funcLayer = new L.TileLayer.Functional(function (view) {
	      var url = 'tiles/{z}/{x}/{y}.png'
	        .replace('{z}', view.zoom)
	        .replace('{x}', view.tile.column)
	        .replace('{y}', view.tile.row);
	
		url = 'tileserver.php';
	      return url;
	    }, {
		minZoom: 1,
		maxZoom: 18,
		maxNativeZoom: 15,
		continuousWorld: false,
		noWrap: true,
		attribution: 'v'+L.version+',  Map data &copy; OpenStreetMap, Renderstyle &copy; Henry Thasler'
	    });	
*/		
	
	var map = L.map('map', {
		center: [48.24, 11.03], 
		zoom: 12,
		layers: [funcLayer]
		});

	if(lat || lng || zoom)
		map.setView(new L.LatLng( (lat?lat:48.24), (lng?lng:11.03) ), (zoom?zoom:12));
	else 
		map.locate({setView: true, maxZoom: 16});


// Add layer control
	var overlayMaps = {
		"[none]": EmptyLayer,
		"Restaurant": RestaurantMarker,
		"Hotel": HotelMarker,
		"Bar": BarMarker,
		"Bikeshop": CyclingMarker,
		"Supermarket": ShopMarker
	};	
	L.control.layers(overlayMaps, 0, {collapsed: false}).addTo(map);

	
// Add Route polyline	
	var Route = L.polyline([], {color: 'red', opacity: 0.5, clickable:false, editable:true}).addTo(map);


// Add Track Profile Window	
	//all used options are the default values
	var Profile = L.control.elevation({
	    position: "bottomleft",
	    theme: "steelblue-theme", //default: lime-theme
	    width: 600,
	    height: 125,
	    margins: {
		top: 10,
		right: 20,
		bottom: 30,
		left: 50
	    },
	    useHeightIndicator: true, //if false a marker is drawn at map position
	    interpolation: "linear", //see https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-area_interpolate
	    hoverNumber: {
		decimalsX: 3, //decimals on distance (always in km)
		decimalsY: 0, //deciamls on height (always in m)
		formatter: undefined //custom formatter function may be injected
	    },
	    xTicks: undefined, //number of ticks in x axis, calculated by default according to width
	    yTicks: undefined, //number of ticks on y axis, calculated by default according to height
	    collapsed: false    //collapsed mode, show chart on click or mouseover
	});
	Profile.addTo(map);
	Profile._collapse();
	
	var GPXData = new L.GPX(null, {
		async: true,
		marker_options: {
		      startIconUrl: 'img/a-marker.png',
		      endIconUrl: 'img/b-marker.png',
		      shadowUrl: 'img/marker-shadow.png',
		}
	});
				
	GPXData.on('loaded', function(e) {
		map.fitBounds(e.target.getBounds());
	});
				
	GPXData.on("addline",function(e){
		Profile.clear();  
		Profile._expand();
		Profile.addData(e.line);
	});
	
	GPXData.on("addroute",function(e){
		Route.editing.disable();
		var arr = [];
		for (ele in e.c) arr.push(e.c[ele]);
		Route.setLatLngs(arr);
		Route.editing.enable();
		map.fitBounds(Route.getBounds());
		info.update(getTrackProps(arr));
	});
	
	GPXData.addTo(map);

	
// Add Track polyline	
	var track = L.polyline([], {color: 'magenta', opacity: 0.5}).addTo(map);

// Add frame for track profile canvas
	var profile = L.control({position:'bottomleft'});
	profile.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
		L.DomEvent.addListener(this._div, 'click', function(e){
			L.DomEvent.stopPropagation(e);
			}, this);

		this._closeButton = L.DomUtil.create('a', 'leaflet-popup-close-button', this._div);
		this._closeButton.href = '#close';
		this._closeButton.innerHTML = '&#215;';
		
		L.DomEvent.addListener(this._closeButton, 'click', function(e){
			L.DomEvent.stopPropagation(e);
			profile.removeFrom(map);
			map.removeLayer(StartMarker);
			map.removeLayer(EndMarker);
			map.removeLayer(track);
			}, this);

		this._canvas = L.DomUtil.create('canvas', 'ProfileCanvas', this._div);
		this._canvas.id = 'myCanvas';
		this._canvas.innerHTML = 'Your browser does not support the canvas element.';
		return this._div;
		};


// Add Marker for Track	
	var StartMarker = L.marker([0,0], {icon: AIcon}).addTo(map).bindPopup("Start");
	var EndMarker = L.marker([0,0], {icon: BIcon}).addTo(map).bindPopup("End");
	
// Add route info	
	var info = L.control();
	info.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
		L.DomEvent.addListener(this._div, 'click', function(e){
			L.DomEvent.stopPropagation(e);
			}, this);
		this._text = L.DomUtil.create('div', '', this._div);
		// this._canvas = L.DomUtil.create('canvas', '', this._div);
		// this._canvas.id = 'routeCanvas';
		// this._canvas.innerHTML = 'Your browser does not support the canvas element.';
		this.update();
		return this._div;
	};
	// method that we will use to update the control based on feature properties passed
	info.update = function (props) {
		if (typeof(props) != "undefined")
			{
			this._text.innerHTML = '<h4>Route Info</h4>' +  (props ?
				'Points: ' + props.count + '<br />Length: ' + props.dist	+ ' ' + props.unit: '');
			// var ctx=document.getElementById("routeCanvas").getContext("2d");
			// ctx.strokeStyle="#999999";
			// ctx.strokeRect(0,0,400,100);				
			}
		else this._text.innerHTML = '<h4>Route Info</h4>Points: 0<br />Length: 0 m';

	};
	info.addTo(map);

// Add permalink and position info	
	var permalink = L.control({position: 'topright'});
	permalink.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
		this._link = L.DomUtil.create('a', 'permalink', this._div);
		this.update();
		return this._div;
	};
	permalink.update = function (props) {
		if (typeof(props) != "undefined")
			{
			this._link.innerHTML = '<a href="?lng='+props.lng+'&lat='+props.lat+'&zoom='+props.zoom+'">'+(props?props.lng.toFixed(2) + '/' + props.lat.toFixed(2):'?') + '</a>';
			}
	};
	permalink.addTo(map);
	permalink.update({lat:map.getCenter().lat, lng:map.getCenter().lng, zoom:map.getZoom()});	

// Add Toolbox	
	var tools = L.control({position: 'topleft'});
	tools.onAdd = function (map) {
		this._div = L.DomUtil.create('div', 'leaflet-control-zoom leaflet-bar'); // create a div with a class "info"

		// download button
		var download = L.DomUtil.create('a', 'download leaflet-bar-part-top', this._div);
		download.href = '#';
		download.title = 'download current route as GPX';
		L.DomEvent.addListener(download, 'click', function(e){
			L.DomEvent.stopPropagation(e);
			DownloadRoute();
			}, this);

		// new route button
		var new_route = L.DomUtil.create('a', 'new', this._div);
		new_route.href = '#';
		new_route.title = 'create new route';
		L.DomEvent.addListener(new_route, 'click', function(e){
			L.DomEvent.stopPropagation(e);
			Route.editing.disable();
			Route.spliceLatLngs(0);
			Route.editing.enable();
			info.update(getTrackProps(Route.getLatLngs()));
			}, this);

		// open button
		var opentrack = L.DomUtil.create('a', 'open leaflet-bar-part-bottom', this._div);
		opentrack.href = '#';
		opentrack.title = 'open existing route on server';
		L.DomEvent.addListener(opentrack, 'click', function(e){
			L.DomEvent.stopPropagation(e);
			if($('#fileframe').length == 0)
				OpenRoute(opentrack, this._div);
			}, this);
			
		return this._div;
	};
	tools.addTo(map);
	
// Setup the dnd listeners.
	var dropZone = document.getElementById('map');
	dropZone.addEventListener('dragover', handleDragOver, false);
	dropZone.addEventListener('drop', handleFileSelect, false);	

	Route.on('edit', function(e)
	{
	  info.update(getTrackProps(Route.getLatLngs()));
	});
	
	map.on('drag' , function()
	{
	  permalink.update({lng:map.getCenter().lng, lat:map.getCenter().lat, zoom:map.getZoom()});
	});

	map.on('dragend' , function()
	{
	  LoadOSM(CurrentLayer);
	});

	map.on('zoomend' , function()
	{
	  permalink.update({lng:map.getCenter().lng, lat:map.getCenter().lat, zoom:map.getZoom()});
	  LoadOSM(CurrentLayer);
	});
	
	map.on('baselayerchange', function(e) 
	{
	  CurrentLayer = e.layer;
	  LoadOSM(CurrentLayer);
	});
	
	map.on('click', function(e) 
	{
	  Route.editing.disable();
	  Route.addLatLng(e.latlng);
	  Route.editing.enable();
	  info.update(getTrackProps(Route.getLatLngs()));
	  // map.panTo(e.latlng);
	});

	map.on('locationfound', onLocationFound);
	map.on('locationerror', onLocationError);
	
	
// geolocation handler	
	function onLocationFound(e) {
		var radius = e.accuracy / 2;

		L.marker(e.latlng).addTo(map)
			.bindPopup("You are within " + radius + " meters from this point").openPopup().on('click', function(){map.removeLayer(this);});
		L.circle(e.latlng, radius).addTo(map).on('click', function(){map.removeLayer(this);});
	}

	function onLocationError(e) {
		alert(e.message);
	}
		
	function LoadOSM(layer)
	{
		if(!layer || !layer.options.query) return;
		var lat1 = map.getBounds().getSouthWest().lat;
		var lat2 = map.getBounds().getNorthEast().lat;
		var lng1 = map.getBounds().getSouthWest().lng;
		var lng2 = map.getBounds().getNorthEast().lng;
		var bbox = ''+Math.min(lat1,lat2)+','+Math.min(lng1,lng2)+','+Math.max(lat1,lat2)+','+Math.max(lng1,lng2);
		if(xhr) xhr.abort();	// abort last request if not finished
		xhr = $.ajax({
			 // url: "proxy.php?bbox=[bbox="+map.getBounds().toBBoxString()+"]&q=[amenity=restaurant|fast_food][tourism=alpine_hut]",
			 url: 'proxy.php?q='+ (map.getZoom()<13?layer.options.query.low:layer.options.query.high).format(bbox),
//			 url: 'http://overpass-api.de/api/interpreter?data='+ (map.getZoom()<13?layer.options.query.low:layer.options.query.high).format(bbox),
			 success:function(data){
				 // do stuff with json (in this case an array)
				 // alert(data);
				var geojsonFeature = osm2geo(data);
//				geojsonFeature.on("featureparse", function(e) {alert(e);});
				layer.clearLayers();
				layer.addData(geojsonFeature);
			 },
			error: function(jqXHR, exception) {
				if (jqXHR.status === 0) {
					// alert('Not connect.\n Verify Network.');
				} else if (jqXHR.status == 404) {
					alert('Requested page not found. [404]');
				} else if (jqXHR.status == 500) {
					alert('Internal Server Error [500].');
				} else if (exception === 'parsererror') {
					alert('Requested JSON parse failed.');
				} else if (exception === 'timeout') {
					alert('Time out error.');
				} else if (exception === 'abort') {
					alert('Ajax request aborted.');
				} else {
					alert('Uncaught Error.\n' + jqXHR.responseText);
				}
			 },
		});
	}
	
	function onEachFeature(feature, layer) {
		var popupContent = "";
		for(ele in feature.properties)
			{
			popupContent += ele+"=<b>"+makeLink(feature.properties[ele])+"</b></br>";
			}
		// console.log(layer);	
		layer.bindPopup(popupContent);
		
		// layer.geometryToLayer(
//		L.marker(layer.getBounds().getCenter(), {icon: RestaurantIcon}).bindPopup(popupContent).addTo(map);
		//layer.addLayer(new L.Marker(new L.LatLng(10.9623409,48.303125)));
	}
	
	
	function DownloadRoute()
	{
		var gpx="<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>\n<gpx xmlns=\"http://www.topografix.com/GPX/1/1\" creator=\"MyCycleMap by Henry Thasler www.thasler.org/map\" version=\"1.1\">\n<rte>\n{0}</rte>\n</gpx>";
		var rtept="\t<rtept lon=\"{0}\" lat=\"{1}\">\n\t\t<name>{2}</name>\n\t</rtept>\n";
		var rte="";
		var pos = Route.getLatLngs();
		if(pos.length<=0) alert("Route empty.");
		else
			{
			for(x=0;x<pos.length;x++)
				{
				rte+=rtept.format(pos[x].lng, pos[x].lat, x);
				}
				

			$.generateFile({
					filename	: 'route.gpx',
					content		: gpx.format(rte),
					script		: 'download.php'
				});	
			}
	}
	
	function OpenRoute(button, parent)
	{
		fileframe = L.DomUtil.create('div', 'info', parent); // create a div with a class "info"
		fileframe.id = "fileframe";
		L.DomEvent.addListener(fileframe, 'click', function(e){
			L.DomEvent.stopPropagation(e);
			}, parent);

		filelist_closeButton = L.DomUtil.create('a', 'close-button', fileframe);
		filelist_closeButton.href = '#close';
		filelist_closeButton.innerHTML = '&#215;';
		
		L.DomEvent.addListener(filelist_closeButton, 'click', function(e){
			L.DomEvent.stopPropagation(e);
			parent.removeChild(fileframe);
			}, fileframe);

		filelist = L.DomUtil.create('div', 'info', fileframe); // create a div with a class "info"
		filelist.id = "filelist";
		L.DomEvent.addListener(filelist, 'click', function(e){
			L.DomEvent.stopPropagation(e);
			if(e.target.id != filelist.id)
				$.get(e.target.id, function(data){
					loadGPXData(textToXml(data));
					// alert("Data Loaded: " + data);
					});
			}, fileframe);
	
		// $('#filelist').width(400);
		$('#filelist').load('dir.php');

	}
	
// https://github.com/tkafka/Javascript-GPX-track-viewer/blob/master/app/js/gpxtools/gpxtools.js
	function textToXml(text) 
	{
		var xmlDoc, parser;

		if (window.DOMParser) 
			{
			try{  
			    parser = new DOMParser();
			    xmlDoc = parser.parseFromString(text, "text/xml");
			   }
			catch(e)
			  {
			  alert ("XML parsing error.");
			  return false;			    
			  }
			}
		else // Internet Explorer
			{
			xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
			xmlDoc.async = "false";
			xmlDoc.loadXML(text);
			}
		return xmlDoc;
	}


	function parseSegment(segmentxml) 
	{
		var segment = {
		points: [],
		ele: [],
		length: 0
		};
		var res;

		var trackpoints = segmentxml.getElementsByTagName("trkpt");
		if (trackpoints.length == 0)
		{
		return segment;
		}

		for (var i=0; i < trackpoints.length; i++)
			{
			res = parseRoutePoint(trackpoints[i]);
			segment.points.push(res.latLng);
			segment.ele.push(res.ele);
			}

		return segment;
	}	
	
	function parseTrack (trackxml) 
	{
		var track = {
		segments: [],
		length: 0
		};

		var segments = trackxml.getElementsByTagName("trkseg");
		for (var i = 0; i < segments.length; i++)
		{
		var segment = parseSegment(segments[i]);
		track.segments.push(segment);
		track.length += segment.length;
		}

		return track;
	}
	
	function parseRoutePoint (routepoint) 
	{
		var pnt = {
		latLng: null,
		ele: 0,
		name: '',
		comment: '',
		html: ''
		};

		pnt.latLng = new L.LatLng(parseFloat(routepoint.getAttribute('lat')), parseFloat(routepoint.getAttribute('lon')));

		var names = routepoint.getElementsByTagName("name");
		if (names[0] !== undefined) {
		pnt.name = names[0].textContent;
		pnt.html = '<b>' + pnt.name + '</b>';
		}

		var cmts = routepoint.getElementsByTagName("cmt");
		if (cmts[0] !== undefined) {
		pnt.comment = cmts[0].textContent;
		pnt.html += '<br/>' + pnt.comment;
		}

		var ele = routepoint.getElementsByTagName("ele");
		if (ele[0] !== undefined) {
		pnt.ele = ele[0].textContent;
		pnt.html = '<br/>' + pnt.ele;
		}
	
		return pnt;
	}	
	
	function parseRoute(routexml) 
	{
		var route = {
		points: []
		};

		var routepoints = routexml.getElementsByTagName("rtept");
		for (var i=0; i < routepoints.length; i++)
			{
			route.points.push(parseRoutePoint(routepoints[i]));
			}
		return route;
	}	
	
	function parseGPX(xmlDoc)
	{
		var data = {
		tracks: [],
		waypoints: [],
		routes: []
		};	
		
		var e;
		var output = [];
		var routes = xmlDoc.documentElement.getElementsByTagName("rte");
		for (var i = 0; i < routes.length; i++)
			data.routes.push(parseRoute(routes[i]));
			
		var tracks = xmlDoc.documentElement.getElementsByTagName("trk");
		for (var i = 0; i < tracks.length; i++)
			data.tracks.push(parseTrack(tracks[i]));
			
		return data;
	}
	
	function loadGPXData(gpxdata)
	{
	  TrackData = parseGPX(gpxdata);

		if(TrackData.tracks.length)
			{
			StartMarker.addTo(map);
			EndMarker.addTo(map);
			track.addTo(map);

			track.spliceLatLngs(0);	// empty current track
			var points=[], ele=[];
			for(var j=0, segment;segment=TrackData.tracks[0].segments[j]; j++)
				for(var k=0; k<segment.points.length;k++)
					{
					points.push(segment.points[k]);
					ele.push(segment.ele[k]);
					}
			track.setLatLngs(points);	// set new track points
			StartMarker.setLatLng(points[0]);
			EndMarker.setLatLng(points[points.length-1]);
			map.fitBounds(track.getBounds());
			// track.openPopup();
			
			if(document.getElementById("myCanvas") == null) 
			    profile.addTo(map);
			
			// draw height profile
			var min_ele=ele[0], max_ele;
			max_ele=min_ele;
			var distance = [];
			distance.push(0);
			
			for(x=1;x<points.length;x++)
				{
				var ele_item = ele[x];
				max_ele = (ele_item>max_ele?ele_item:max_ele);
				min_ele = (ele_item<min_ele?ele_item:min_ele);							
				distance.push(distance[x-1]+points[x-1].distanceTo(points[x]));
				}
			
			var c=document.getElementById("myCanvas");
			var ctx=c.getContext("2d");
			
			var center_ele = min_ele+(max_ele-min_ele)/2;
			var canvas_height=150, border=0, left=0;

			var min_txt = parseInt(max_ele)+"m", max_txt=parseInt(min_ele)+"m";
			
			ctx.font="10px Arial";
			left = Math.max(ctx.measureText(min_txt).width, ctx.measureText(max_txt).width);

			ctx.textBaseline="top"; 
			ctx.fillText(min_txt,0,0);
			ctx.textBaseline="alphabetic"; 
			ctx.fillText(max_txt,0,canvas_height);

			var canvas_width=300-left;
			ctx.strokeStyle="#999999";
			ctx.strokeRect(left,0,canvas_width,canvas_height);

			ctx.strokeStyle="#0000AA";
			
			ctx.moveTo(left, canvas_height-border-(ele[0]-min_ele)/(max_ele-min_ele)*(canvas_height-2*border));
			var step=Math.max(parseInt(points.length/canvas_width),1);
			for(x=step;x<points.length;x+=step)
				{
				ctx.lineTo(left+distance[x]/distance[points.length-step]*canvas_width, canvas_height-border-(ele[x]-min_ele)/(max_ele-min_ele)*(canvas_height-2*border));
				}
			ctx.stroke();
			
			$("#min_ele").text("min elevation: " + min_ele + " m");
			$("#max_ele").text("max elevation: " + max_ele + " m");
			
			}
	  
	  
		if(TrackData.routes.length)
			{
			Route.editing.disable();
			Route.spliceLatLngs(0);
			var t = TrackData.routes[0].points.length;
			for(var x=0;x<t;x++)
				Route.addLatLng(TrackData.routes[0].points[x].latLng);
			map.fitBounds(Route.getBounds());
			Route.editing.enable();
			info.update(getTrackProps(Route.getLatLngs()));
			}

	}
	
	function handleFileSelect(evt) 
	{
		evt.stopPropagation();
		evt.preventDefault();

		var files = evt.dataTransfer.files; // FileList object.

		// files is a FileList of File objects. List some properties.
		var output = [];
		for (var i = 0, f; f = files[i]; i++) 
			{
			console.log(escape(f.name)+', ' + f.size+' Bytes');
			  var reader = new FileReader();

			  // Closure to capture the file information.
			  reader.onload = (function(theFile) {
				return function(e) 
				{
				GPXData.load(e.target.result);  // this is a special modification
				/*				  
				  new L.GPX(e.target.result, {
				    async: true,
				    marker_options: {
				      startIconUrl: 'img/a-marker.png',
				      endIconUrl: 'img/b-marker.png',
				      shadowUrl: 'img/marker-shadow.png',
				      iconAnchor: [1, 40]

				    }				    
				    }).on('loaded', function(e) {
				    map.fitBounds(e.target.getBounds());
				  }).addTo(map);
				*/
			  
				//loadGPXData(textToXml(e.target.result));
				};
			  })(f);

			  // Read in the image file as a data URL.
			  reader.readAsText(f);				  
			}
	}

	function handleDragOver(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
	}	
	
});