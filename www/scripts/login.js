function checkPreAuth() {
    var existingToken = oAuth.getToken();
    if (existingToken !== undefined) {
        refreshOAuth2Token(function () {
            document.location.href = "index.html";
        }, function (jqXHR, textStatus, errorThrown) {
            var errorString;
            if (jqXHR.status === 400) {
                errorString = "Login expired! Please log in again!";
                oAuth.clearToken();
            } else {
                errorString = 'Could not log in automatically:\n' + getAjaxErrorMessage(jqXHR, textStatus);
            }
            navigator.notification.alert(errorString, function () { }, errorThrown.name);
        });
    }
}

function isDataOk() {
    var usernameInput = $("#username");
    var username = usernameInput.val();
    var usernameBox = usernameInput.closest(".form-group");
    var usernameError = usernameBox.find(".help-block");

    var passwordInput = $("#password");
    var password = passwordInput.val();
    var passwordBox = passwordInput.closest(".form-group");
    var passwordError = passwordBox.find(".help-block");

    var ok = true;
    if (isNullOrWhitespace(username)) {
        ok = false;
        usernameError.text("Enter a username");
        usernameBox.addClass("has-error");
    } else {
        usernameBox.removeClass("has-error");
    }

    if (isNullOrWhitespace(password)) {
        ok = false;
        passwordError.text("Enter a password");
        passwordBox.addClass("has-error");
    } else {
        passwordBox.removeClass("has-error");
    }

    return ok;
}

function disableButton(loadButton) {
    //disable the button so we can't resubmit while we wait
    loadButton.button('loading');
}

function enableButton(loadButton) {
    loadButton.button('reset');
}

function handleLogin(form) {
    var username = $("#username", form).val();
    var password = $("#password", form).val();
    var rememberMe = $("#rememberMe").is(':checked');

    var loginButton = $("#submitButton");
    if (isDataOk()) {
        disableButton(loginButton);

        getOAuth2Token(username, password, rememberMe, function (res) {
            if (res["access_token"] !== undefined) {
                document.location.href = "index.html";
            } else {
                enableButton(loginButton);
                navigator.notification.alert("Your login failed", function () { });
            }
        }, function (jqXHR, textStatus, errorThrown) {
            enableButton(loginButton);

            var errorString;
            if (jqXHR.status === 400) {
                var responseJSON = jqXHR.responseJSON;
                if (responseJSON !== undefined && responseJSON['error_description'] !== undefined) {
                    errorString = responseJSON['error_description'];
                } else {
                    errorString = getAjaxErrorMessage(jqXHR, textStatus);
                }
            } else {
                errorString = getAjaxErrorMessage(jqXHR, textStatus);
            }
            navigator.notification.alert(errorString, function () { }, errorThrown.name);
        });
    }
    return false;
}

function resetPassword() {
    var email = $("#email").val();

    var resetButton = $("#resetPwButton");
    disableButton(resetButton);

    resetPassword_REST(email, function () {
        enableButton(resetButton);
        $("email").val("");
        $('#forgotPasswordModal').modal('hide');

        navigator.notification.alert('Please check your mails to reset your password', function () { }, "Mail send");
    }, function (jqXHR, textStatus, errorThrown) {
        enableButton(resetButton);
        navigator.notification.alert('Could reset password:\n' + getAjaxErrorMessage(jqXHR, textStatus), function () { }, errorThrown.name);
    });

    return false;
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
    var previouspage = window.sessionStorage.getItem("page");

    var currentPage = window.location.href;
    window.sessionStorage.setItem("page", currentPage); 

    $("#loginForm").on("submit", function (e) {
        e.preventDefault();
        return handleLogin($(this));
    });

    $("#forgotPasswordForm").on('submit', function (e) {
        // Hier landen wir erst, wenn eine valide Email-Adresse angegeben wurde. HTML5 sei Dank!

        e.preventDefault();
        return resetPassword();
    });

    // Schließt den modalen Dialog mit dem Back-Button
    document.addEventListener('backbutton', function (e) {
        e.preventDefault();

		// Siehe https://stackoverflow.com/a/21341587
        var modalDialog = $('#forgotPasswordModal');
        if ((modalDialog.data('bs.modal') || {isShown: false}).isShown) {
            modalDialog.modal('hide');
        } else {
            navigator.app.exitApp();
        }
    }, false);

    // Wenn Prev-Page null/undefined ist, wurde die App gerade erst gestartet...
    if (previouspage === undefined || previouspage === null) {
        // Erst aufrufen, wenn Cordova bereit ist, sonst funktioniert die 'navigator.notification.alert'-Methode nicht...
        checkPreAuth();
    } else {
        // Wenn es eine Prev-Page gibt, dann hat man irgendwo auf Logout oder den BackButton geklickt.
        // Dient dazu, dass beim BackButton-Klick nicht automatisch wieder angemeldet wird
        oAuth.clearToken();
    }
}