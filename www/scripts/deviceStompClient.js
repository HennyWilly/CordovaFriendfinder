"use strict";

/**
 * Erstellt eine neue Instanz der StompClient Klasse, die zum Versenden und Empfangen von Servernachrichten dient.
 * @param {type} url Die URL des Servers
 * @param {type} deviceUUID Die UUID des Gerätes.
 * @returns {DeviceStompClient} Die neue StompClient-Instanz
 */
function DeviceStompClient(url, deviceUUID) {
    this._url = url;
    this._deviceUUID = String(deviceUUID);

    this._stompClient = undefined;
}

/**
 * Wird aufgerufen, wenn eine Nachricht über ein oder mehrere neue Geräte empfangen wurde.
 * @param {type} positions Die Liste der neuen Geräte mit deren Positionen
 * @returns {undefined}
 */
DeviceStompClient.prototype.onDevicePositionChange = function (positions) {
};

/**
 * Wird aufgerufen, wenn ein anders Gerät die Verbindung zum Server trennt.
 * @param {type} deviceId Die UUID des Gerätes, das die Verbindung getrennt hat.
 * @returns {undefined}
 */
DeviceStompClient.prototype.onDeviceDisconnected = function (deviceId) {
};

/**
 * Gibt zurück, ob eine Stomp-Verbindung zum Server besteht
 * @returns {Boolean} true, wenn eine Verbindung besteht; sonst false
 */
DeviceStompClient.prototype.isConnected = function () {
    return this._stompClient !== undefined && this._stompClient.connected === true;
};

/**
 * Verbindet sich mit dem Server.
 * @param {Array} extensions Die Zusätze zu den Subscribtion-Urls
 * @returns {undefined}
 */
DeviceStompClient.prototype.connect = function (extensions) {

    if (this.isConnected()) {
        return;
    }

    var socket = new SockJS(this._url);
    this._stompClient = Stomp.over(socket);

    var _this = this;
    this._stompClient.connect({'deviceUUID': this._deviceUUID}, function () {
        $.each(extensions, function (index, value) {
            _this._stompClient.subscribe('/topic/device-position-change/' + value, function (message) {
                var positions = JSON.parse(message.body);
                _this.onDevicePositionChange(positions);
            });
        });
        _this._stompClient.subscribe('/topic/device-disconnected', function (message) {
            var deviceId = message.body;
            _this.onDeviceDisconnected(deviceId);
        });
    }, function (e) {
        _this._stompClient = undefined;
    });
};

/**
 * Trennt die Verbindung zum Server.
 * @returns {undefined}
 */
DeviceStompClient.prototype.disconnect = function () {
    if (!this.isConnected()) {
        return;
    }

    this._stompClient.disconnect();
    this._stompClient = undefined;
};