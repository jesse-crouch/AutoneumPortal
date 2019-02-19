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
    if (!document.cookie.includes('token')) {
        window.location.replace(server);
    }
    var token = getCookie('token', document);

    // Get rid of the logo
    document.getElementById('logo').style.display = 'none';

    var lineHeader = document.getElementById('title');
    var lineModeHeader = document.getElementById('lineModeHeader');
    var materialHeader = document.getElementById('materialHeader');

    var requestButton = document.getElementById('requestButton');
    var configButton = document.getElementById('configButton');

    var url = new URL(window.location.href);
    var requestID = url.searchParams.get('i');
    var postData = {
        request_id: requestID,
        token: token
    };

    // When the request button is clicked, start a 5s timer to cancel
    var timer = null, count = 6;
    requestButton.addEventListener('click', () => {
        if (requestButton.innerHTML.includes('LOADING')) {

            // Driver has loaded request, update to in-transit
            requestButton.style.background = 'yellow';
            requestButton.innerHTML = 'IN-TRANSIT (Click to confirm delivered)';

            $.post(server + 'requestInTransit', postData, (data) => {
                if (!data.success) {
                    alert('Error updating request to in-transit');
                }
            });
        } else if (requestButton.innerHTML.includes('IN-TRANSIT')) {

            // Driver has delivered request, update status
            requestButton.style.background = 'lime';
            requestButton.innerHTML = 'DELIVERED (Waiting for line confirmation)';
            requestButton.disabled = true;

            $.post(server + 'requestDelivered', postData, (data) => {
                if (data.success) {
                    
                    // Wait for line to confirm delivery
                    var updateCheck = setInterval(() => {
                        $.post(server + 'statusUpdateLine', postData, (data) => {
                            if (data.success) {
                                if (data.status == 'Complete') {
                                    // Send completion notification to sever, and return to setup
                                    console.log('sending request');
                                    $.post(server + 'requestCompleteShipping', postData, (data) => {
                                        console.log(data);
                                        if (data.success) {
                                            window.location.replace(server + 'setup/shipping');
                                        } else {
                                            alert('Error completing request');
                                        }
                                    });
                                }
                            } else {
                                alert('Error checking for status update');
                            }
                        });
                    }, 5000);
                } else {
                    alert('Error updating request to delivered');
                }
            });
        } else {
            if (timer == null) {
                timer = setInterval(() => {
                    if (count > 0) {
                        count--;
                        requestButton.style.background = 'orange';
                        requestButton.style.color = 'black';
                        requestButton.innerHTML = 'CONFIRMING (Click to cancel [' + count + '])';
                    } else {
                        // Time has run out, send the request
                        clearInterval(timer);
                        timer = null;
                        requestButton.style.background = 'lime';
                        requestButton.innerHTML = 'LOADING (Click to confirm request is loaded)';
                        configButton.style.visibility = 'hidden';

                        $.post(server + 'requestLoading', {token: token, request_id: requestID}, (data) => {
                            if (!data.success) {
                                alert('Error updating request to loading');
                            }
                        });
                    }
                }, 1000);
            } else {
                // User has clicked before the time has run out, reset the button and timer
                clearInterval(timer);
                timer = null;

                count = 6;
                requestButton.style.background = '#343A40';
                requestButton.style.color = 'white';
                requestButton.innerHTML = 'DELIVER';
            }
        }
    });

    // Reconfigure button just sends user back to setup page
    configButton.addEventListener('click', () => {
        window.location.replace(server + 'setup/shipping');
    });

    // Get the line information from DB given request ID
    $.post(server + 'getLineInfoShipping', {token: token, request_id: requestID}, (data) => {
        if (data.success) {

            lineHeader.innerHTML = data.line_info[0].number;
            lineModeHeader.innerHTML = data.line_info[0].line_mode;
            materialHeader.innerHTML = data.line_info[0].name;
        } else {
            alert('Error fetching line information');
        }
    });

    // Update request status to confirming
    $.post(server + 'requestConfirming', postData, (data) => {
        if (!data.success) {
            alert('Error updating request after page load');
        }
    });
});