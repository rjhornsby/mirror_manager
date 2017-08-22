var track_api = "http://" + $(location).attr('host') + "/music";
$(document).ready(function() {

    var fetch = $.getJSON(track_api, {});

    fetch.done(function(data) {
        populate_tracks_table(data);
        cached_data.tracks = data;
    });
    fetch.fail(function(response){
        api_fail('Retrieving tracks', response)
    });
});

function populate_tracks_table(data) {}