/**
 * Prüft, ob GPS auf dem Android-Gerät verfügbar ist.
 * Hinweis: Diese Funktion wird nur auf Android-Geräten ausgeführt.
 * @param {callback} successCallback Wird aufgerufen, wenn die Operation erfolgreich war.
 * @param {callback} errorCallback Wird aufgerufen, wenn die Operation nicht erfolgreich war.
 * @returns {undefined}
 */
GeoLocation.prototype.isGpsEnabled = function (successCallback, errorCallback) {
    if (successCallback === undefined) {
        return;
    }

    this._geoLocationProvider.diagnostic.isGpsLocationEnabled(successCallback, errorCallback);
};

/**
 * Gibt zurück, ob das Betriebssystem des Gerätes mehrere Genauigkeitsstufen unterstützt.
 * Hinweis: Diese Funktion wird nur auf Android-Geräten ausgeführt und gibt immer true zurück.
 * @returns {boolean} true
 */
GeoLocation.prototype.supportsMultipleAccuracies = function () {
    return true;
};