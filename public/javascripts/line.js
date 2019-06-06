// Method for fetching a specific cookie from document
function getCookie(cookieName, document) {
    // Check if cookie exists
    if (document.cookie.includes(cookieName)) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + cookieName + "=");
        if (parts.length == 2) return parts.pop().split(";").shift();
    } else {
        return '';
    }
}

$(document).ready(() => {
    var server = document.getElementById('serverURLInput').value;

    // Check for token
    /*if (!document.cookie.includes('token')) {
        window.location.replace(server);
    }
    var token = getCookie('token', document);*/

    // Get rid of the logo
    document.getElementById('logo').style.display = 'none';

    var lineHeader = document.getElementById('title');
    var lineModeHeader = document.getElementById('lineModeHeader');
    var materialHeader = document.getElementById('materialHeader');

    var requestButton = document.getElementById('requestButton');
    var configButton = document.getElementById('configButton');

    var url = new URL(window.location.href);
    var lineID = url.searchParams.get('l');
    var materialID = url.searchParams.get('m');

    // When the request button is clicked, start a 5s timer to cancel
    var timer = null, count = 6, requestID = null;
    requestButton.addEventListener('click', () => {
        if (requestButton.innerHTML == 'DELIVERED (Click to confirm)') {

            // Line has confirmed delivery, close the active request and reset buttons
            requestButton.style.background = '#343A40';
            requestButton.style.color = 'white';
            requestButton.innerHTML = 'REQUEST';
            configButton.style.visibility = 'visible';

            $.post(server + 'requestCompleteLine', {request_id: requestID}, (data) => {
                if (!data.success) {
                    alert('Error completing request, alert team lead');
                }
            });
        } else {
            if (timer == null) {
                timer = setInterval(() => {
                    if (count > 0) {
                        count--;
                        requestButton.style.background = 'orange';
                        requestButton.style.color = 'black';
                        requestButton.innerHTML = 'REQUESTING (Click to cancel [' + count + '])';
                    } else {
                        // Time has run out, send the request
                        clearInterval(timer);
                        timer = null;
                        requestButton.style.background = 'lime';
                        requestButton.innerHTML = 'REQUESTED';
                        requestButton.disabled = true;
                        configButton.style.visibility = 'hidden';

                        var postData = {
                            line_id: lineID,
                            material_id: materialID
                        };
                        $.post(server + 'newRequest', postData, (data) => {
                            if (data.success) {

                                requestID = data.request_id;
                                // Check every 5s for a status update
                                var updateCheck = setInterval(() => {
                                    
                                    $.post(server + 'statusUpdateLine', {request_id: requestID}, (data) => {
                                        if (data.success) {
                                            
                                            if (data.status == 'Loading') {

                                                // Driver is loading the cargo
                                                requestButton.style.background = 'orange';
                                                requestButton.innerHTML = 'REQUEST RECEIVED';
                                            } else if (data.status == 'In-Transit') {

                                                // Driver is in-transit
                                                requestButton.style.background = 'yellow';
                                                requestButton.innerHTML = 'IN-TRANSIT';
                                            } else if (data.status == 'Delivered') {

                                                // Driver has confirmed delivery, waiting for line
                                                requestButton.style.background = 'lime';
                                                requestButton.innerHTML = 'DELIVERED (Click to confirm)';
                                                requestButton.disabled = false;
                                                
                                                clearInterval(updateCheck);
                                                updateCheck = null;
                                                clearInterval(timer);
                                                timer = null;
                                            }
                                        } else {
                                            alert('Error getting status update, trying again in 5 seconds...');
                                        }
                                    })
                                }, 5000);
                            } else {
                                // Error creating request, alert user and reset button
                                alert('Error creating request');

                                requestButton.style.background = '#343A40';
                                requestButton.style.color = 'white';
                                requestButton.innerHTML = 'REQUEST';
                                configButton.style.visibility = 'visible';
                            }
                        })
                    }
                }, 1000);
            } else {
                // User has clicked before the time has run out, reset the button and timer
                clearInterval(timer);
                timer = null;

                count = 6;
                requestButton.style.background = '#343A40';
                requestButton.style.color = 'white';
                requestButton.innerHTML = 'REQUEST';
            }
        }
    });

    // Reconfigure button just sends user back to setup page
    configButton.addEventListener('click', () => {
        window.location.replace(server + 'setup/line');
    });

    // Get the line information from DB given material ID
    $.post(server + 'getLineInfo', {material_id: materialID}, (data) => {
        if (data.success) {

            console.log(data);
            lineHeader.innerHTML = 'Line - ' + data.line_info[0].number;
            lineModeHeader.innerHTML = 'Mode - ' + data.line_info[0].line_mode;
            materialHeader.innerHTML = 'Material - ' + data.line_info[0].name;

        } else {
            alert('Error fetching line information');
        }
    });
});