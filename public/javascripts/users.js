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

function newRow(data, currentAccessLevel, i) {
    var newRow = document.createElement('tr');

    var photoData = document.createElement('td');
    var fnameData = document.createElement('td');
    var surnameData = document.createElement('td');
    var emailData = document.createElement('td');
    var dateData = document.createElement('td');
    var delBtnData = document.createElement('td');

    photoData.style.fontWeight = 'bold';
    fnameData.style.fontWeight = 'bold';
    surnameData.style.fontWeight = 'bold';
    emailData.style.fontWeight = 'bold';
    dateData.style.fontWeight = 'bold';

    var photo = document.createElement('img');
    photo.src = './images/no_photo.png';
    photo.width = 80; photo.height = 80;
    if (data.users[i].photo_url != null) {
        photo.src = data.users[i].photo_url;
    }

    var fnameText = document.createTextNode(data.users[i].first_name);
    var surnameText = document.createTextNode(data.users[i].surname);
    var emailText = document.createTextNode(data.users[i].email);
    var dateText = document.createTextNode(data.users[i].date_registered);

    // Only create a delete button if the logged in account is of high enough privilege
    var delBtn = document.createElement('input');
    delBtn.style.display = 'none';
    console.log(data.users[i].access_level);
    if (data.users[i].access_level != null) {
        console.log(currentAccessLevel + ' > ' + data.users[i].access_level);
        if (currentAccessLevel > data.users[i].access_level) {
            delBtn.className = 'btn btn-danger';
            delBtn.value = 'Delete';
            delBtn.style.width = '50%';
            delBtn.style.display = '';
            delBtn.addEventListener('click', () => {
                // Set the user as the target, even if delete is not confirmed
                targetUser = {
                    first_name: newRow.cells[1],
                    surname: newRow.cells[2],
                    email: newRow.cells[3],
                    date_registered: newRow.cells[4]
                };
                targetRow = newRow;
                $('#confirmModal').modal();
            });
        }
    }

    photoData.appendChild(photo);
    fnameData.appendChild(fnameText);
    surnameData.appendChild(surnameText);
    emailData.appendChild(emailText);
    dateData.appendChild(dateText);
    delBtnData.appendChild(delBtn);

    newRow.appendChild(photoData);
    newRow.appendChild(fnameData);
    newRow.appendChild(surnameData);
    newRow.appendChild(emailData);
    newRow.appendChild(dateData);
    newRow.appendChild(delBtnData);

    tableBody.appendChild(newRow);
}

$(document).ready(() => {
    var server = document.getElementById('serverURLInput').value;

    var table = document.getElementById('table');
    var tableBody = document.getElementById('tableBody');

    var searchBox = document.getElementById('searchBox');
    searchBox.value = '';
    var newUserBtn = document.getElementById('newUserBtn');
    newUserBtn.addEventListener('click', () => {
        window.location.replace(server + 'new/user');
    });
    var targetUser, targetRow;
    var fullDeleteBtn = document.getElementById('fullDeleteButton');
    fullDeleteBtn.addEventListener('click', () => {
        // Send the delete request to the server
        var postData = {
            token: getCookie('token'),
            userData: targetUser
        }
        $.post(server + 'deleteUser', postData, (data) => {
            if (data.success) {
                $('#deletedModal').modal();
                targetRow.style.display = 'none';
            } else {
                alert('Failed to delete user, try again');
            }
        })
    });

    searchBox.addEventListener('input', () => {
        var search = searchBox.value;

        if (tableBody.childNodes.length > 0) {
            for (var i=1, row; row = table.rows[i]; i++) {
                for (var j=1, col; col = row.cells[j]; j++) {
                    if (j < 5) {
                        row.style.display = 'none';
                        if (col.innerHTML.includes(search)) {
                            row.style.display = '';
                            break;
                        }
                    }
                }
            }
        } else {
            console.log('empty table');
        }
    });

    if (document.cookie.includes('token')) {
        // Get email and access_level for current user
        var currentEmail, currentAccessLevel;
        $.post(server + 'verifyToken', {token: getCookie('token')}, (data) => {
            if (data.success) {
                currentEmail = data.info.email;
                currentAccessLevel = data.info.access_level;
            } else {
                alert('Something went wrong verifying token');
            }
        });

        // Get a list of users
        $.post(server + 'getUsers', { token: getCookie('token') }, (data) => {
            if (data.success) {
                
                // Add users to table
                for (var i=0; i<data.users.length; i++) {
                    if (data.users[i].email == 'line' || data.users[i].email == 'shipping' || data.users[i].email == 'sysadmin') {
                        if (currentEmail == 'sysadmin') {
                            newRow(data, currentAccessLevel, i);
                        }
                    } else {
                        newRow(data, currentAccessLevel, i);
                    }                    
                }

            } else {
                alert('Something went wrong, try again');
            }
        });
    } else {
        window.location.replace(server);
    }
});