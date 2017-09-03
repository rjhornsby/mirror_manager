$(document).ready(function() {
    $('#config-music-toggle').click(function() {
        configurationController.toggle_music();
    });
    $('#config-restart').click(function() {
        configurationController.restart();
    });
});

var configurationController = {
    toggle_music: function() {
        var element = $('#config-music-toggle').children('i');
        var new_state;
        if (element.hasClass('fa-volume-off')) {
            element.removeClass('fa-volume-off');
            element.addClass('fa-volume-up');
            new_state = 'on';
        } else {
            element.removeClass('fa-volume-up');
            element.addClass('fa-volume-off');
            new_state = 'off';
        }
        var api_uri = "http://" + $(location).attr('host') + "/config/music/" + new_state;
        $.put(api_uri, null, function(response) {}, 'json')
            .done(function() {
            })
            .fail(function(response) {
                api_fail('Toggling music', response);
            });
    },
    restart: function() {
        var music_toggle = $('#config-music-toggle');
        var disable_list = [];
        $.merge(disable_list, $('[id^="tab"]'));
        $.merge(disable_list, $('[id^="config-wifi"]').children('input'));
        $.merge(disable_list, music_toggle);
        
        disable_list.forEach(function(ele) {
            if (ele.prop === undefined) {
                ele.disabled = true
            } else {
                ele.prop('disabled', true);
            }
        });

        $('#config-restart').children('i').addClass('fa-spin');
        music_toggle.unbind();
        $('body').addClass('restarting');
        $('main').addClass('restarting');
    }
};
