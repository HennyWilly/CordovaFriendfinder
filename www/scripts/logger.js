"use strict";

/**
 * Erstellt einen neuen Logger
 * @param {String} loggerName Der Name des Loggers
 * @param {DOM} textElement Ein DOM-Element in das zusätzlich der zu loggende Text geschrieben werden soll
 * @returns {Logger} Neue Logger-Instanz
 */
function Logger(loggerName, textElement) {
    this._prefix = "";
    if (loggerName !== undefined && loggerName !== null && loggerName.trim().length > 0) {
        this._prefix += String(loggerName) + ": ";
    }
    this._textElement = $(textElement);
}

/**
 * Loggt den übergebenen Text
 * @param {type} str Zu loggender Text
 * @returns {undefined}
 */
Logger.prototype.log = function (str) {
    var logString = this._prefix + str;
    console.log(logString);

    if (this._textElement.length > 0) {
        this._textElement.css('color', '');
        this._textElement.text(logString);
    }
};

/**
 * Loggt den übergebenen Fehlertext
 * @param {type} str Zu loggender Fehlertext
 * @returns {undefined}
 */
Logger.prototype.error = function (str) {
    var logString = this._prefix + str;
    console.error(logString);

    if (this._textElement.length > 0) {
        this._textElement.css('color', 'red');
        this._textElement.text(logString);
    }
};