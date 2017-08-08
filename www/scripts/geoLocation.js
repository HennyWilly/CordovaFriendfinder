"use strict";

/**
 * Erzeugt eine neue GeoLocationProvider-Instanz, die Standort-basierende Cordova-Plugin-Schnittstellen kapselt.
 * @param {type} backgroundGeolocation Die Schnittstelle zum Background Geolocation Plugin
 * @param {RequestLocationAccuracy} locationAccuracy Die Schnittstelle zum Request Location Accuracy Plugin
 * @param {type} diagnostic Die Schnittstellt zum Diagnostic Plugin.
 * @returns {GeoLocationProvider} Eine neue GeoLocationProvider-Instanz
 */
function GeoLocationProvider(backgroundGeolocation, locationAccuracy, diagnostic) {
    this.backgroundGeolocation = backgroundGeolocation;
    this.locationAccuracy = locationAccuracy;
    this.diagnostic = diagnostic;
}

/**
 * Erstellt eine neue GeoLocation-Klasse, die den Zugriff auf den Standort des Gerätes kapselt.
 * @param {GeoLocationProvider} geoLocationProvider Ein Provider, der verschiedene Arten der Positionsabfrage unterstützt.
 * @param {Logger} logger Ein optionaler Logger zum herausschreiben von Ereignissen.
 * @returns {GeoLocation} Eine neue GeoLocation-Instanz
 */
function GeoLocation(geoLocationProvider, logger) {
    if (geoLocationProvider === undefined || !(geoLocationProvider instanceof GeoLocationProvider)) {
        throw new ReferenceError("Kein gültiger GeoLocationProvider übergeben");
    }
    this._geoLocationProvider = geoLocationProvider;

    if (logger instanceof Logger) {
        this._logger = logger;
    } else {
        this._logger = new Logger("GeoLocation");
    }

    this._highAccuracyValue = 0;
    this._lowAccuracyValue = 1000;
    this._geolocationOpts = {
        desiredAccuracy: this._highAccuracyValue,
        stationaryRadius: 10,
        distanceFilter: 20,
        maxLocations: 100,
        // Android only section
        locationProvider: this._geoLocationProvider.backgroundGeolocation.provider.ANDROID_ACTIVITY_PROVIDER,
        interval: 30000,
        fastestInterval: 5000,
        activitiesInterval: 10000,
        stopOnStillActivity: false,
        startForeground: true
    };
    this._geolocationEnabled = false;
}

/**
 * Callback der aufgerufen wird, wenn eine neue Position ermittelt wurde.
 * @param {Position} position Die neue ermittelte Position
 * @returns {undefined}
 */
GeoLocation.prototype.onNewLocation = function (position) {
    // Leere Implementierung
};

/**
 * Callback der aufgerufen wird, wenn das Ermitteln einer neuen Position fehlgeschlagen ist.
 * @param {PositionError} error Enthält Informationen über den Fehler.
 * @returns {undefined}
 */
GeoLocation.prototype.onNewLocationFailed = function (error) {
    // Leere Implementierung
};

GeoLocation.prototype._initBackgroundGeolocation = function () {
    var backgroundGeolocation = this._geoLocationProvider.backgroundGeolocation;

    var _this = this;
    var callbackFn = function (location) {
        try {
            var pos = location;
            if (pos.latitude !== undefined && pos.longitude !== undefined && pos.coords === undefined) {
                // Creates data in form of the output from geolocation-plugin, so we do not have to change "geo.js"
                pos = {
                    coords: {
                        longitude: pos.longitude,
                        latitude: pos.latitude
                    }
                };
            }

            _this.onNewLocation(pos);
        } finally {
            /*
            IMPORTANT:
            You must execute the finish method here to inform the native plugin that you're finished, and the background-task may be completed.
            IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
            */
            backgroundGeolocation.finish();
        }
    };
    var failureFn = this.onNewLocationFailed;

    backgroundGeolocation.configure(callbackFn, failureFn, this._geolocationOpts);
};

/**
 * Startet die Überwachung der Position des Gerätes.
 * @param {Boolean} highAccuracy Gibt an, ob GPS für eine hohe Genauigkeit verwendet werden soll.
 * @param {Boolean} backgroundLocation Gibt an, ob die Position auch im Hintergrund abgefragt werden soll.
 * @returns {undefined}
 */
GeoLocation.prototype.startGeoWatch = function (highAccuracy, backgroundLocation) {
    if (highAccuracy === undefined) {
        highAccuracy = this.getDesiredAccuracy() <= this._highAccuracyValue;
    }
    if (backgroundLocation === undefined) {
        backgroundLocation = this.isBackgroundLocationEnabled();
    }

    var accuracyBool = !!highAccuracy;
    var accuracyString;
    if (accuracyBool === true) {
        accuracyString = "High accuracy";
    } else {
        accuracyString = "Low accuracy";
    }

    if (backgroundLocation === true) {
        accuracyString += " (Background tracking)";
    } else {
        accuracyString += " (No background tracking)";
    }

    this._setBackgroundLocationEnabled(backgroundLocation);
    this._setDesiredAccuracy(accuracyBool ? this._highAccuracyValue : this._lowAccuracyValue);
    this.stopGeoWatch();

    this._logger.log("startGeoWatch(): " + accuracyString);
    this._initBackgroundGeolocation();

    var _this = this;
    this._geoLocationProvider.backgroundGeolocation.start(function() {
        _this._setRunning(true);
    }, function (error) {
        _this._setRunning(false);
    });
};

/**
 * Stoppt die Überwachung der Position
 * @returns {undefined}
 */
GeoLocation.prototype.stopGeoWatch = function () {
    if (this.isRunning()) {
        this._logger.log("stopGeoWatch()");

        this._setRunning(false);
        this._geoLocationProvider.backgroundGeolocation.stop();
    }
};

/**
 * Fragt das Device-OS nach der Erlaubnis, Positionsdaten auszulesen.
 * Ggf. wird ein Dialog dem Benutzer angezeigt.
 * @param {Boolean} requestGps Gibt an, ob eine hohe Genauigkeit angefragt werden soll
 * @param {Boolean} backgroundPosition Gibt an, ob die Position auch im Hintergrund abgefragt werden soll.
 * @param {callback} errorCallback Wird aufgerufen, wenn die Operation nicht erfolgreich war.
 * @returns {undefined}
 */
GeoLocation.prototype.requestDeviceLocation = function (requestGps, backgroundPosition, errorCallback) {
    var requestAccuracy;
    var accuracyString;
    if (!!requestGps) {
        requestAccuracy = this._geoLocationProvider.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY;
        accuracyString = "High Accuracy";
        this._setDesiredAccuracy(this._highAccuracyValue);
    } else {
        requestAccuracy = this._geoLocationProvider.locationAccuracy.REQUEST_PRIORITY_BALANCED_POWER_ACCURACY;
        accuracyString = "Low Accuracy";
        this._setDesiredAccuracy(this._lowAccuracyValue);
    }

    var _this = this;
    this._geoLocationProvider.locationAccuracy.canRequest(function (canRequest) {
        if (canRequest) {
            _this._geoLocationProvider.locationAccuracy.request(function () {
                _this._geolocationEnabled = true;
                _this.startGeoWatch(undefined, backgroundPosition);
            }, function (error) {
                console.error("Request failed");
                _this._geolocationEnabled = false;
                _this._setRunning(false);

                if (errorCallback !== undefined) {
                    errorCallback(error);
                }

                if (error) {
                    // Android only
                    console.error("error code=" + error.code + "; error message=" + error.message);
                    if (error.code !== _this._geoLocationProvider.locationAccuracy.ERROR_USER_DISAGREED) {
                        var errorString = "Failed to automatically set Location Mode to '" + accuracyString + "'. " +
                                "Would you like to switch to the Location Settings page and do this manually?";

                        if (window.confirm(errorString)) {
                            _this._geoLocationProvider.diagnostic.switchToLocationSettings();
                        }
                    }
                }
            }, requestAccuracy); // iOS will ignore this
        } else {
            // iOS: Location Services is already ON
            // Android: No location permission
            _this._geolocationEnabled = true;
            _this.startGeoWatch(undefined, backgroundPosition);
        }
    });
};

/**
 * Ruft die übergebene Funktion auf, wenn sich der Status des Location Service ändert.
 * @param {callback} successCallback Wird aufgerufen, wenn sich der Status des Location Service ändert.
 *                   Es wird true übergeben, wenn der Standort verfügbar ist; false, wenn nicht.
 * @returns {undefined}
 */
GeoLocation.prototype.registerLocationStateChangeHandler = function (successCallback) {
    if (typeof successCallback !== 'function') {
        this._geoLocationProvider.backgroundGeolocation.stopWatchingLocationMode();
    } else {
        this._geoLocationProvider.backgroundGeolocation.watchLocationMode(function (success) {
            successCallback(success === 0 ? false : true);
        }, function (error) {
            successCallback(false);
        });
    }
};

/**
 * Prüft, ob GPS auf dem Gerät verfügbar ist.
 * @param {callback} successCallback Wird aufgerufen, wenn die Operation erfolgreich war.
 * @param {callback} errorCallback Wird aufgerufen, wenn die Operation nicht erfolgreich war.
 * @returns {undefined}
 */
GeoLocation.prototype.isGpsEnabled = function (successCallback, errorCallback) {
    throw {name: "NotImplementedError", message: "Must be implemented by merge file"};
};

/**
 * Gibt zurück, ob das Betriebssystem des Gerätes mehrere Genauigkeitsstufen unterstützt.
 * @returns {boolean} true, wenn mehrere Genauigkeitsstufen unterstützt werden; sonst false
 */
GeoLocation.prototype.supportsMultipleAccuracies = function () {
    throw {name: "NotImplementedError", message: "Must be implemented by merge file"};
};

GeoLocation.prototype.isLocationEnabled = function () {
    return this._geolocationEnabled;
};

GeoLocation.prototype.isRunning = function () {
    var isRunningString = window.sessionStorage.getItem("geolocation_running");
    return isRunningString !== undefined
        && isRunningString !== null
        && String(isRunningString).toLowerCase() == 'true';
};

GeoLocation.prototype._setRunning = function (running) {
    window.sessionStorage.setItem("geolocation_running", String(running)); 
};

GeoLocation.prototype.isBackgroundLocationEnabled = function () {
    var isBackgroundLocationString = window.sessionStorage.getItem("geolocation_backgroundLocation");
    if (isBackgroundLocationString === undefined || isBackgroundLocationString === null) {
        var defaultValue = this._geolocationOpts.startForeground;
        this._setBackgroundLocationEnabled(defaultValue);
        return defaultValue;
    }

    return String(isBackgroundLocationString).toLowerCase() == 'true';
};

GeoLocation.prototype._setBackgroundLocationEnabled = function (backgroundLocation) {
    this._geolocationOpts.startForeground = backgroundLocation;
    window.sessionStorage.setItem("geolocation_backgroundLocation", String(backgroundLocation)); 
};

GeoLocation.prototype.getDesiredAccuracy = function () {
    var desiredAccuracyString = window.sessionStorage.getItem("geolocation_desiredAccuracy");
    if (desiredAccuracyString === undefined || desiredAccuracyString === null) {
        var defaultValue = this._geolocationOpts.desiredAccuracy;
        this._setDesiredAccuracy(defaultValue);
        return defaultValue;
    }

    return Number(desiredAccuracyString);
};

GeoLocation.prototype._setDesiredAccuracy = function (desiredAccuracy) {
    this._geolocationOpts.desiredAccuracy = desiredAccuracy;
    window.sessionStorage.setItem("geolocation_desiredAccuracy", String(desiredAccuracy));
};