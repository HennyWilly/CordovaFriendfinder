function isDataOk() {
    var usernameInput = $("#username");
    var username = usernameInput.val();
    var usernameBox = usernameInput.closest(".form-group");
    var usernameError = usernameBox.find(".help-block");

    var passwordInput = $("#password");
    var password = passwordInput.val();
    var passwordBox = passwordInput.closest(".form-group");
    var passwordError = passwordBox.find(".help-block");

    var password2Input = $("#password2");
    var password2 = password2Input.val();
    var password2Box = password2Input.closest(".form-group");
    var password2Error = password2Box.find(".help-block");

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

    if (isNullOrWhitespace(password2) || password !== password2) {
        ok = false;
        password2Error.text("Repeat the password");
        password2Box.addClass("has-error");
    } else {
        password2Box.removeClass("has-error");
    }
    return ok;
}

function disableButton() {
    //disable the button so we can't resubmit while we wait
    $("#submitButton").button('loading');
}

function enableButton() {
    $("#submitButton").button('reset');
}

function signUp(form) {
    var email = $("#email", form).val();
    var username = $("#username", form).val();
    var password = $("#password", form).val();
    var password2 = $("#password2", form).val();

    if (isDataOk(username, password, password2)) {
        disableButton();

        signup_REST(email, username, password, function () {
            getOAuth2Token(username, password, false, function (res) {
                if (res["access_token"] !== undefined) {
                    document.location.href = "index.html";
                } else {
                    enableButton();
                    navigator.notification.alert("Your login failed", function () { });
                }
            }, function (jqXHR, textStatus, errorThrown) {
                enableButton();
                navigator.notification.alert(getAjaxErrorMessage(jqXHR, textStatus), function () { }, "Login error");
            });
        }, function (jqXHR, textStatus, errorThrown) {
            enableButton();

            if (jqXHR.responseText === undefined) {
                navigator.notification.alert("Your registration failed; Error code: " + errorThrown.code, function () { }, "Signup error");
            } else {
                navigator.notification.alert(jqXHR.responseText, function () { }, "Signup error");
            }
        });
    }
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

    $("#signupForm").on("submit", function (e) {
        e.preventDefault();

        signUp($(this));
        return false;
    });
}