"use strict";

/**
 * Erstellt eine neue GeoMap-Instanz, die eine Leaflet-Karte kapselt.
 * @param {String} mapContainerId Die DOM-Id des Elements, das für die Karte verwendet werden soll
 * @param {String} tileUrl Die URL, aus der die Kartendaten stammen
 * @returns {GeoMap} Eine neue GeoMap-Instanz
 */
function GeoMap(mapContainerId, tileUrl) {
    this._locations = {};
    this._map = new L.Map(mapContainerId);
    this._map.setView(new L.LatLng(0.0, 0.0), 15);

    var _this = this;
    var layer = new L.TileLayer(tileUrl, {
        minZoom: 8,
        maxZoom: 19,
        attribution: "OSM"
    });
    layer.on('tileload', function (tileEvent) {
        var coords = tileEvent.coords;
        _this.onTileLoad(coords.x, coords.y, coords.z);
    });
    this._map.addLayer(layer);

    this._map.on('zoomend', function (evt) {
        _this.onZoomLevelChanged(_this._map.getZoom());
    });

    this._map.on('popupopen', function (e) {
        var popup = e.popup;
        var marker = popup._source;
        var key = marker._icon.id;

        _this.onPopupOpen(key, marker, popup);
    });

    this._initIcons();
}

/**
 * Initialisiert die verschiedenen Icons der Map.
 * @param {String} basePath Die DOM-Id des Elements, das für die Karte verwendet werden soll
 * @param {String} baseShadowPath Die URL, aus der die Kartendaten stammen
 * @returns {undefined}
 */
GeoMap.prototype._initIcons = function (basePath, baseShadowPath) {
    if (typeof basePath !== 'string' && !(basePath instanceof String)) {
        basePath = "lib/leaflet-color-markers/img/";
    }
    if (typeof baseShadowPath !== 'string' && !(baseShadowPath instanceof String)) {
        baseShadowPath = "lib/leaflet/dist/images/";
    }
    basePath = String(basePath);
    baseShadowPath = String(baseShadowPath);

    // PhantomJS kann kein String.endsWith, also ist hier die Methode als Funktion...
    // Also für Unit Tests
    var strEndsWith = function (str, suffix) {
        return str.match(suffix + "$") == suffix;
    };

    if (!strEndsWith(basePath, '/')) {
        basePath = basePath + '/';
    }
    if (!strEndsWith(baseShadowPath, '/')) {
        baseShadowPath = baseShadowPath + '/';
    }

    this._blueIcon = new L.Icon({
        iconUrl: basePath + 'marker-icon-2x-blue.png',
        shadowUrl: baseShadowPath + 'marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    this._redIcon = new L.Icon({
        iconUrl: basePath + 'marker-icon-2x-red.png',
        shadowUrl: baseShadowPath + 'marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
};

/**
 * Wird aufgerufen, wenn sich das Zoomlevel der Karte ändert.
 * @param {int} zoomLevel Der neue Zoomlevel der Karte
 * @returns {undefined}
 */
GeoMap.prototype.onZoomLevelChanged = function (zoomLevel) {
    // Leere Implementierung
};

/**
 * Wird aufgerufen, wenn ein neuer Tile mit den gegebenen Koordinaten geladen wird.
 * @param {type} x X-Koordinate des Tiles
 * @param {type} y Y-Koordinate des Tiles
 * @param {type} z Z-Koordinate (Zoom) des Tiles
 * @returns {undefined}
 */
GeoMap.prototype.onTileLoad = function (x, y, z) {
    // Leere Implementierung
};

/**
 * Wird aufgerufen, wenn sich das Popup eines Markers öffnet.
 * @param {String} key Der eindeutige Name des Markers
 * @param {L.Marker} marker Das Marker-Objekt, für das das Popup geöffnet wird.
 * @param {L.Popup} popup Das geöffnete Popup
 * @returns {undefined}
 */
GeoMap.prototype.onPopupOpen = function (key, marker, popup) {
    // Leere Implementierung
};

/**
 * Gibt den aktuellen Zoomlevel der Karte zurück.
 * @returns {int} der aktuelle Zoomlevel der Karte
 */
GeoMap.prototype.getZoomLevel = function () {
    return this._map.getZoom();
};

/**
 * Navigiert die Karte zu den gegebenen Koordinaten.
 * @param {Number} lat Ziel-Latitude
 * @param {Number} lon Ziel-Longitude
 * @returns {undefined}
 */
GeoMap.prototype.navigateTo = function (lat, lon) {
    this._map.panTo(new L.LatLng(lat, lon));
};

/**
 * Setzt einen neuen Marker mit gegebenen Namen und Position oder aktualisiert diesen.
 * @param {String} key Der eindeutige Name des Markers
 * @param {Number} lat Latitude der Position
 * @param {Number} lon Longitude der Position
 * @param {Boolean} visible Gibt an, ob der Marker sichtbar sein soll (standardmäßig true)
 * @param {Boolean} redMarker Gibt an, ob der Marker rot oder blau sein soll
 * @returns {undefined}
 */
GeoMap.prototype.setMarkerPosition = function (key, lat, lon, visible, redMarker) {

    var markerExists = this._locations[key] !== undefined;
    if (!markerExists) {
        this._locations[key] = {
            node: undefined,
            marker: undefined
        };
    }

    if (visible === undefined) {
        visible = true;
    }

    var keyLocation = this._locations[key];

    if (markerExists) {
        var sameVisibility = (keyLocation.marker !== undefined) === visible;
        var sameLocation = keyLocation.node.latitude === lat && keyLocation.node.longitude === lon;
        if (sameVisibility && sameLocation) {
            // Kein Neuzeichnen, wenn sich nichts geändert hat
            // Verhindert, dass der Marker beim Zoomen hin- und herspringt
            return;
        }
    }

    keyLocation.node = {
        latitude: lat,
        longitude: lon
    };

    this.updateMarker(key, visible, redMarker);
};

/**
 * Zeichnet den Marker mit dem gegebenen Namen neu oder versteckt diesen.
 * @param {String} key Der eindeutige Name des Markers
 * @param {Boolean} visible Gibt an, ob der Marker sichtbar sein soll (standardmäßig true)
 * @param {Boolean} redMarker Gibt an, ob der Marker rot oder blau sein soll
 * @returns {undefined}
 */
GeoMap.prototype.updateMarker = function (key, visible, redMarker) {
    if (this._locations[key] === undefined) {
        return;
    }

    if (visible === undefined) {
        visible = true;
    }

    if (!!visible === true) {
        var location = this._locations[key].node;

        var marker;
        if (this._locations[key].marker !== undefined) {
            marker = this._locations[key].marker;
            marker.setLatLng(new L.LatLng(location.latitude, location.longitude)); 
        } else {
            var markerIcon;
            if(redMarker) {
                markerIcon = this._redIcon;
            } else {
                markerIcon = this._blueIcon;
            }

            marker = L.marker([location.latitude, location.longitude], {icon: markerIcon});
            marker.bindPopup('');
            marker.addTo(this._map);
            marker._icon.id = key;

            this._locations[key].marker = marker;
        }
    } else {
        this.hideMarker(key);
    }
};

/**
 * Legt den angezeigten Text (bzw. den HTML-Code) für das Popup des gegebenen Markers fest.
 * @param {String} key Der eindeutige Name des Markers
 * @param {String} content Der anzuzeigende Text (bzw. der HTML-Code) des Popups
 * @returns {undefined}
 */
GeoMap.prototype.setPopupContent = function (key, content) {
    var keyLocation = this._locations[key];
    if (keyLocation === undefined) {
        return;
    }

    var marker = keyLocation.marker;
    if (marker !== undefined) {
        marker.setPopupContent(content);
    }
};

/**
 * Versteckt alle Marker der Karte.
 * @returns {undefined}
 */
GeoMap.prototype.hideMarkers = function () {
    var _this = this;
    $.each(this._locations, function (key, location) {
        _this.hideMarker(key);
    });
};

/**
 * Versteckt den gegebenen Marker.
 * @param {String} key Der eindeutige Name des Markers
 * @returns {undefined}
 */
GeoMap.prototype.hideMarker = function (key) {
    if (this._locations[key] === undefined) {
        return;
    }

    var marker = this._locations[key].marker;
    if (marker !== undefined) {
        this._map.removeLayer(marker);
        this._locations[key].marker = undefined;
    }
};

/**
 * Entfernt alle Marker von der Karte.
 * @returns {undefined}
 */
GeoMap.prototype.removeMarkers = function () {
    var _this = this;
    $.each(this._locations, function (key, location) {
        _this.removeMarker(key);
    });
};

/**
 * Entfernt den gegebenen Marker.
 * @param {String} key Der eindeutige Name des Markers
 * @returns {undefined}
 */
GeoMap.prototype.removeMarker = function (key) {
    if (this._locations[key] === undefined) {
        return;
    }

    this.hideMarker(key);
    delete this._locations[key];
};

/**
 * Gibt die Position des Markers mit dem gegebenen Schlüssel zurück; oder undefined, wenn dieser nicht existiert.
 * @param {String} key Der eindeutige Name des Markers
 * @returns {undefined|GeoMap.locations.node} Die Position des Markers, oder undefined
 */
GeoMap.prototype.getPosition = function (key) {
    var keyLocation = this._locations[key];
    if (keyLocation !== undefined) {
        return keyLocation.node;
    }
    return undefined;
};