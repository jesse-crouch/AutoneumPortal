// Method for fetching a specific cookie from document
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

$(document).ready(() => {

    var server = document.getElementById('serverURLInput').value;

    var firstNameField = document.getElementById('firstNameField');
    var surnameField = document.getElementById('surnameField');
    var emailField = document.getElementById('emailField');
    var typeSelect = document.getElementById('typeSelect');
    var paySelect = document.getElementById('paySelect');
    var payInput = document.getElementById('payInput');
    var payField = document.getElementById('payField');
    var payAppend = document.getElementById('payDefinition');
    var positionField = document.getElementById('positionField');

    var cancelBtn = document.getElementById('cancel');
    var registerBtn = document.getElementById('submit');

    cancelBtn.addEventListener('click', () => {
        window.location.replace(server + 'users');
    });

    paySelect.addEventListener('change', () => {
        var choice = paySelect.options[paySelect.selectedIndex].value;
        if (choice != 'Choose a type') {
            payInput.style.display = '';
            
            if (choice == 'Hourly') {
                payAppend.innerHTML = 'per hour';
            } else {
                payAppend.innerHTML = 'per year';
            }
        }
    });

    registerBtn.addEventListener('click', () => {
        // Verify that the fields are valid
        var firstName = firstNameField.value;
        var surname = surnameField.value;
        var email = emailField.value;
        var type = typeSelect.options[typeSelect.selectedIndex].value;
        var payType = paySelect.options[paySelect.selectedIndex].value;
        var pay = payField.value;
        var position = positionField.value;

        // Check first name is valid
        if (firstName != '') {
            // Check surname is valid
            if (surname != '') {
                // Check email is valid
                if (email != '' && email.includes('@')) {
                    // Check type is valid
                    if (type != 'Choose an Employee Type') {
                        if (payType != 'Choose a pay type') {
                            // Format the data, and send the request to the server
                            var postData = {
                                first_name: firstName,
                                surname: surname,
                                email: email,
                                type: type,
                                payType: payType,
                                pay: pay,
                                position: position,
                                token: getCookie('token'),
                                office: type == 'Office'
                            };
                            $.post(server + 'newUser', postData, (data) => {
                                if (data.success) {
                                    // New user creation was successful, return to users
                                    $('#successModal').modal();
                                    setTimeout(() => {
                                        window.location.replace(server + 'users');
                                    }, 2000);
                                } else {
                                    alert('Something went wrong, try again');
                                }
                            });
                        }
                    }
                }
            }
        }
    });

    // Entry point
    if (!document.cookie.includes('token')) {
        window.location.replace(server);
    }
});