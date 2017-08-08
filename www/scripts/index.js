/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function () {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        var _this = this;
        $(function () {
            window.isPhone = false;
            if (document.URL.indexOf("http://") === -1 && document.URL.indexOf("https://") === -1) {
                window.isPhone = true;
            }

            if (window.isPhone) {
                document.addEventListener('deviceready', _this.onDeviceReady, false);
            } else {
                onDeviceReady();
            }
        });
    },
    // deviceready Event Handler
    onDeviceReady: function () {
        var currentPage = window.location.href;
        window.sessionStorage.setItem("page", currentPage); 

        function logout() {
            app.onOAuthExpired();
            oAuth.clearToken();
            document.location.href = "login.html";
        }

        $('#findDevice').click(function (e) {
            e.preventDefault();

            if ($(this).parent('.disabled').length === 0) {
                findDevice();
            }
        });

        $("#loginLink").click(function (e) {
            // Klick auf den Logout Button

            e.preventDefault();
            logout();
        });

        var params = app._getSearchParameters();
        if (!$.isEmptyObject(params) && params['position'] !== undefined) {
            var position = JSON.parse(params['position']);
            addMarker(position);
        }
    },
    onOAuthExpired: function () {
        oAuthExpired_geo();
    },
    _getSearchParameters: function () {
        function transformToAssocArray(prmstr) {
            var params = {};
            var prmarr = prmstr.split("&");
            for (var i = 0; i < prmarr.length; i++) {
                var tmparr = prmarr[i].split("=");
                params[tmparr[0]] = decodeURIComponent(tmparr[1]);
            }
            return params;
        }
        var prmstr = window.location.search.substr(1);
        return prmstr !== null && prmstr !== "" ? transformToAssocArray(prmstr) : {};
    }
};

geoMain();
app.initialize();