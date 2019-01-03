$(document).ready(() => {
    var server = 'http://99.242.210.34:3000';

    // verify token
    if (!document.cookie.includes('token')) {
        window.location.replace(server);
    }

    var lineSelectHeader = document.getElementById('lineSelectHeader');
    var modeSelectHeader = document.getElementById('modeSelectHeader');
    var materialSelectHeader = document.getElementById('materialSelectHeader');

    var lineSelect = document.getElementById('lineSelect');
    var modeSelect = document.getElementById('modeSelect');
    var materialSelect = document.getElementById('materialSelect');
    var button = document.getElementById('submit');

    lineSelectHeader.innerHTML = 'Loading...';
    modeSelectHeader.style.visibility = 'hidden';
    materialSelectHeader.style.visibility = 'hidden';
    
    // Keep everything hidden until the lines load in
    lineSelect.style.visibility = 'hidden';
    modeSelect.style.visibility = 'hidden';
    materialSelect.style.visibility = 'hidden';
    button.style.visibility = 'hidden';

    // Event listeners

    button.addEventListener('click', () => {
        // Check that all selected options are not default (just in case)
        var number = lineSelect.options[lineSelect.selectedIndex].value;
        var mode = modeSelect.options[modeSelect.selectedIndex].value;
        var material = materialSelect.options[materialSelect.selectedIndex].value;

        if (number != 'Select a Line' && mode != 'Select a Line Mode' && material != 'Select a Material') {
            // All selections are good. Fetch material ID from DB and send as url param
            var postData = {
                number: number,
                line_mode: mode,
                name: material
            };
            $.post(server + '/getMaterialID', postData, (data) => {
                if (data.success) {
                    window.location.replace(server + '/line?i=' + data.material_id);
                } else {
                    alert('Error occurred, try again.');
                }
            });
        }
    });

    lineSelect.addEventListener('change', () => {
        // New line has been chosen. If mode and material are not hidden, need to refresh
        //      their lists.
        var number = lineSelect.options[lineSelect.selectedIndex].value;

        // Update the line modes now that a number has been chosen
        if (number != 'Select a Line') {
            $.post(server + '/getLineModes', {number: number}, (data) => {
                if (data.success) {
                    populateModes(data);
    
                    // Make the modeSelect and label visible
                    modeSelectHeader.style.visibility = 'visible';
                    modeSelect.style.visibility = 'visible';
                } else {
                    alert('Error when fetching line modes');
                }
            });
        }

        if (materialSelect.style.visibility != 'hidden') {
            // Materials not invisible, update list

            var mode = modeSelect.options[modeSelect.selectedIndex].value;
            var postData = {
                number: number,
                line_mode: mode
            };
            $.post(server + '/getMaterials', postData, (data) => {
                if (data.success) {
                    populateMaterials(data);
                } else {
                    alert('Error fetching materials list');
                }
            });
        }
    });

    modeSelect.addEventListener('change', () => {
        // New line mode has been chosen. If material is not hidden, need to refresh
        //      its list.
        var number = lineSelect.options[lineSelect.selectedIndex].value;
        var mode = modeSelect.options[modeSelect.selectedIndex].value;
        if (number != 'Select a Line' && mode != 'Select a Line Mode') {
            // Material not invisible, update list
            
            var mode = modeSelect.options[modeSelect.selectedIndex].value;
            var postData = {
                number: number,
                line_mode: mode
            };
            $.post(server + '/getMaterials', postData, (data) => {
                if (data.success) {
                    populateMaterials(data);
                } else {
                    alert('Error fetching materials list');
                }
            });
        }

        // If the line mode selected isn't the default option
        if (mode != 'Select a Line Mode') {
            
            // Make the materialSelect and label visible
            materialSelectHeader.style.visibility = 'visible';
            materialSelect.style.visibility = 'visible';
        }
    });

    materialSelect.addEventListener('change', () => {
        var material = materialSelect.options[materialSelect.selectedIndex].value;

        // If selected material is not the default option
        if (material != 'Select a Material') {

            // Show the submit button
            button.style.visibility = 'visible';
        }
    });

    // Method to clear and add options to lineSelect
    function populateLines(data) {

        if (data.success) {
            // Clear the current options, and add the default
            while (lineSelect.firstChild) {
                lineSelect.removeChild(lineSelect.firstChild);
            }
            var defaultOption = document.createElement('option');
            var defaultOptionText = document.createTextNode('Select a Line');
            defaultOption.appendChild(defaultOptionText);
            lineSelect.appendChild(defaultOption);

            // Add the rest of the options from data
            for (var i=0; i<data.lines.length; i++) {
                var newOption = document.createElement('option');
                var newOptionText = document.createTextNode(data.lines[i].number);

                newOption.appendChild(newOptionText);
                lineSelect.appendChild(newOption);
            }
        }
    }

    // Method to clear and add options to modeSelect
    function populateModes(data) {

        if (data.success) {
            // Clear the current options, and add the default
            while (modeSelect.firstChild) {
                modeSelect.removeChild(modeSelect.firstChild);
            }
            var defaultOption = document.createElement('option');
            var defaultOptionText = document.createTextNode('Select a Line Mode');
            defaultOption.appendChild(defaultOptionText);
            modeSelect.appendChild(defaultOption);

            // Add the rest of the options from data
            for (var i=0; i<data.modes.length; i++) {
                var newOption = document.createElement('option');
                var newOptionText = document.createTextNode(data.modes[i].line_mode);

                newOption.appendChild(newOptionText);
                modeSelect.appendChild(newOption);
            }
        }
    }

    // Method to clear and add options to materialSelect
    function populateMaterials(data) {

        if (data.success) {
            // Clear the current options, and add the default
            while (materialSelect.firstChild) {
                materialSelect.removeChild(materialSelect.firstChild);
            }
            var defaultOption = document.createElement('option');
            var defaultOptionText = document.createTextNode('Select a Material');
            defaultOption.appendChild(defaultOptionText);
            materialSelect.appendChild(defaultOption);

            // Add the rest of the options from data
            for (var i=0; i<data.materials.length; i++) {
                var newOption = document.createElement('option');
                var newOptionText = document.createTextNode(data.materials[i].name);

                newOption.appendChild(newOptionText);
                materialSelect.appendChild(newOption);
            }
        }
    }

    // Get list of lines from server first
    $.get(server + '/getLines', (data) => {
        populateLines(data);

        // Change the line header, and make the lineSelect visible again
        lineSelectHeader.innerHTML = 'Select a Line';
        lineSelect.style.visibility = 'visible';
    });
});