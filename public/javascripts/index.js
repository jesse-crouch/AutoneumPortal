// Method to extract a specific cookie
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

// Method to get length of a JSON object
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

$(document).ready(() => { 
    var server = document.getElementById('serverURLInput').value;

    var buttonContainer = document.getElementById('buttonContainer');

    function createLogoutButton() {
        var logoutButton = document.createElement('input');
        logoutButton.className = 'btn btn-danger';
        logoutButton.type = 'submit';
        logoutButton.value = 'Log out';
        buttonContainer.appendChild(logoutButton);
        logoutButton.addEventListener('click', () => {
            // Logging out, clear the cookies and redirect to login page
            document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            window.location.replace(server + 'login');
        });
    }

    // Object stores the required account level to access the page
    var actions = [
        new Object({
            name: 'Materials',
            level: 3,
            action: server + 'materials'
        }),
        new Object({
            name: 'Users',
            level: 3,
            action: server + 'users'
        })
    ];

    // Check if there is a user logged in
    if (document.cookie.includes('token')) {
        
        // Get user information from server using token
        $.post(server + 'verifyToken', { token: getCookie('token') }, (data) => {
            if (data.success) {

                var titleText = document.getElementById('title');
                if (!data.info.first_name) {
                    if (data.info.position == 'Line') {
                        window.location.replace(server + 'setup/line');
                    } else {
                        titleText.innerHTML = data.info.position + ' Panel';
                        document.title = 'Home - ' + data.info.position;
                    }
                } else {
                    titleText.innerHTML = 'Welcome ' + data.info.first_name + '!';
                    document.title = 'Home - ' + data.info.first_name;
                }

                // Loop through all actions, if the user privilege level is equal or
                //      greater than the privilege of the action, make a button for it
                for (var index in actions) {
                    if (actions[index].level <= data.info.access_level) {

                        if (actions[index].name == 'Line' && data.info.first_name == '_shipping') {
                            // Do nothing
                        } else {
                            var newForm = document.createElement('form');
                            newForm.action = actions[index].action;
                            newForm.style.margin = '20px';

                            var newButton = document.createElement('input');
                            newButton.className = 'btn btn-success';
                            newButton.type = 'submit';
                            newButton.value = actions[index].name;

                            newForm.appendChild(newButton);
                            buttonContainer.appendChild(newForm);
                        }
                    }
                }
                createLogoutButton();

            } else {
                // Token couldn't be verified, redirect to login
                window.location.replace(server + 'login');
            }
        });

    } else {
        // No user is logged in, redirect to login page
        window.location.replace(server + 'login');
    }
});