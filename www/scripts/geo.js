var logger = null;
var geoLocation = null; // Variable nicht "location" nennen, sonst wird auf die Seite "null" umgeleitet
var map = null;
var initialPositionSet = false;
var minMarkerZoomLevel = 12;
var accuracySwitch = null;
var backgroundSwitch = null;
var deviceStompClient = null;

function oAuthExpired_geo() {
    // Damit der Dialog verschwindet, wenn auf die Login-Seite umgeleitet wird.
    window.plugins.spinnerDialog.hide();

    stopBackgroundGeolocation();
}

function stopBackgroundGeolocation() {
    // Beendet das Background-Tracking bei Timeout
    geoLocation.stopGeoWatch();
}

function mapInit() {
    logger.log("mapInit()");

    var url = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    map = new GeoMap('map', url);
    initialPositionSet = false;

    map.onTileLoad = function (x, y, z) {
        if (z >= minMarkerZoomLevel) {
            // z übergeben, da getZoomLevel während des Zoomens den alten Wert zurück gibt
            getDevicePositionsOfTile_oAuth(z, x, y, function (result) {
                mapPositions(result, z);
            }, oAuthExpired_geo);
        }
    };
    map.onZoomLevelChanged = function (zoomLevel) {
        // Hier muss nur gecleart werden.
        // Beim Reinzoomen wird "tileload" für jedes Tile gefeuert.
        if (zoomLevel < minMarkerZoomLevel) {
            map.hideMarkers();
        }
    };
}

function locationInit(uiAvailable) {
    if (typeof uiAvailable !== "boolean") {
        uiAvailable = true;
    }

    var backgroundGeolocation = window.backgroundGeolocation || window.backgroundGeoLocation || window.universalGeolocation;
    var provider = new GeoLocationProvider(
            backgroundGeolocation,
            cordova.plugins.locationAccuracy,
            cordova.plugins.diagnostic
            );

    geoLocation = new GeoLocation(provider, logger);
    geoLocation.onNewLocation = function (pos) {
        logger.log("geoWin(): " + pos.coords.latitude + ", " + pos.coords.longitude);

        var deviceUUID = String(device.uuid);
        if (uiAvailable) {
            // Aus irgendeinem Grund feuert das Event beim Start manchmal 2x => Abfangen, um doppeltes Senden an den Server zu verhindern.
            var lastDeviceLocation = map.getPosition(deviceUUID);
            if (lastDeviceLocation !== undefined) {
                if (lastDeviceLocation.latitude === pos.coords.latitude && lastDeviceLocation.longitude === pos.coords.longitude) {
                    return;
                }
            }

            $('#findDevice').parent('.disabled').removeClass('disabled');
            mapPos(pos.coords.latitude, pos.coords.longitude);
        }
        submitDevicePosition_oAuth(deviceUUID, pos.coords.latitude, pos.coords.longitude, undefined, oAuthExpired_geo);
    };
    geoLocation.onNewLocationFailed = function (error) {
        if (geoLocation.initialPositionSet === false && geoLocation.geolocationOpts.enableHighAccuracy === true) {
            geoLocation.stopGeoWatch();
            geoLocation.startGeoWatch(false);
        } else {
            if (uiAvailable && error.code === error.PERMISSION_DENIED) {
                // Über dem Loggen, da stopGeoWatch selbst eine Log-Nachricht rausschreibt!
                clearSwitches();
                geoLocation.stopGeoWatch();

            }
            logger.error(error.message + " (Code: " + error.code + ")");
        }
    };
}

function accuracySwitchInit() {
    if (!geoLocation.supportsMultipleAccuracies()) {
        accuracySwitch.disableFirstButton();
    }

    accuracySwitch.onToggleButtonChanged = function (button) {
        var recheckLocationAvailable = function (highAccuracy) {
            // Hier wird geprüft, ob die vorherige Genauigkeit immer noch verfügbar ist.
            cordova.plugins.diagnostic.isLocationEnabled(function (available) {
                if (!available) {
                    clearSwitches();
                } else {
                    accuracySwitch.toggle();
                }
            }, function () {
                clearSwitches();
            });
        };

        var backgroundPosition = backgroundSwitch.isSecondActive();
        if (button === undefined || button === null || $(button).length === 0) {
            geoLocation.stopGeoWatch();
        } else if (button[0] === $("#lowAccuracyButton")[0]) {
            geoLocation.requestDeviceLocation(false, backgroundPosition, function () {
                recheckLocationAvailable(true);
            });
        } else if (button[0] === $("#highAccuracyButton")[0]) {
            geoLocation.requestDeviceLocation(true, backgroundPosition, function () {
                recheckLocationAvailable(false);
            });
        }
    };

    initialGpsRequest();
    registerLocationStateChangeHandler();
}

function deviceStompInit(uiAvailable) {
    if (typeof uiAvailable !== "boolean") {
        uiAvailable = true;
    }

    deviceStompClient = new DeviceStompClient(backendUrl + '/localization', device.uuid);

    if (uiAvailable) {
        deviceStompClient.onDevicePositionChange = function (positions) {
            $.each(positions, function (i, value) {
                mapPosition(value.id, value.node.latitude, value.node.longitude,
                    undefined, value.timeAdded, value.username);
            });
        };
        deviceStompClient.onDeviceDisconnected = function (deviceId) {
            map.removeMarker(deviceId);
        };
    }

    deviceStompConnect(uiAvailable);
}

function deviceStompConnect(uiAvailable) {
    if (uiAvailable) {
        getFriends_oAuth(function (result) {
            deviceStompClient.connect(result);
        }, function (jqXHR, textStatus, errorThrown) {
            navigator.notification.alert(
                'Get friends of user:\n' + getAjaxErrorMessage(jqXHR, textStatus),
                function () { }, errorThrown.name);
        }, oAuthExpired_geo);
    } else {
        deviceStompClient.connect([]);
    }
}

function registerLocationStateChangeHandler(uiAvailable) {
    if (typeof uiAvailable !== "boolean") {
        uiAvailable = true;
    }

    geoLocation.registerLocationStateChangeHandler(function (enabled) {
        if (enabled === false) {
            geoLocation.stopGeoWatch();

            if (uiAvailable) {
                clearSwitches();
            }
        }
    });
}

function backgroundSwitchInit() {
    if (geoLocation.isBackgroundLocationEnabled()) {
        backgroundSwitch.enableSecond();
    } else {
        backgroundSwitch.enableFirst();
    }

    backgroundSwitch.onToggleButtonChanged = function (button) {
        fullLocationStartup();
    };
}

function fullLocationStartup() {
    accuracySwitch.onToggleButtonChanged(accuracySwitch.getActiveButtons());
}

function initialGpsRequest() {
    geoLocation.isGpsEnabled(function (hasGps) {
        if (hasGps) {
            accuracySwitch.enableSecond();
        } else {
            accuracySwitch.enableFirst();
        }

        geoLocation.requestDeviceLocation(hasGps, undefined, function () {
            clearSwitches();
        });
    });
}

function clearSwitches() {
    // Konsistentes Verhalten wenn keine Position ausgelesen wird
    accuracySwitch.clear();
    backgroundSwitch.enableFirst();
}

function mapPosition(deviceId, lat, lon, currentZoomLevel, timeAdded, username) {
    if (currentZoomLevel === undefined || currentZoomLevel === null) {
        currentZoomLevel = map.getZoomLevel();
    }

    var visible = currentZoomLevel >= minMarkerZoomLevel;
    var currentDevice = String(device.uuid) === deviceId;
    map.setMarkerPosition(deviceId, lat, lon, visible, currentDevice);
    map.setPopupContent(deviceId, getMarkerPopupContent(deviceId, lat, lon, timeAdded, username));
}

function getMarkerPopupContent(id, lat, lon, timeAdded, username) {
    var popupContent = "";
    if (username !== undefined && username !== null) {
        popupContent += "<b>" + username + "</b><br>";
    } else {
        popupContent += " <b>" + id + "</b><br>";
    }
    popupContent += "Latitude: " + lat + "<br>" +
            "Longitude: " + lon;
    if (timeAdded !== undefined && timeAdded !== null) {
        var timeString = new Date(timeAdded).toLocaleString();
        popupContent += "<br>Time: " + timeString;
    }

    return popupContent;
}

function mapPositions(positions, currentZoomLevel) {
    $.each(positions, function (i, val) {
        mapPosition(val.id, val.node.latitude, val.node.longitude, currentZoomLevel, val.timeAdded, val.username);
    });
}

function mapPos(lat, lon) {
    if (initialPositionSet === false) {
        map.navigateTo(lat, lon);
    }

    var deviceUUID = String(device.uuid);
    mapPosition(deviceUUID, lat, lon);
    initialPositionSet = true;
}

function findDevice() {
    var deviceUUID = String(device.uuid);
    var position = map.getPosition(deviceUUID);
    if (position !== undefined) {
        map.navigateTo(position.latitude, position.longitude);
    }
}

function addMarker(devicePosition) {
    // Damit bei einer neuen Geräte-Position nicht direkt dorthin gesprungen wird!
    initialPositionSet = true;

    var position = devicePosition.node;
    mapPosition(devicePosition.id, position.latitude, position.longitude,
            minMarkerZoomLevel, devicePosition.timeAdded, devicePosition.username);
    map.navigateTo(position.latitude, position.longitude);
}

// life cycle
function onPause() {
    logger.log("onPause()");

    if (!geoLocation.isBackgroundLocationEnabled()) {
        deviceStompClient.disconnect();
        geoLocation.stopGeoWatch();
    }
}

function onResume() {
    logger.log("onResume()");

    if (!deviceStompClient.isConnected()) {
        deviceStompConnect();
    }

    // Prüft Accuracy- und Background-Buttons
    fullLocationStartup();
}

function geoMain() {
    $(function () {
        window.isPhone = false;
        if (document.URL.indexOf("http://") === -1 && document.URL.indexOf("https://") === -1) {
            window.isPhone = true;
        }

        if (window.isPhone) {
            document.addEventListener('deviceready', onDeviceReady_geo, false);
        } else {
            onDeviceReady_geo();
        }
    });
}

function registerLifeCycleEvents_geo() {
    document.addEventListener("pause", onPause, false);
    document.addEventListener("resume", onResume, false);
}

function onDeviceReady_geo() {
    logger = new Logger(undefined, $("#status"));
    accuracySwitch = new ToggleSwitch($('#highAccuracyToggleSwitch'));
    backgroundSwitch = new ToggleSwitch($('#backgroundLocationToggleSwitch'), false);
    mapInit();

    registerLifeCycleEvents_geo();

    deviceStompInit();
    locationInit();
    accuracySwitchInit();
    backgroundSwitchInit();
}