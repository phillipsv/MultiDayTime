if(typeof plugins === 'undefined') {
    var request = new XMLHttpRequest();
    var url = getUrlParameter('pluginConfig');
    if (url.length) {
        request.open('GET', url, true);

        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                // Success!
                setup_plugins(JSON.parse(request.responseText));
            }
        };

        request.send();
    }
}
else{
    setup_plugins(plugins);
}

function setup_plugins(plugins){
    console.log("yeah this is working");
    if(typeof videojs === 'function' && typeof plugins === 'object' && typeof videojs.players === 'object'){
        for (player_id in videojs.players) {

            var player = videojs.players[player_id];
            console.log("setting up plugins within brightcove");
            console.log(player);
            setup_chartbeat(player, plugins);
            setup_error_listeners(player);

            if (plugins.local_ima3_enable) {
                ima3_ad(player, plugins);
                setup_moat(player);
            }
        }
    }
}

function setup_moat(player){
    player["Moat"]({
        "partnerCode": "rogersbrightcoveint878700116445"
    });
}

function setup_chartbeat(player, plugins){
    player['chartbeat']({
        "uid": plugins.chartbeat.uid,
        "domain": plugins.chartbeat.domain
    });
}


function setup_error_listeners(player){

    player.one('bc-catalog-error', function(){
        var rPlayer = this,
            specificError;

        rPlayer.errors({
            'errors': {
                '-3': {
                    'headline': 'This video is not available in your region.',
                    'type': 'CLIENT_GEO'
                }
            }
        });

        if (typeof(rPlayer.catalog.error) !== 'undefined') {
            specificError = rPlayer.catalog.error.data[0];
            if (specificError !== 'undefined' && specificError.error_subcode == "CLIENT_GEO" ) {
                rPlayer.error({code:'-3'});
            }
        }
    });
}

function ima3_ad(player, plugins) {
    var adServerUrl = "";

    player.on("loadedmetadata", function() {

        if (typeof player.ima3.settings !== "undefined") {
            adServerUrl = player.ima3.settings.serverUrl;
        }

        if (plugins.ad_server_url != "") {
            adServerUrl = plugins.ad_server_url;
        }

        // @todo - check if we can pull the adServerURL from ima3 plugin
        // if it is loaded from brightcove
        if (plugins.syndicated_enable) {
            var syndicated = getSyndicatedTag(player);
            if (syndicated) {
                adServerUrl = addToIU(adServerUrl, 5, syndicated);
            }
        }

        var customParams = getCustomParamsQueryString();

        if (customParams != "") {
            adServerUrl += "&cust_params=" + encodeURIComponent(customParams);
        }

        if (typeof player.ima3 !== "undefined" && typeof player.ima3 !== "object") {
            player.ima3({
                adTechOrder: ["html5", "flash"],
                debug: false,
                timeout: 7000,
                requestMode: 'onload',
                loadingSpinner: true,
                serverUrl: adServerUrl
            });
        } else {
            player.ima3.settings.serverUrl = adServerUrl;
        }

        if (typeof plugins.ad_macro_replacement !== 'undefined') {
            player.ima3.adMacroReplacement = function (url) {
                var parameters = plugins.ad_macro_replacement;
                for (var i in parameters) {
                    url = url.split(i).join(encodeURIComponent(parameters[i]));
                }
                return url;
            }
        }
    });
}

function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

function isInIframe() {
    return window.self !== window.top;
}

function getSyndicatedTag(player) {
    var tags = player.mediainfo.tags;
    var syndicated = "";
    for(var i in tags) {
        if (tags[i].indexOf("syndicated=") >= 0) {
            syndicated = tags[i].split("=")[1]; // Getting the value of syndicated
            return syndicated;
        }
    }
    return false;
}

function addToIU(url, position, addition) {
    var iu = getParameterByName("iu", url);
    var originalIU = iu;

    if (iu.charAt(0) == "/") {
        iu = iu.substring(1);
    }

    iuParts = iu.split("/");

    var arrayPosition = position - 1;

    for (var i = 0; i < arrayPosition; i++) {
        if (iuParts[i] == "") {
            iuParts[i] = "video";
        }
    }

    iuParts[arrayPosition] = addition;


    iu = "/" + iuParts.join("/");

    console.log(url.replace(originalIU, iu));

    return url.replace(originalIU, iu);
}

function getParameterByName(name, url) {
    name = name.replace(/[\[\]]/g, "\\$&");
    if (!url) {
        url = window.location.href;
    }

    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);

    if (!results) {
        return null;
    }
    if (!results[2]) {
        return '';
    }

    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function getCustomParamsQueryString() {

    var queryString = "";

    var requestUri = getRequestUri();
    var requestUriParts = requestUri.split("/");
    requestUriParts = removeEmptyElements(requestUriParts);

    var adUtilityObject = getAdUtility();
    var adUtilTargetQueryString = getAdUtilTargetQueryString();


    if (requestUriParts.length > 0) {
        queryString += "section=" + requestUriParts[0] + "&";
        queryString += "page=" + requestUriParts.join(",") + "&";
    }

    if (adUtilityObject != false && adUtilityObject.sponsId != "") {
        queryString += "SponsId=" + adUtilityObject.sponsId + "&";
    }

    if (adUtilTargetQueryString != false) {
        queryString += adUtilTargetQueryString;
    }

    if (queryString[queryString.length - 1] == "&") { // If last character is &
        queryString = queryString.substring(0, queryString.length - 1);
    }

    return queryString;
}

function removeEmptyElements(array) {
    for (var i=0; i<array.length; i++) {
        if (array[i] == "") {
            array.splice(i, 1);
            i--;
        }
    }
    return array;
}

function getAdUtilTargetQueryString() {
    var adUtilTargetQueryString = "";
    var adUtilTargetObject = getAdUtilTarget();

    if (adUtilTargetObject == false) {
        return false;
    }

    var notTags = ["PostID","Author","Category","ContentType"];
    var elements = [];
    elements["Tags"] = "";

    for (var key in adUtilTargetObject) {
        var value = adUtilTargetObject[key];

        if (typeof value == "object" || typeof value == "array") {
            value = value.join(",");
        }

        if (notTags.indexOf(key) >= 0) {
            elements[key] = value;
        } else {
            elements["Tags"] += value + ",";
        }
    }

    if (elements["Tags"][elements["Tags"].length - 1] == ",") {
        elements["Tags"] = elements["Tags"].substring(0, elements["Tags"].length - 1);
    }

    for (var key in elements) {
        adUtilTargetQueryString += key + "=" + elements[key] + "&";
    }

    return adUtilTargetQueryString;
}

function getAdUtility() {
    var inIframe = isInIframe();

    if (inIframe) {
        try {
            if (typeof parent.adUtility !== "undefined") {
                return parent.adUtility;
            }
        }
        catch($e){} //to catch cross-origin access
    } else {
        if (typeof window.adUtility !== "undefined") {
            return window.adUtility;
        }
    }
    return false;
}


function getRequestUri() {
    var inIframe = isInIframe();
    var requestUri = window.location.pathname;

    if (inIframe) {
        try{
            requestUri = parent.location.pathname;
        }
        catch($e){//to catch cross-origin issues.
            requestUrl = ''; //setting it to false, so as to not report wrong values.
        }
    }
    return requestUri;
}

function getAdUtilTarget() {
    var inIframe = isInIframe();

    if (inIframe) {
        try {
            if (typeof parent.adutil_target !== "undefined") {
                return parent.adutil_target;
            }
        }
        catch($e){} //to catch cross origin errors
    } else {
        if (typeof window.adutil_target !== "undefined") {
            return window.adutil_target;
        }
    }
    return false;
}
