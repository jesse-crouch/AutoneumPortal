$(document).ready(() => {
    var server = document.getElementById('serverURLInput').value;

    var passBox = document.getElementById('passBox');
    var passRepeatBox = document.getElementById('passRepeatBox');
    var verifyBtn = document.getElementById('verifyBtn');
    var warning = document.getElementById('warning');
    var userInfo;

    // Send the encoded token to the server and receive the decoded data
    var token = new URL(window.location.href).searchParams.get('token');
    $.post(server + 'verifyToken', {token: token}, (data) => {
        if (data.success) {
            // Check if this user requires a password
            if (!data.info.office) {
                // User is not an office employee, remove the password fields
                passBox.style.display = 'none';
                passRepeatBox.style.display = 'none';
                document.getElementById('successText').innerHTML = 'Verification successful, redirecting...';
                document.getElementById('title').innerHTML = 'Account Verification';
            }

            // Store the payload info
            userInfo = data.info;
        } else {
            alert('Something went wrong, try again');
        }
    });

    passRepeatBox.addEventListener('input', () => {
        if (passRepeatBox.value != passBox.value) {
            warning.style.display = '';
            warning.innerHTML = 'Passwords don\'t match';
        } else {
            warning.style.display = '';
            warning.style.color = 'green';
            warning.innerHTML = 'Passwords match';
        }
    });

    verifyBtn.addEventListener('click', () => {
        var postData;

        // Check if we are expecting a password or not
        if (passBox.style.display == 'none') {
            // No password expected, format postData
            postData = {
                employee_id: userInfo.employee_id,
                office: false,
                token: new URL(window.location.href).searchParams.get('token')
            };
        } else {
            // Ensure a password was entered
            if (passBox.value != '' && passRepeatBox.value != '') {
                // Password is valid, add to postData
                postData = {
                    employee_id: userInfo.employee_id,
                    office: true,
                    password: passBox.value,
                    access_level: userInfo.access_level,
                    token: new URL(window.location.href).searchParams.get('token')
                };
            }
        }
        
        console.log('sending request');
        // Send the verification request
        $.post(server + 'verifyUser', postData, (data) => {
            if (data.success) {
                // Verification is finished
                $('#successModal').modal();
                setTimeout(() => {
                    window.location.replace(server);
                }, 2000);
            } else {
                alert('Something went wrong, try again');
            }
        });
    });
});