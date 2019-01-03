$(document).ready(() => {
    var server = 'http://99.242.210.34:3000';

    // Get rid of the logo
    var logo = document.getElementById('logo');
    logo.parentElement.removeChild(logo);

    var lineHeader = document.getElementById('title');
    var lineModeHeader = document.getElementById('lineModeHeader');
    var materialHeader = document.getElementById('materialHeader');

    var requestButton = document.getElementById('requestButton');
    var configButton = document.getElementById('configButton');

    var url = new URL(window.location.href);
    var materialID = url.searchParams.get('i');

    // Get the line information from DB given material ID
    $.post(server + '/getLineInfo', {material_id: materialID}, (data) => {
        if (data.success) {

            console.log(data);
            lineHeader = data.line_info[0].number;
            lineModeHeader.innerHTML = data.line_info[0].line_mode;
            materialHeader.innerHTML = data.line_info[0].name;
        } else {
            alert('Error fetching line information');
        }
    });
});