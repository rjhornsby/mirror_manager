$(document).ready(function() {

    var fetch = $.getJSON(trackController.api_uri, {});

    fetch.done(function(data) {
        trackController.view.populate_tracks_table(data);
        cached_data.tracks = data;
    });
    fetch.fail(function(response){
        api_fail('Retrieving tracks', response)
    });
});

var trackController = {
    api_uri: "http://" + $(location).attr('host') + "/tracks"
};

trackController.model = {
    delete: function(track) {
        $.delete(trackController.api_uri + '/' + track, JSON.stringify(track), function(response) {}, 'json')
            .done(function() {
            })
            .fail(function(response) {
                api_fail('Deleting', response);
            });
    }
};

trackController.view = {
    populate_tracks_table: function(tracks) {
        if (tracks.length) {
            $.each(tracks, function(index, track) {
                trackController.view.add_track_to_table(track);
            });
        }
    },
    add_track_to_table: function(track) {
        var track_table = $('#track-list');
        var row = $('<div class="row track-item"/>');
        var cell_title = $('<div class="cell track-title" />');
        var cell_duration = $('<div class="cell duration" />');

        $(cell_title).html(track.metadata.tag.title || track.file);
        $(cell_duration).html(trackController.view.format_duration(track.metadata.length));
        row.append(cell_title);
        row.append(cell_duration);
        row.data('track-id', track.file);

        track_table.append(row);

        trackController.dom.create_trashcan(row);

    },
    delete: function(row) {
        row.addClass('deleted');
        row.fadeOut("slow", function() {
            var track = row.data('track-id');
            row.remove();
            trackController.model.delete(track);
        });
    },
    format_duration: function(duration_as_seconds) {
        var minutes = parseInt(duration_as_seconds / 60);
        var seconds = ('00' + parseInt(duration_as_seconds % 60)).slice(-2);
        return minutes + ":" + seconds;
    },
    upload_error: function(file, errorMessage) {
        if (file.xhr.status != 500) {
            var message = errorMessage.message || errorMessage;
            alert('Upload failed. Error [' + file.xhr.status + ']: ' + message);
        } else {
            alert('Upload failed: internal error');
        }
    },
    upload_success: function(file, response) {
        trackController.view.add_track_to_table(response);
    }
};

trackController.dom = {
    create_trashcan: function(row) {
        var trash = row.children('.trash');
        if ( trash.length === 0 ) {
            trash = $('<div class="cell trash"></div>');
        }
        trash.append($('<img src="images/icons/trash.png" width="24" height="24"/>'));
        row.append(trash);
        trash.click(function() { trackController.view.delete(row); });
    }
};
