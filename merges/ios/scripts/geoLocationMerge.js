/**
 * Prüft, ob GPS auf dem iOS-Gerät verfügbar ist.
 * Hinweis: Diese Funktion wird nur auf iOS-Geräten ausgeführt.
 * @param {callback} successCallback Wird aufgerufen, wenn die Operation erfolgreich war.
 * @param {callback} errorCallback Wird aufgerufen, wenn die Operation nicht erfolgreich war.
 * @returns {undefined}
 */
GeoLocation.prototype.isGpsEnabled = function (successCallback, errorCallback) {
    if (successCallback === undefined) {
        return;
    }

    this._geoLocationProvider.diagnostic.isLocationEnabled(successCallback, errorCallback);
};

/**
 * Gibt zurück, ob das Betriebssystem des Gerätes mehrere Genauigkeitsstufen unterstützt.
 * Hinweis: Diese Funktion wird nur auf iOS-Geräten ausgeführt und gibt immer false zurück.
 * @returns {boolean} false
 */
GeoLocation.prototype.supportsMultipleAccuracies = function () {
    return false;
};