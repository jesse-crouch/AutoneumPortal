$(document).ready(() => {
    var server = 'http://192.168.0.29:3000/';

    var emailField = document.getElementById('email');
    var passField = document.getElementById('password');

    document.getElementById('submit').addEventListener('click', () => {
        // User has clicked login, send info to server
        var postData = {
            email: emailField.value,
            password: passField.value
        };
        $.post(server + 'verifyLogin', postData, (data) => {
            if (data.success) {
                // Verification succeeded, set token as cookie, expires depending on user
                var date = new Date();
                
                if (email == 'line' | email == 'shipping') {
                    // If it's for a line or shipping, cookie expires in 8 hours
                    date.setTime(date.getTime() + (8*60*60*1000));
                } else {
                    // Any other user, cookie expires in 1 hour
                    date.setTime(date.getTime() + (60*60*1000));
                }
                document.cookie = 'token=' + data.token + '; expires=' + date.toUTCString() + '; path=/';

                // Redirect to home
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
    });
});