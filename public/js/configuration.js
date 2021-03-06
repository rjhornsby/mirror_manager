$(document).ready(function() {
    $('#config-music-toggle').click(function() {
        configurationController.toggle_music();
    });
    $('#save-wifi-config').click(function() {
        configurationController.save_wifi_config();
    });
    var fetch = $.getJSON('/config', {});

    fetch.done(function(config) {
       configurationController.populate_wifi_config(config['wifi']);
       configurationController.set_music(config['music'] == 'on');
    });
    fetch.fail(function(response){
        api_fail('retrieving configuration', response)
    });
});

var configurationController = {
    toggle_music: function(state) {
        var element = $('#config-music-toggle').children('i');
        var new_state;
        if (element.hasClass('fa-volume-off')) {
            configurationController.set_music(true);
            new_state = 'on';
        } else {
            configurationController.set_music(false);
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
    set_music: function(state) {
        var element = $('#config-music-toggle').children('i');
        if (state == true) {
            element.removeClass('fa-volume-off');
            element.addClass('fa-volume-up');
        } else {
            element.removeClass('fa-volume-up');
            element.addClass('fa-volume-off');
        }
    },
    populate_wifi_config: function(wifi_status) {
        $('#config-wifi-ssid').val(wifi_status['ssid']);
    },
    save_wifi_config: function() {
        var data = {
            'ssid': $('#config-wifi-ssid').val(),
            'password': $('#config-wifi-password').val()
        };
        $.post('/config/wifi/network', JSON.stringify(data), function(response) {}, 'json')
            .done(function() {
                $('#save-wifi-config').hide();
                $('#wifi-config-saved').css('display', 'inline-block');
                setTimeout(function() {
                    $('#save-wifi-config').show();
                    $('#wifi-config-saved').css('display', 'none');
                }, 3000)
            })
            .fail(function(response) {
                api_fail('setting wifi config', response);
            });

    }
};
