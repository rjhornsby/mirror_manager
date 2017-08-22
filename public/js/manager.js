var cached_data = {phrases: [], tracks: []};

function api_fail(action, response) {
    var error_text = response.status + ' ' + response.statusText;
    if (response.responseJSON) {
        error_text += '\n\n' + response.responseJSON.message;
    }
    alert(action + ' failed: ' + error_text);
}