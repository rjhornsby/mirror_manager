$(document).ready(function() {
    $('#config-music-toggle').click(function() {
        configurationController.toggle_music();
    });
    $('#save-wifi-config').click(function() {
        configurationController.save_wifi_config();
    });
    var fetch = $.getJSON('/config/wifi/network', {});

    fetch.done(function(data) {
       configurationController.populate_wifi_config(data)
    });
    fetch.fail(function(response){
        api_fail('Retrieving wifi config', response)
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
                api_fail('Saving', response);
            });

    }
};
