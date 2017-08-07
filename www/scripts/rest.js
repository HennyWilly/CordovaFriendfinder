var backendUrl = "http://backend.cordova.svc.cluster.fb9.fh-aachen.de";
//var backendUrl = "http://192.168.178.26:80";
//var backendUrl = "http://10.42.0.1:80";
//var backendUrl = "http://10.42.0.1:8080";
//var backendUrl = "http://10.0.2.2:8080";
//var backendUrl = "http://localhost:8080";
//var backendUrl = "http://192.168.178.100:8080";

var oAuth = new OAuth("oAuthToken");

function getAjaxErrorMessage(jqXHR, textStatus) {
    if (jqXHR.status === 0) {
        return 'No network connection or server down!';
    }
    if (jqXHR.status === 404) {
        return 'Requested page not found [404]';
    }
    if (jqXHR.status === 500) {
        return 'Internal Server Error [500]';
    }
    if (textStatus === 'parsererror') {
        return 'Requested JSON parse failed.';
    }
    if (textStatus === 'timeout') {
        return 'Time out error.';
    }
    if (textStatus === 'abort') {
        return 'Ajax request aborted.';
    }
    return 'Uncaught Error: ' + jqXHR.responseText;
}

function submitDevicePosition_oAuth(deviceName, latitude, longitude, successCallback, oAuthExpiredCallback) {
    var bodyString = JSON.stringify({
        "latitude": latitude,
        "longitude": longitude
    });
    var ajaxParams = {
        contentType: 'application/json',
        data: bodyString
    };
    var url = '/position/store?deviceId=' + encodeURIComponent(deviceName);
    oAuthAjax(url, "POST", ajaxParams, successCallback, undefined, oAuthExpiredCallback);
}

function getDevicePositionsOfTile_oAuth(zoom, x, y, successCallback, oAuthExpiredCallback) {
    var ajaxParams = {
        // dataType: "json" sorgt dafür, dass das Ergebis immer JSON ist
        dataType: "json",
        mimeType: 'application/json'
    };
    var url = '/position/retrieve/tile/' + zoom + '/' + x + '/' + y;
    oAuthAjax(url, "GET", ajaxParams, successCallback, undefined, oAuthExpiredCallback);
}

function seachForUsers_oAuth(searchTerm, successCallback, errorCallback, oAuthExpiredCallback) {
    var ajaxParams = {
        // dataType: "json" sorgt dafür, dass das Ergebis immer JSON ist
        dataType: "json",
        mimeType: 'application/json'
    };
    var url = '/users/search?searchTerm=' + encodeURIComponent(searchTerm);
    oAuthAjax(url, "GET", ajaxParams, successCallback, errorCallback, oAuthExpiredCallback);
}

function getFriends_oAuth(successCallback, errorCallback, oAuthExpiredCallback) {
    var ajaxParams = {
        // dataType: "json" sorgt dafür, dass das Ergebis immer JSON ist
        dataType: "json",
        mimeType: 'application/json'
    };
    var url = '/users/friends';
    oAuthAjax(url, "GET", ajaxParams, successCallback, errorCallback, oAuthExpiredCallback);
}

function unfriend_oAuth(username, successCallback, errorCallback, oAuthExpiredCallback) {
    var url = '/users/unfriend?user=' + encodeURIComponent(username);
    oAuthAjax(url, "POST", undefined, successCallback, errorCallback, oAuthExpiredCallback);
}

function addFriend_oAuth(username, successCallback, errorCallback, oAuthExpiredCallback) {
    var url = '/users/addFriend?user=' + encodeURIComponent(username);
    oAuthAjax(url, "POST", undefined, successCallback, errorCallback, oAuthExpiredCallback);
}

function findLastUserPosition_oAuth(username, successCallback, errorCallback, oAuthExpiredCallback) {
    var url = '/position/retrieve?user=' + encodeURIComponent(username);
    oAuthAjax(url, "GET", undefined, successCallback, errorCallback, oAuthExpiredCallback);
}

function resetPassword_REST(email, successCallback, errorCallback) {
    var url = backendUrl + '/users/resetPassword' +
            '?email=' + encodeURIComponent(email);

    $.ajax({
        type: 'POST',
        url: url,
        cache: false,
        crossDomain: true,
        success: function (res) {
            if (successCallback !== undefined) {
                successCallback(res);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (errorCallback !== undefined) {
                errorCallback(jqXHR, textStatus, errorThrown);
            } else {
                console.error("SignUp AJAX Error: " + textStatus, errorThrown);
            }
        }
    });
}

function signup_REST(email, username, password, successCallback, errorCallback) {
    var url = backendUrl + '/users/signup' +
            '?email=' + encodeURIComponent(email) +
            '&user=' + encodeURIComponent(username) +
            '&password=' + encodeURIComponent(password);

    $.ajax({
        type: 'POST',
        url: url,
        cache: false,
        crossDomain: true,
        success: function (res) {
            if (successCallback !== undefined) {
                successCallback(res);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (errorCallback !== undefined) {
                errorCallback(jqXHR, textStatus, errorThrown);
            } else {
                console.error("SignUp AJAX Error: " + textStatus, errorThrown);
            }
        }
    });
}

function oAuthAjax(url, method, ajaxParams, successCallback, errorCallback, oAuthExpiredCallback) {
    var oAuthExpired = function () {
        // Wenn wir das Token nicht aktualisieren können, wird auf Login umgeleitet
        oAuth.clearToken();
        if (oAuthExpiredCallback !== undefined) {
            oAuthExpiredCallback();
        }
        document.location.href = "login.html";
    };

    var ajaxUrl = backendUrl + url;
    var authHeader = "Bearer " + oAuth.getAccessToken();
    var ajaxJson = {
        url: ajaxUrl,
        method: method,
        headers: {
            "Authorization": authHeader
        },
        crossDomain: true,
        success: function (result) {
            if (successCallback !== undefined) {
                successCallback(result);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            var oAuthStatus = jqXHR.getResponseHeader("WWW-Authenticate");
            if (oAuthStatus !== undefined && oAuthStatus !== null) {
                refreshOAuth2Token(function () {
                    oAuthAjax(url, method, ajaxParams, successCallback, errorCallback);
                }, oAuthExpired);
            } else {
                if (errorCallback !== undefined) {
                    errorCallback(jqXHR, textStatus, errorThrown);
                } else {
                    console.error("OAuth2 AJAX Error: " + textStatus, errorThrown);
                    if (jqXHR.status === 0) {
                        // Connection lost!
                        oAuthExpired();
                    }
                }
            }
        }
    };
    if (ajaxParams !== undefined) {
        for (var param in ajaxParams) {
            ajaxJson[param] = ajaxParams[param];
        }
    }

    $.ajax(ajaxJson);
}

function getOAuth2Token(username, password, rememberMe, successCallback, errorCallback) {
    var oAuthUrl = backendUrl + '/oauth/token?grant_type=password' +
            '&username=' + encodeURIComponent(username) +
            '&password=' + encodeURIComponent(password);
    $.ajax({
        type: 'POST',
        url: oAuthUrl,
        cache: false,
        crossDomain: true,
        async: false,
        headers: {
            Authorization: "Basic Y29yZG92YS1hcHAtY2xpZW50OnRoaXMtaXMtYS1zZWNyZXQ="
        },
        success: function (res) {
            oAuth.storeToken(res, rememberMe);
            if (successCallback !== undefined) {
                successCallback(res);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            if (errorCallback !== undefined) {
                errorCallback(jqXHR, textStatus, errorThrown);
            } else {
                console.error("OAuth2 GetToken AJAX Error: " + textStatus, errorThrown);
            }
        }
    });
}

function refreshOAuth2Token(successCallback, errorCallback) {
    var errorHandler = function (jqXHR, textStatus, errorThrown) {
        if (errorCallback !== undefined) {
            errorCallback(jqXHR, textStatus, errorThrown);
        } else {
            console.error("OAuth2 RefreshToken AJAX Error: " + textStatus, errorThrown);
        }
    };

    var refreshToken = oAuth.getRefreshToken();
    if (refreshToken === undefined) {
        errorHandler(undefined, "No refresh token found", undefined);
        return;
    }

    var oAuthUrl = backendUrl + '/oauth/token?grant_type=refresh_token&refresh_token=' + refreshToken;
    $.ajax({
        type: 'POST',
        url: oAuthUrl,
        cache: false,
        crossDomain: true,
        async: false,
        headers: {
            Authorization: "Basic Y29yZG92YS1hcHAtY2xpZW50OnRoaXMtaXMtYS1zZWNyZXQ="
        },
        success: function (res) {
            oAuth.refreshToken(res);
            if (successCallback !== undefined) {
                successCallback(res);
            }
        },
        error: errorHandler
    });
}

$(function () {
    $.support.cors = true;
});