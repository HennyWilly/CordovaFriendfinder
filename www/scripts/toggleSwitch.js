"use strict";

/**
 * Erstellt eine neue ToggleSwitch-Instanz, die einen HTML-ToggleSwitch kapselt.
 * @param {type} toggleBox Das DOM-Objekt des ToggleSwitches
 * @param {boolean} canUnselectButton Gibt an, ob ein Button mit einem Klick deselectiert werden kann, wenn er bereits selektiert ist.
 * @returns {ToggleSwitch} Eine neue ToggleSwitch-Instanz
 */
function ToggleSwitch(toggleBox, canUnselectButton) {
    this._toggleBox = $(toggleBox);
    if (this._toggleBox.length === 0) {
        throw new ReferenceError("ToggleBox nicht referenziert");
    }

    var buttons = this._toggleBox.find(".btn");
    if (buttons.length !== 2) {
        throw new RangeError("ToggleBox enthält keine 2 Buttons");
    }

    this._firstButton = $(buttons[0]);
    this._secondButton = $(buttons[1]);

    if (typeof canUnselectButton !== 'boolean' && !(typeof canUnselectButton === 'object' && typeof canUnselectButton.valueOf() === 'boolean')) {
        canUnselectButton = true;
    }

    var thisClass = this;
    buttons.click(function () {
        var _button = $(this);
        var active = thisClass.getActiveButtons();
        if (active.length === 1 && active[0] === _button[0]) {
            if (canUnselectButton) { 
                thisClass.clear();
                thisClass.onToggleButtonChanged(undefined);
            }
        } else if (_button[0] === thisClass._firstButton[0]) {
            thisClass.enableFirst();
            thisClass.onToggleButtonChanged(thisClass._firstButton);
        } else if (_button[0] === thisClass._secondButton[0]) {
            thisClass.enableSecond();
            thisClass.onToggleButtonChanged(thisClass._secondButton);
        }
    });
}

/**
 * Wird aufgerufen, wenn der Benutzer auf einen Button des Switches klickt.
 * @param {DOM-Objekt} button Das DOM-Objekt des aktiven Buttons, oder "undefined" wenn kein Button aktiv ist
 * @returns {undefined}
 */
ToggleSwitch.prototype.onToggleButtonChanged = function (button) {
    // Leere Implementierung
};

/**
 * Gibt eine Aufzählung aller Buttons zurück, die momentan aktiv sind
 * @returns {$|_$} jQuery-Liste aller aktiven Buttons
 */
ToggleSwitch.prototype.getActiveButtons = function () {
    var active = [];
    if (this._firstButton.hasClass('active')) {
        $.merge(active, this._firstButton);
    }
    if (this._secondButton.hasClass('active')) {
        $.merge(active, this._secondButton);
    }
    return $(active);
};

/**
 * Gibt eine Aufzählung aller Buttons zurück, die momentan inaktiv sind
 * @returns {$|_$} jQuery-Liste aller inaktiven Buttons
 */
ToggleSwitch.prototype.getInactiveButtons = function () {
    var inactive = [];
    if (!this._firstButton.hasClass('active')) {
        $.merge(inactive, this._firstButton);
    }
    if (!this._secondButton.hasClass('active')) {
        $.merge(inactive, this._secondButton);
    }
    return $(inactive);
};

/**
 * Schaltet von einem aktiven Button auf den anderen um.
 * Wenn kein Button aktiv ist, geschieht nichts.
 * @returns {undefined}
 */
ToggleSwitch.prototype.toggle = function () {
    var active = this.getActiveButtons();
    var other = this.getInactiveButtons();

    if (active.length === 1 && other.length === 1) {
        active.removeClass('active');
        active.removeClass('btn-primary');
        active.removeClass('btn-default');

        other.addClass('active');
        other.addClass('btn-primary');
        other.addClass('btn-default');
    }
};

/**
 * Legt beide Buttons als inaktiv fest.
 * @returns {undefined}
 */
ToggleSwitch.prototype.clear = function () {
    var active = this._toggleBox.find('.btn.active');

    active.removeClass('active');
    active.removeClass('btn-primary');
    active.removeClass('btn-default');
};

/**
 * Legt den ersten Button als aktiv und den zweiten als inaktiv fest.
 * @returns {undefined}
 */
ToggleSwitch.prototype.enableFirst = function () {
    if (!this.isFirstActive()) {
        var active = this.getActiveButtons();
        active.removeClass('active');
        active.removeClass('btn-primary');
        active.removeClass('btn-default');

        this._firstButton.addClass('active');
        this._firstButton.addClass('btn-primary');
        this._firstButton.addClass('btn-default');
    }
};

/**
 * Legt den zweiten Button als aktiv und den ersten als inaktiv fest.
 * @returns {undefined}
 */
ToggleSwitch.prototype.enableSecond = function () {
    if (!this.isSecondActive()) {
        var active = this.getActiveButtons();
        active.removeClass('active');
        active.removeClass('btn-primary');
        active.removeClass('btn-default');

        this._secondButton.addClass('active');
        this._secondButton.addClass('btn-primary');
        this._secondButton.addClass('btn-default');
    }
};

/**
 * Deaktiviert den ersten Button.
 * @returns {undefined}
 */
ToggleSwitch.prototype.disableFirstButton = function () {
    this._firstButton.removeClass('active');
    this._firstButton.removeClass('btn-primary');
    this._firstButton.removeClass('btn-default');

    this._firstButton.prop('disabled', true);
}

/**
 * Gibt zurück, ob der erste Button selektiert ist.
 * @returns {boolean} true, wenn der erste Button selektiert ist; sonst false
 */
ToggleSwitch.prototype.isFirstActive = function () {
    var active = this.getActiveButtons();
    var result = false;

    var _this = this;
    $.each(active, function (idx, elem) {
        if (elem === _this._firstButton[0]) {
            result = true;
            return false;
        }
    });
    return result;
}

/**
 * Gibt zurück, ob der zweite Button selektiert ist.
 * @returns {boolean} true, wenn der zweite Button selektiert ist; sonst false
 */
ToggleSwitch.prototype.isSecondActive = function () {
    var active = this.getActiveButtons();
    var result = false;

    var _this = this;
    $.each(active, function (idx, elem) {
        if (elem === _this._secondButton[0]) {
            result = true;
            return false;
        }
    });
    return result;
}