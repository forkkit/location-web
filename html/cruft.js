L.mapbox.accessToken = 'pk.eyJ1IjoiY2h1aG5rIiwiYSI6ImNpZzE0dnZ1aTBuZDR1c201MjZ2c3FxZXIifQ.fGaU0vniCGaUlmIvIFez3A';
var map = L.mapbox.map('map', 'mapbox.streets');
var url = window.location.href + "/objects";
var objMap = {};

function getLocation(load) {
    if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(load);
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
    getLocation(function(loc) {
	var pos = loc.coords;
        var marker = objMap['local'];
        marker.setLatLng(L.latLng(pos.latitude, pos.longitude));
    });

    var ctr = map.getCenter()
    loadObjects(ctr.lat, ctr.lng);

    setTimeout(function () {
        loadLoop();
    }, 1000);
}

$(document).ready(function() {
    // set pin
    getLocation(function(loc) {
	var pos = loc.coords;

	// set view
        map.setView([pos.latitude, pos.longitude], 15);

	// set local marker
	var marker = L.marker([pos.latitude, pos.longitude], {
	    icon: L.mapbox.marker.icon({
	        'marker-color': '#3bb2d0'
            })
	});

        marker.addTo(map);
        objMap['local'] = marker;

	// interval
        loadLoop();
    });
});
