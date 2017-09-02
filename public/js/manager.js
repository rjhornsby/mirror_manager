var cached_data = {phrases: [], tracks: []};

Dropzone.options.tracksDropzone = {
    maxFilesize: 30,
    acceptedFiles: 'audio/mpeg',
    addRemoveLinks: true,
    init: function() {
        // TODO: DZ tooltip on 500 error is 'Object object'
        this.on("error", function(file, errorMessage) {
            trackController.view.upload_error(file, errorMessage);
        });
    }
};

function api_fail(action, response) {
    var error_text = response.status + ' ' + response.statusText;
    if (response.responseJSON) {
        error_text += '\n\n' + response.responseJSON.message;
    }
    alert(action + ' failed: ' + error_text);
}

$.delete = function(url, data, callback, type) {
    if ( $.isFunction(data) ){
        type = type || callback,
            callback = data,
            data = {}
    }

    return $.ajax({
        url: url,
        type: 'DELETE',
        success: callback,
        data: data,
        contentType: type
    });
};