"use strict";

/**
 * Erstellt eine neue OAuth-Instanz, die die Verwaltung von OAuth2-Tokens kapselt.
 * @param {String} storageName Der Schlüsselname, unter dem das Token gespeichert wird.
 * @returns {OAuth} Neue OAuth-Instanz
 */
function OAuth(storageName) {
    this._storageName = String(storageName);

    // Beim Starten wird das persitierte Token in die Session geladen.
    if (window.localStorage[this._storageName] !== undefined) {
        window.sessionStorage[this._storageName] = window.localStorage[this._storageName];
    }
}

/**
 * Gibt das gespeicherte Token zurück, falls es existiert.
 * @returns {undefined|Object} Das gespeicherte Token, oder undefined
 */
OAuth.prototype.getToken = function () {
    var tokenString;
    if (window.sessionStorage[this._storageName] !== undefined) {
        tokenString = window.sessionStorage[this._storageName];
    } else if (window.localStorage[this._storageName] !== undefined) {
        // Irgendwie ist Inkonsistenz aufgetreten => korrigieren!
        window.sessionStorage[this._storageName] = window.localStorage[this._storageName];

        tokenString = window.localStorage[this._storageName];
    } else {
        return undefined;
    }

    return JSON.parse(tokenString);
};

/**
 * Gibt das gespeicherte Access-Token zurück, falls es existiert.
 * @returns {undefined|String} Das gespeicherte Access-Token, oder undefined
 */
OAuth.prototype.getAccessToken = function () {
    var tokenJson = this.getToken();
    if (tokenJson === undefined) {
        return undefined;
    }
    return tokenJson["access_token"];
};

/**
 * Gibt das gespeicherte Refresh-Token zurück, falls es existiert.
 * @returns {undefined|String} Das gespeicherte Refresh-Token, oder undefined
 */
OAuth.prototype.getRefreshToken = function () {
    var tokenJson = this.getToken();
    if (tokenJson === undefined) {
        return undefined;
    }
    return tokenJson["refresh_token"];
};

/**
 * Speichert das übergebene Token.
 * @param {Object} token Das Token
 * @param {boolean} usePermantentStorage Wenn true, wird das Token zusätzlich in den persistenten Speicher geschrieben.
 * Bei false oder keinem Wert wird nur der Session-Speicher verwendet.
 * @returns {undefined}
 */
OAuth.prototype.storeToken = function (token, usePermantentStorage) {
    if (token === undefined || token["access_token"] === undefined) {
        return;
    }

    var stringToken = JSON.stringify(token);
    window.sessionStorage[this._storageName] = stringToken;
    if (!!usePermantentStorage) {
        window.localStorage[this._storageName] = stringToken;
    }
};

/**
 * Aktualisiert das gespeicherte Token mit dem übergebenen Token.
 * @param {Object} token Das neue Token
 * @returns {undefined}
 */
OAuth.prototype.refreshToken = function (token) {
    var permanent = window.sessionStorage[this._storageName] === window.localStorage[this._storageName];
    this.storeToken(token, permanent);
};

/**
 * Löscht das gespeicherte Token.
 * @returns {undefined}
 */
OAuth.prototype.clearToken = function () {
    delete window.sessionStorage[this._storageName];
    delete window.localStorage[this._storageName];
};