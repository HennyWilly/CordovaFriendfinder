"use strict";

/**
 * Prüft, ob die Position auf dem Gerät verfügbar ist.
 * Diese Funktion dient als Fallback, wenn keine passende Merge-Datei gefunden wurde.
 * @param {callback} successCallback Wird aufgerufen, wenn die Operation erfolgreich war.
 * @param {callback} errorCallback Wird aufgerufen, wenn die Operation nicht erfolgreich war.
 * @returns {undefined}
 */
GeoLocation.prototype.isGpsEnabled = function (successCallback, errorCallback) {
    if (successCallback === undefined) {
        return;
    }

    this._geoLocationProvider.diagnostic.isLocationAvailable(successCallback, errorCallback);
};