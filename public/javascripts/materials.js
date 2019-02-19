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

function newRow(data, i) {
    var newRow = document.createElement('tr');

    var checkBoxData = document.createElement('td');
    var codeData = document.createElement('td');
    var nameData = document.createElement('td');
    var colourData = document.createElement('td');
    var lineData = document.createElement('td');
    var detailsBtnData = document.createElement('td');
    var delBtnData = document.createElement('td');

    codeData.style.fontWeight = 'bold';
    nameData.style.fontWeight = 'bold';
    colourData.style.fontWeight = 'bold';
    lineData.style.fontWeight = 'bold';

    var checkBox = document.createElement('input');
    var thisIndex;
    checkBox.type = 'checkbox';
    checkBox.addEventListener('change', () => {
        if (checkBox.checked) {
            // Make the 'Delete Selected' button visible, and add the current
            // row to the selectedRows
            document.getElementById('delSelectedBtn').style.display = '';
            selectedRows.push(newRow);
            thisIndex = selectedRows.length-1;
        } else {
            // Remove the unchecked row from selectedRows
            if (selectedRows.length < 1) {
                document.getElementById('delSelectBtn').style.display = 'none';
            } else {
                var tempBefore = [], tempAfter = [];
                tempBefore = selectedRows.slice(0, thisIndex-1);
                tempAfter = selectedRows.slice(thisIndex+1, selectedRows.length-1);
                selectedRows = tempBefore + tempAfter;
            }
        }
    });

    var codeText = document.createTextNode(data.materials[i].code);
    var nameText = document.createTextNode(data.materials[i].name);
    var colourText = document.createTextNode(data.materials[i].colour);
    var lineText = document.createTextNode(data.materials[i].number);

    var delBtn = document.createElement('input');
    delBtn.className = 'btn btn-danger';
    delBtn.value = 'Delete';
    delBtn.style.width = '50%';
    delBtn.style.display = '';
    delBtn.addEventListener('click', () => {
        // Set the user as the target, even if delete is not confirmed
        targetMaterial = {
            code: newRow.cells[1],
            name: newRow.cells[2],
            colour: newRow.cells[3],
            number: newRow.cells[4]
        };
        targetRow = newRow;
        $('#confirmModal').modal();
    });

    var detailsBtn = document.createElement('input');
    detailsBtn.className = 'btn btn-primary';
    detailsBtn.value = 'Details';
    detailsBtn.style.width = '50%';
    detailsBtn.style.display = '';
    detailsBtn.addEventListener('click', () => {
        // Set the user as the target, even if delete is not confirmed
        document.getElementById('codeText').innerHTML = 'Code: ' + targetRow.cells[1];
        document.getElementById('nameText').innerHTML = 'Name: ' + targetRow.cells[2];
        document.getElementById('colourText').innerHTML = 'Colour: ' + targetRow.cells[3];
        document.getElementById('lineText').innerHTML = 'Line: ' + targetRow.cells[4];
        /*document.getElementById('modeText').innerHTML = 'Line Mode: ' + targetRow.cells[5];
        document.getElementById('packSizeText').innerHTML = 'Pack Size: ' + targetRow.cells[6];
        document.getElementById('countText').innerHTML = 'Count: ' + targetRow.cells[7];
        document.getElementById('sapText').innerHTML = 'SAP Count: ' + targetRow.cells[8];*/

        $('#detailsModal').modal();
    });

    checkBoxData.appendChild(checkBox);
    codeData.appendChild(codeText);
    nameData.appendChild(nameText);
    colourData.appendChild(colourText);
    lineData.appendChild(lineText);
    detailsBtnData.appendChild(detailsBtn);
    delBtnData.appendChild(delBtn);

    newRow.appendChild(checkBoxData);
    newRow.appendChild(codeData);
    newRow.appendChild(nameData);
    newRow.appendChild(colourData);
    newRow.appendChild(lineData);
    newRow.appendChild(detailsBtnData);
    newRow.appendChild(delBtnData);

    tableBody.appendChild(newRow);
}

$(document).ready(() => {
    var server = document.getElementById('serverURLInput').value;

    var table = document.getElementById('table');
    var tableBody = document.getElementById('tableBody');

    var selectedRows = [];
    var searchBox = document.getElementById('searchBox');
    searchBox.value = '';
    var newMaterialBtn = document.getElementById('newMaterialBtn');
    newMaterialBtn.addEventListener('click', () => {
        window.location.replace(server + 'new/material');
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

    document.getElementById('delSelectedBtn').addEventListener('click', () => {
        for (var i=0; i<selectedRows.length; i++) {
            console.log(selectedRows[i].cells[2]);
        }
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
        // Get a list of materials
        $.post(server + 'getAllMaterials', { token: getCookie('token') }, (data) => {
            if (data.success) {
                
                // Add users to table
                for (var i=0; i<data.materials.length; i++) {
                    newRow(data, i);              
                }

            } else {
                alert('Something went wrong, try again');
            }
        });
    } else {
        window.location.replace(server);
    }
});