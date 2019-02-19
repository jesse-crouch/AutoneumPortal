$(document).ready(() => {
    var server = document.getElementById('serverURLInput').value;
    
    var linePassBox = document.getElementById('linePassBox');
    var shipPassBox = document.getElementById('shipPassBox');
    var lineBtn = document.getElementById('lineBtn');
    var shipBtn = document.getElementById('shipBtn');
    var statusBtn = document.getElementById('statusBtn');

    lineBtn.addEventListener('click', () => {
        if (linePassBox.value != '') {
            if (linePassBox.value == 'linePassword') {
                window.location.replace(server + 'setup/line');
            }
        }
    });

    shipBtn.addEventListener('click', () => {
        if (shipPassBox.value != '') {
            if (shipPassBox.value == 'shipPassword') {
                window.location.replace(server + 'setup/shipping');
            }
        }
    });

    statusBtn.addEventListener('click', () => {
        window.location.replace(server + 'status');
    });

    function login() {
        if (emailField.value != '' && passField.value != '') {
            // User has clicked login, send info to server
            var postData = {
                email: emailField.value,
                password: passField.value
            };
            $.post(server + 'verifyLogin', postData, (data) => {
                if (data.success) {
                    // Verification succeeded, set token as cookie, expires depending on user
                    var date = new Date();
                    
                    if (email == 'line' || email == 'shipping') {
                        // If it's for a line or shipping, cookie expires in 24 hours
                        date.setTime(date.getTime() + (24*60*60*1000));
                    } else {
                        // Any other user, cookie expires in 8 hours
                        date.setTime(date.getTime() + (8*60*60*1000));
                    }
                    document.cookie = 'token=' + data.token + '; expires=' + date.toUTCString() + '; path=/';

                    // Redirect to home
                    console.log(server);
                    window.location.replace(server);
                } else {
                    // Verification failed, show the reason and clear fields
                    if (data.reason == 'no_user') {
                        alert('No user exists with that email/username');
                        emailField.value = '';
                        passField.value = '';
                    } else if (data.reason == 'wrong_pass') {
                        alert('Incorrect password');
                        passField.value = '';
                    } else {
                        alert('Unknown error, try again');
                        emailField.value = '';
                        passField.value = '';
                    }
                }
            });
        }
    }

    var emailField = document.getElementById('email');
    var passField = document.getElementById('password');
    addEventListener('keydown', (event) => {
        if (event.key == 'Enter') {
            login();
        }
    });

    document.getElementById('submit').addEventListener('click', () => {
        login();
    });
});