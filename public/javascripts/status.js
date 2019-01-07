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
    var server = 'http://99.242.210.34:3000';

    // Check for token
    if (!document.cookie.includes('token')) {
        window.location.replace(server);
    }
    var token = getCookie('token', document);

    // Get rid of the logo
    document.getElementById('logo').style.display = 'none';
    document.getElementById('title').style.display = 'none';
    
    var table = document.getElementById('table-body');
    var clock = document.getElementById('clock');
    var fullTable = document.getElementById('full-table');
    var loading = document.getElementById('loading');
    
    // Every 5s, clear the table and fetch the requests
    setInterval(() => {
        loading.innerHTML = 'Material Requests';
        if (fullTable.style.visibility == 'hidden') {
            fullTable.style.visibility = 'visible';
        }
        
        while(table.firstChild) {
            table.removeChild(table.firstChild);
        }
        
        // Update clock
        var date = new Date();
        clock.innerHTML = date.toLocaleTimeString().substr(0, 5) + date.toLocaleTimeString().substr(8, 3);
        
        // Get requests
        $.post(server + '/getAllStatusRequest', {token: token}, (data) => {
            if (data.success) {
                for (var i=0; i<data.requests.length; i++) {
                    var newRow = document.createElement('tr');
                    
                    var status = document.createElement('td');
                    var number = document.createElement('td');
                    var name = document.createElement('td');
                    var colour = document.createElement('td');
                    var code = document.createElement('td');
                    var time = document.createElement('td');
                    
                    var statusText = document.createTextNode(data.requests[i].status);
                    var numberText = document.createTextNode(data.requests[i].number);
                    var nameText = document.createTextNode(data.requests[i].name);
                    var colourText = document.createTextNode(data.requests[i].colour);
                    var codeText = document.createTextNode(data.requests[i].code);
                    var timeText = document.createTextNode(data.requests[i].time_requested);
                    
                    status.appendChild(statusText);
                    number.appendChild(numberText);
                    name.appendChild(nameText);
                    colour.appendChild(colourText);
                    code.appendChild(codeText);
                    time.appendChild(timeText);
                    
                    newRow.appendChild(status);
                    newRow.appendChild(number);
                    newRow.appendChild(name);
                    newRow.appendChild(colour);
                    newRow.appendChild(code);
                    newRow.appendChild(time);
                    
                    if (status.textContent == 'Requested') {
                        status.style.background = '#343A40';
                    } else if (status.textContent == 'Confirming') {
                        status.style.background = 'lightBlue';  
                    } else if (status.textContent == 'Loading') {
                        status.style.background = 'orange';
                    } else if (status.textContent == 'In-Transit') {
                        status.style.background = 'yellow';
                    } else if (status.textContent == 'Delivered') {
                        status.style.background = 'lime';
                    }
                    table.appendChild(newRow);
                }
            }
        });
        
    }, 5000);
});