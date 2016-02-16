L.mapbox.accessToken = 'pk.eyJ1IjoiY2h1aG5rIiwiYSI6ImNpZzE0dnZ1aTBuZDR1c201MjZ2c3FxZXIifQ.fGaU0vniCGaUlmIvIFez3A';
var lat = 51.513911;;
var lon = -0.110389;
var map = L.mapbox.map('map', 'mapbox.streets').setView([lat, lon], 15);
var url = window.location.href + "/objects";
var objMap = {};

function getLocation(loadObjects) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(loadObjects);
    } else {
	return false;
    }
}

function loadObjects(lat, lon) {
    var req = url + "?lat=" + lat + "&lon=" + lon;

    $.post(req, function(data) {
        if (data == "null") {
            return false;
        }
        renderObjects(JSON.parse(data));
    })

    return false;
}

function renderObjects(objs) {
    for (i = 0; i < objs.length; i++) {
        var obj = objs[i]

	if (objMap[obj.id] != undefined) {
	    var marker = objMap[obj.id];
            marker.setLatLng(L.latLng(obj["location"]["latitude"], obj["location"]["longitude"]));
        } else {
            var marker = L.marker([obj["location"]["latitude"], obj["location"]["longitude"]], {
                icon: L.mapbox.marker.icon({
                    'marker-color': '#f86767'
                })
            });

            marker.addTo(map);
	    objMap[obj.id] = marker;
        }
    }
}

function loadLoop() {
    var ctr = map.getCenter()
    loadObjects(ctr.lat, ctr.lng);

    setTimeout(function () {
        loadLoop();
    }, 5000);
}

$(document).ready(function() {
    loadLoop()
});
