'use strict';

function getDate(date)
{
	return date.getFullYear() + ("0"+(date.getMonth()+1)).slice(-2) + ("0" + date.getDate()).slice(-2);
}
function getHour(date)
{
	return ("0"+(date.getHours())).slice(-2);
}
function getTime(date)
{
	return ("0"+(date.getHours())).slice(-2) + ':' + ("0"+(date.getMinutes())).slice(-2);
}

function initDatabase() {
	var getdevices = firebase.database().ref('devices').orderByChild('index').limitToLast(10);
	getdevices.on('child_added', function(data) {
		addDevice(data, data.val().index == 0);	
		if (data.val().index == 0)
		{
			getRecords(data.key);
		}
	});
	getdevices.on('child_changed', function(data) {		
		createUpdateDevice(data);
		getConfigDevice();
	});
}

function createUpdateDevice(data) {
  devices[data.key] = {"index": data.val().index,"name":data.val().name, "icon":data.val().icon, "enabled":data.val().enabled,
  "working":data.val().working, "frecuency":data.val().frecuency, "distancemin":data.val().distancemin, "accuracytosave":data.val().accuracytosave, "accuracytoshow":data.val().accuracytoshow};	
}

function addDevice(data, selected) {
  createUpdateDevice(data);
  var ul = document.getElementById("device-list");
  var li = document.createElement("li");
  var img = document.createElement('img');
  li.setAttribute("id", data.key);
  li.setAttribute("class", "mdl-menu__item");
  img.src=data.val().icon;
  img.setAttribute("class", "device-list-icon");
  li.appendChild(img);
  li.appendChild(document.createTextNode(data.val().name));
  li.addEventListener('click', function(){ getRecords(data.key); }, false);
  ul.appendChild(li);
}

function getConfigDevice()
{
  document.getElementById('device-name').textContent = devices[currentDeviceid].name;
  
  if (devices[currentDeviceid].enabled > 0)
	document.getElementById('input-enabled').MaterialSwitch.on();
  else
	document.getElementById('input-enabled').MaterialSwitch.off();

  if (devices[currentDeviceid].working > 0)
	document.getElementById('enabled-working').textContent = "Enabled (working)";
  else
	document.getElementById('enabled-working').textContent = "Enabled (stopped)";

  document.getElementById('input-frecuency').MaterialTextfield.change(devices[currentDeviceid].frecuency);
  document.getElementById('input-distancemin').MaterialTextfield.change(devices[currentDeviceid].distancemin);
  document.getElementById('input-accuracytosave').MaterialTextfield.change(devices[currentDeviceid].accuracytosave);
  document.getElementById('input-accuracytoshow').MaterialTextfield.change(devices[currentDeviceid].accuracytoshow);
  document.getElementById('device-config').style.display = "block";
}

function setConfigDevice()
{
  if (document.getElementById('input-enabled').classList.contains('is-checked'))		
	devices[currentDeviceid].enabled = 1;
  else 
	devices[currentDeviceid].enabled = 0;

  devices[currentDeviceid].frecuency = parseInt(document.getElementById('device-frecuency').value);
  devices[currentDeviceid].distancemin = parseInt(document.getElementById('device-distancemin').value);
  devices[currentDeviceid].accuracytosave = parseInt(document.getElementById('device-accuracytosave').value);
  devices[currentDeviceid].accuracytoshow = parseInt(document.getElementById('device-accuracytoshow').value);

  firebase.database().ref('devices/' + currentDeviceid).set(devices[currentDeviceid]).then(function() {
        var data = {message: 'Device configuration saved'};
		document.getElementById('toast').MaterialSnackbar.showSnackbar(data);
    });
 }

var devices = {};
var currentDeviceid;
var currentDate = new Date();
var currentLimit = 50;

var map = null;
var graphData;
var myPositionMarker;

function getRecords(deviceid, date, limit) {
  
  var infoWindow = null;
  map = null;
  myPositionMarker = null;
  
  // Remove previous callbacks
  if (currentDeviceid != null)
	  firebase.database().ref(currentDeviceid + '/' + getDate(currentDate)).off();
  
  if (deviceid != null)
  {
	currentDeviceid = deviceid;
	getConfigDevice();
  }
  
  if (date != null)
	currentDate = date;  
  if (limit != null)
	currentLimit = limit;
  else
	currentLimit = 50;

  
  document.getElementById('records-details').textContent = '';
  document.getElementById('map-info').textContent = 'No available path for ' + devices[currentDeviceid].name + ' on ' + currentDate.toDateString();
  document.getElementById('map-subinfo').textContent = '';
  document.getElementById('map').style.display = "none";
  document.getElementById('chart-div').style.display = "none";
  document.getElementById('show-graph').style.display = "block";
  document.getElementById('stat-container').style.display = "none";
  document.getElementById('myposition').style.display = "none";
  
  var lastRecord = firebase.database().ref(currentDeviceid + '/' + getDate(currentDate)).limitToLast(1);
  lastRecord.on('child_added', function(data) {
	  
	if (data.val().timestamp == null)
	{
		map = null;
		var mapDiv = document.getElementById("map");
		while (mapDiv.firstChild) {
			mapDiv.removeChild(mapDiv.firstChild);
		}
		return;
	}
	
    document.getElementById('map-info').textContent = 'Showing path for ' + devices[currentDeviceid].name + ' on ' + currentDate.toDateString();
	document.getElementById('map').style.display = "block";
	document.getElementById('stat-container').style.display = "block";
	document.getElementById('myposition').style.display = "block";
		
	if (map == null)
	{
		map = new google.maps.Map(document.getElementById('map'), {
			zoom: 16,
			center: {lat: data.val().latitude, lng: data.val().longitude},
			mapTypeId: 'terrain'
		});
	}
	else
	{
		map.setCenter({lat: data.val().latitude, lng: data.val().longitude});
	}
	  
	if (infoWindow == null)
	{
		infoWindow = new google.maps.InfoWindow({map: map});
	}
	
	var pos = {
	  lat: data.val().latitude,
	  lng: data.val().longitude
	};

	infoWindow.setPosition(pos);
	
	var battery = "";
	var color = "";
	if (data.val().battery != null)
	{
		battery = data.val().battery;
		
		if (battery >= 80)
			color = 'color:#4caf50;';
		else if (battery >= 50)
			color = 'color:#90ad1b;';
		else if (battery >= 30)
			color = 'color:#d2a729;';
		else if (battery >= 15)
			color = 'color:#ff9800;';
		else
			color = 'color:#d50000;';
		
		battery = '&nbsp;&nbsp;[' + battery +'%]'
	}
	
	infoWindow.setContent('<a href="http://maps.google.com/?q=' + data.val().latitude + ',' + data.val().longitude + '" target="_blank"><img border="0" align="Left" src="' 
	+ devices[currentDeviceid].icon + '" style="width:20px;margin-right:5px;"><span style="line-height:20px;color:#5a5a5a;">' 
	+ new Date(data.val().timestamp).toLocaleTimeString() + '</span><span style="font-size:11px;' + color + '">' 
	+ battery + '</span></a>');
	
  });
	
  var records = firebase.database().ref(currentDeviceid + '/' + getDate(currentDate)).limitToLast(currentLimit);
  
  var fetchRecords = function(record) {
	
	var colors = ["#F44336", "#E53935", "#D32F2F", "#C62828", "#B71C1C", "#880E4F", "#AD1457", "#C2185B", "#D81B60", "#E91E63",
	"#EC407A", "#AB47BC", "#9C27B0", "#8E24AA", "#7B1FA2", "#6A1B9A", "#4A148C", "#0D47A1", "#1565C0", "#1976D2",
	"#1E88E5", "#2196F3", "#42A5F5", "#00BCD4", "#00ACC1", "#0097A7", "#00838F", "#006064", "#004D40", "#00695C",
	"#00796B", "#00897B", "#009688", "#26A69A", "#4CAF50", "#43A047", "#388E3C", "#2E7D32", "#1B5E20", "#827717", "#9E9D24",	
	"#AFB42B", "#C0CA33", "#FFA726", "#FF9800", "#FB8C00", "#F57C00", "#EF6C00", "#E65100"];
	var count = 0;
	var groupNumber = Math.round(Math.min(currentLimit, 500) / colors.length) + 1;
	var currentGroup = groupNumber;
	var currentColour = 0;
	var trackPath;
	var lastLocation;
	//var stroke = 2;
	var maxspeed = 0;
	var avgspeed = 0;
	var positivespeednum = 0;
	var totalDistance = 0;
	var totalArea = 0;
	
	graphData = new google.visualization.DataTable();
	//graphData.addColumn('timeofday', 'Time');
	graphData.addColumn('string', 'Time');
	graphData.addColumn('number', 'Altitude (m)');	  
	graphData.addColumn('number', 'Speed (km/h)');
	//graphData.addColumn({'type': 'string', 'role': 'tooltip'});
	graphData.addColumn({'type': 'number'});
	graphData.addColumn({'type': 'number'});
	
	record.on('child_added', function(data) {
		
		var date = new Date(data.val().timestamp);
		var battery = "";
		
		if (data.val().battery != null)
			battery = data.val().battery + '%'
		
		document.getElementById('records-details').textContent += count + ' ' + currentColour + '-' + data.key + ' ' + data.val().latitude+ ', ' + data.val().longitude 
		+ ' ±' + data.val().accuracy + ' [' + data.val().speed + 'm/s] ' + battery + ' (' + date.toLocaleTimeString() + ')';	
		
		if (data.val().accuracy > devices[currentDeviceid].accuracytoshow)
		{
			document.getElementById('records-details').textContent += ' -hidden\n';
			return;		
		}
		else
		{
			document.getElementById('records-details').textContent += '\n';
		}
		
		if (data.val().speed > maxspeed)
			maxspeed = data.val().speed;
		
		if (data.val().speed > 0)
		{
			avgspeed += data.val().speed;
			positivespeednum++;
		}
		
		graphData.addRow([getTime(date), data.val().altitude, Math.round(data.val().speed * 3.6), data.val().latitude, data.val().longitude]);//, battery]);
		
		var pos = new google.maps.LatLng(data.val().latitude, data.val().longitude);
		var calculateDistance = false;
				
		if (count == 0 || currentGroup == count)
		{
			trackPath = new google.maps.Polyline({
			  geodesic: true,
			  strokeColor: colors[currentColour],//colors[date.getHours()],
			  strokeOpacity: 1.0,
			  strokeWeight: 2
			});
			
			trackPath.setMap(map);
			
			pos = lastLocation;
			calculateDistance = true;
		
			if (count > 0)
			{
				currentGroup += groupNumber;
				if (currentColour < colors.length - 1)
					currentColour++;
				else
					currentColour = 0;
			}
			//stroke += 0.2;			
		}		
		
		if (pos)
		{		
			if (lastLocation != null)
				totalDistance += google.maps.geometry.spherical.computeDistanceBetween(lastLocation, pos);
	
			lastLocation = pos;
			// get existing path
			var path = trackPath.getPath();
			// add new point
			path.push(pos);
			// update the polyline with the updated path
			trackPath.setPath(path);
			
			if (calculateDistance)
			{
				totalArea += google.maps.geometry.spherical.computeArea(path);
			}
			
			if (myPositionMarker != null)
			{
				getMyPosition();
			}
		}		
		
		document.getElementById('map-subinfo').textContent = 'Max speed: ' + Math.round(maxspeed * 3.6) + 'km/h  (' + Math.round(maxspeed * 100) / 100 + 'm/s)'
		if (positivespeednum > 0)
			document.getElementById('map-subinfo').textContent += ' - Average speed: ' + Math.round((avgspeed/positivespeednum) * 3.6) + 'km/h  (' + Math.round(avgspeed/positivespeednum) + 'm/s)';
		if (totalDistance > 0)
			document.getElementById('map-subinfo').textContent += " - Total distance: " + Math.round(totalDistance / 100) / 10 + 'km';
		if (totalArea > 0)
			document.getElementById('map-subinfo').textContent += " - Total area: " + totalArea + 'm2';
		
		count++;	
	});
  };
  
  fetchRecords(records);
}

function drawChart() {
	
	if (graphData == null)
		return;

	var options = {
	  //title: 'My title',
	  legend: {position: 'top', maxLines: 1},
	  //hAxis: {title: 'Time',  titleTextStyle: {color: '#333'}},
	  vAxis: {minValue: 0},
	  series:[
			{targetAxisIndex:0},
			{targetAxisIndex:1}
		],
	  //width: document.getElementById("stat-container").offsetWidth,
	  chartArea: {'width': '90%'},
	  colors:['#80D8FF', '#0091EA'],
	  animation:{
			"startup": true,
			"duration": 1000,
			"easing": 'out',
		},
	};

    document.getElementById('chart-div').style.display = "block";
	var chart = new google.visualization.AreaChart(document.getElementById('chart-div'));
	var marker;
	
	function selectHandler() {
	  var selectedItem = chart.getSelection()[0];
	  if (selectedItem) {		
		var myLatLng = {lat: graphData.getValue(selectedItem.row, 3), lng: graphData.getValue(selectedItem.row, 4)};
		  if (marker == null)
		  {
			  marker = new google.maps.Marker({
			  position: myLatLng,
			  map: map
			});
		  }
		  else
		  {
			marker.setPosition( myLatLng );
		  }
	  }
	}
	
	var view = new google.visualization.DataView(graphData);  
	view.setColumns([0, 1, 2]); //only use the first and second column 

	google.visualization.events.addListener(chart, 'select', selectHandler);
	
	chart.draw(view, options);
}

function getMyPosition()
{	
	if (navigator.geolocation)
    {
		navigator.geolocation.getCurrentPosition(showPosition, showError);
	}
	else
	{
		document.getElementById('map-error').textContent = "Geolocation is not supported by this browser.";
	}
}

function showPosition(position)
{
	var latlon = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	if (myPositionMarker == null)
		myPositionMarker = new google.maps.Marker({icon:"blue-dot.png", position:latlon, map:map, title:"You are here!"});
	else
		myPositionMarker.setPosition( latlon );
}

function showError(error)
{
	var errorText = "";
	
	switch(error.code) 
	{
	case error.PERMISSION_DENIED:
	  errorText="User denied the request for Geolocation."
	  break;
	case error.POSITION_UNAVAILABLE:
	  errorText="Location information is unavailable."
	  break;
	case error.TIMEOUT:
	  errorText="The request to get user location timed out."
	  break;
	case error.UNKNOWN_ERROR:
	  errorText="An unknown error occurred."
	  break;
	}

	document.getElementById('map-error').textContent = errorText;
}
