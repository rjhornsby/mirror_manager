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

        track_table.append(row);

        // trackController.dom.create_trashcan(row);

    },
    format_duration: function(duration_as_seconds) {
        var minutes = parseInt(duration_as_seconds / 60);
        var seconds = ('00' + parseInt(duration_as_seconds % 60)).slice(-2);
        return minutes + ":" + seconds;
    }
};

