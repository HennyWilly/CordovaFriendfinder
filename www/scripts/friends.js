function friendsOAuthExpired() {
    // Beendet das (evtl. eingeschaltete) Background-Tracking
    oAuthExpired_geo();
}

function logout() {
    friendsOAuthExpired();
    oAuth.clearToken();
    document.location.href = "login.html";
}

function showAllFriends() {
    getFriends_oAuth(function (result) {
        var list = $("#friendsList");

        list.empty();
        $.each(result, function (index, entry) {
            addUserListEntry(list, entry, true, true);
        });
        ensureListNotEmpty(list, true);
    }, function (jqXHR, textStatus, errorThrown) {
        navigator.notification.alert(getAjaxErrorMessage(jqXHR, textStatus), function () { }, errorThrown.name);
    }, friendsOAuthExpired);
}

function searchUsers(searchTerm) {
    if (!isNullOrWhitespace(searchTerm)) {
        seachForUsers_oAuth(searchTerm, function (result) {
            var list = $("#friendsList");

            list.empty();
            $.each(result, function (index, entry) {
                addUserListEntry(list, entry.name, entry.isFriend, false);
            });
            ensureListNotEmpty(list, false);
        }, function (jqXHR, textStatus, errorThrown) {
            navigator.notification.alert(getAjaxErrorMessage(jqXHR, textStatus), function () { }, errorThrown.name);
        }, friendsOAuthExpired);
    }
}

function getUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function ensureListNotEmpty(list, isFriendList) {
    var placeholderCard = $("#placeholderThumbnail");
    var nonPlaceholderCards = list.find(".thumbnail").not(placeholderCard);
    if (nonPlaceholderCards.length === 0) {
        var cardText;
        if (isFriendList) {
            cardText = "You have no friends";
        } else {
            cardText = "No users found";
        }

        var placeholderHtml =
                '<div class="thumbnail" id="placeholderThumbnail">' +
                '    <h3>' + cardText + '</h3>' +
                '</div>';
        list.append('<li>' + placeholderHtml + '</li>');
    } else if (placeholderCard.length !== 0) {
        placeholderCard.remove();
    }
}

function addUserListEntry(list, name, isFriend, isFriendList) {
    var uuid = getUUID();
    var getCardHtml = function () {
        var showLastPositionButton = "";
        if (isFriend) {
            showLastPositionButton = '<button type="button" class="btn btn-default" id="showPositionButton">' +
                '        Show last position' +
                '    </button>';
        }

        return '<div class="thumbnail" id="' + uuid + '">' +
                '    <h3>' + name + '</h3>' +
                '    <button type="button" class="btn btn-default" id="mainButton" ' +
                '            data-loading-text="<i class=\'glyphicon glyphicon-refresh spinning\'></i> Loading">' +
                '    ' + (isFriend ? 'Unfriend' : 'Add friend') +
                '    </button>' +
                '    ' + showLastPositionButton +
                '</div>';
    };
    list.append('<li>' + getCardHtml() + '</li>');
    var getCard = function () {
        return $('#' + uuid);
    };
    var getButton = function () {
        return getCard().find('#mainButton');
    };
    var getPositionButton = function () {
        return getCard().find('#showPositionButton');
    };
    var showLastPositionButtonCallback = function () {
        findLastUserPosition_oAuth(name, function (result) {
            if (isNullOrWhitespace(result)) {
                navigator.notification.alert('No position found for user ' + name, function () { }, "No position found");
                return;
            }

            var resultJson = JSON.stringify(result);
            var url = 'index.html?position=' + encodeURIComponent(resultJson);

            // _self ist wichtig, sonst öffnet sich die Seite auf iOS-Geräten nicht...
            window.open(url, '_self');
        }, function (jqXHR, textStatus, errorThrown) {
            navigator.notification.alert('Error loading user position:\n' + getAjaxErrorMessage(jqXHR, textStatus), function () { }, errorThrown.name);
        }, friendsOAuthExpired);
    };
    var clickCallback = function () {
        var btn = $(this);
        btn.button('loading');

        var restFunc;
        if (isFriend) {
            restFunc = unfriend_oAuth;
        } else {
            restFunc = addFriend_oAuth;
        }

        restFunc(name, function () {
            btn.button('reset');

            isFriend = !isFriend;
            if (isFriendList) {
                getCard().parent().remove();
            } else {
                getCard().replaceWith(getCardHtml());
                getButton().on('click', clickCallback);
                getPositionButton().on('click', showLastPositionButtonCallback);
            }

            ensureListNotEmpty(list, isFriendList);
        }, function () {
            btn.button('reset');
            alert('Fail');
        }, friendsOAuthExpired);
    };

    getButton().on('click', clickCallback);
    getPositionButton().on('click', showLastPositionButtonCallback);
}

function restartGeoLocation() {
    var geowatchRunning = geoLocation.isRunning();

    geoLocation.stopGeoWatch();
    if (geowatchRunning) {
        // Erneutes registrieren der Callbacks für empfangene Positionen
        geoLocation.startGeoWatch();
    }
}

function registerLifeCycleEvents() {
    var backgroundEnabled = false;
    var running = false;

    document.addEventListener("pause", function () {
        logger.log("onPause()");
        backgroundEnabled = geoLocation.isBackgroundLocationEnabled();
        running = geoLocation.isRunning();

        if (!backgroundEnabled) {
            deviceStompClient.disconnect();
            if (running) {
                geoLocation.stopGeoWatch();
            }
        }
    }, false);
    document.addEventListener("resume", function () {
        logger.log("onResume()");

        if (!deviceStompClient.isConnected()) {
            deviceStompConnect(false);
        }

        if (running && !backgroundEnabled) {
            geoLocation.startGeoWatch();
        }
    }, false);
}

$(function () {
    window.isPhone = false;
    if(document.URL.indexOf("http://") === -1 && document.URL.indexOf("https://") === -1) {
        window.isPhone = true;
    }

    if(window.isPhone) {
        document.addEventListener('deviceready', onDeviceReady, false);
    } else {
        onDeviceReady();
    }
});

function onDeviceReady() {
    var currentPage = window.location.href;
    window.sessionStorage.setItem("page", currentPage); 

    $("#loginLink").click(function (e) {
        // Klick auf den Logout Button

        e.preventDefault();
        logout();
    });
    $("#showFriendsLink").click(function (e) {
        e.preventDefault();
        showAllFriends();
        $('.navbar-collapse').collapse('hide');
    });
    $("#searchBarForm").on("submit", function (e) {
        e.preventDefault();
        var text = $("#srch-term").val();
        searchUsers(text);
        $('.navbar-collapse').collapse('hide');
        return false;
    });

    // Logger initialisieren, da geoMain nicht aufgerufen wurde...
    logger = new Logger(undefined, undefined);

    deviceStompInit(false);
    locationInit(false);
    registerLocationStateChangeHandler(false);
    restartGeoLocation();

    registerLifeCycleEvents();

    // Erst aufrufen, wenn Cordova bereit ist, sonst funktioniert die 'navigator.notification.alert'-Methode nicht...
    showAllFriends();
}