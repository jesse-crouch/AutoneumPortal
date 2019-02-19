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

    var title = document.getElementById('title');
    var updateMsg = document.getElementById('updateMsg');
    var table = document.getElementById('table');
    var tbody = document.getElementById('tableBody');
    var button = document.getElementById('submit');

    // Set visibilities
    //table.style.visibility = 'hidden';
    button.style.visibility = 'hidden';
    var timer = null;
    var selected_id = null;

    button.addEventListener('click', () => {
        // Check that the request is still active
        $.post(server + 'statusUpdateLine', {token: token, request_id: selected_id}, (data) => {
            if (data.success) {
                if (data.status == 'Active') {
                    // Request is still active
                    window.location.replace(server + 'shipping?i=' + selected_id);
                } else {
                    // Request is not active
                    setTimeout(() => {
                        alert('That request has since been taken, reloading in 3 seconds');
                    }, 4000);
                    window.location.reload();
                }
            } else {
                // Error checking request status, reload the page
                window.location.reload();
            }
        });
    });

    // Method for when a box is clicked
    function rowChecked(event) {
        if (event.target.checked) {
            // Box has been checked, disabled all other boxes and show the button
            if (tbody.childNodes.length > 1) {
                for (var i=0; i<tbody.childNodes.length; i++) {
                    tbody.childNodes[i].firstChild.firstChild.disabled = true;
                }
            }

            // Make sure the current checkbox is still clickable
            event.target.disabled = false;
            button.style.visibility = 'visible';

            // Save the request_id
            var rows = event.target.parentElement.parentElement.getElementsByTagName('td');
            selected_id = rows[rows.length-1].innerHTML;
            console.log(selected_id);

            // Stop updating the table
            clearInterval(timer);
            timer = null;
        } else {
            // User unchecked the request, resume updates and make the button invisible
            button.style.visibility = 'hidden';
            timer = setInterval(updateTable, 5000);
        }
    }

    // Timer method
    function updateTable() {
        $.post(server + 'getActiveRequests', {token: token}, (data) => {
            if (data.success) {
                //console.log(data);

                // Clear the table of rows
                while(tbody.firstChild) {
                    tbody.removeChild(tbody.firstChild);
                }

                // Create a row for each active request
                for (var i=0; i<data.requests.length; i++) {

                    var newRow = document.createElement('tr');

                    var newInput = document.createElement('input');
                    newInput.type = 'checkbox';
                    newInput.addEventListener('change', rowChecked);
                    var box = document.createElement('td');
                    var time = document.createElement('td');
                    var timeText = document.createTextNode(data.requests[i].time_requested);
                    var line = document.createElement('td');
                    var lineText = document.createTextNode(data.requests[i].number);
                    var material = document.createElement('td');
                    var materialText = document.createTextNode(data.requests[i].name);
                    var colour = document.createElement('td');
                    var colourText = document.createTextNode(data.requests[i].colour);
                    var code = document.createElement('td');
                    var codeText = document.createTextNode(data.requests[i].code);
                    var id = document.createElement('td');
                    var idText = document.createTextNode(data.requests[i].request_id);

                    box.appendChild(newInput);
                    time.appendChild(timeText);
                    line.appendChild(lineText);
                    material.appendChild(materialText);
                    colour.appendChild(colourText);
                    code.appendChild(codeText);
                    id.appendChild(idText);

                    newRow.appendChild(box);
                    newRow.appendChild(time);
                    newRow.appendChild(line);
                    newRow.appendChild(material);
                    newRow.appendChild(colour);
                    newRow.appendChild(code);
                    newRow.appendChild(id);

                    tbody.appendChild(newRow);
                }

                // Make the table visible, and the update msg invisible
                table.style.visibility = 'visible';
                updateMsg.style.visibility = 'hidden';
                title.innerHTML = 'Active Requests';
            } else {
                console.log('no data');
                console.log(data);

                // No currently active requests, make table invisible
                table.style.visibility = 'hidden';
                updateMsg.style.visibility = 'visible';
                title.innerHTML = 'No Active Requests';
            }
        });
    }

    // Check for new requests every 5s
    timer = setInterval(updateTable, 5000);
});