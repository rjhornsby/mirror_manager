var cached_data = {phrases: [], tracks: []};

Dropzone.options.tracksDropzone = {
    maxFilesize: 30,
    acceptedFiles: 'audio/mpeg,audio/mp3',
    addRemoveLinks: true,
    init: function() {
        // FIXME: DZ tooltip on 500 error is 'Object object'
        this.on("error", function(file, errorMessage) {
            trackController.view.upload_error(file, errorMessage);
        });
        this.on("success", function(file, response) {
            trackController.view.upload_success(file, response);
            this.removeFile(file);
        });
    }
};

function api_fail(action, response) {
    var error_text = null;
    // if (response.responseJSON) {
    //    error_text = '\n\n' + response.responseJSON.responseText;
    //} else {
       error_text = '\n\n' + response.responseText;
    // }
    alert('[' + response.status + '] Error ' + action + ': ' + error_text);
}

// PUT + DELETE methods
jQuery.each( [ "put", "delete" ], function( i, method ) {
    jQuery[ method ] = function( url, data, callback, type ) {
        if ( jQuery.isFunction( data ) ) {
            type = type || callback;
            callback = data;
            data = undefined;
        }

        return jQuery.ajax({
            url: url,
            type: method,
            dataType: type,
            data: data,
            success: callback
        });
    };
});
