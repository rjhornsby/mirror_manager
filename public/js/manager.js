
var phrase_api = "http://" + $(location).attr('host') + "/phrases";
var cached_data = [];
$(document).ready(function() {

    var fetch = $.getJSON(phrase_api, {});

    fetch.done(function(data) {
            draw_table(data);
            cached_data = data;
        });
    fetch.fail(function(response){
        api_fail('Retrieving phrases', response)
    });
    $('#save_changes').click(function() { save_changes(); });
    $('#cancel_changes').click(function() { reset_ui(); });

});

function api_fail(action, response) {
    var error_text = response.status + ' ' + response.statusText;
    if (response.responseJSON) {
        error_text += '\n\n' + response.responseJSON.message;
    }
    alert(action + ' failed: ' + error_text);
}

function reset_ui() {
    draw_table(cached_data);
    // $('#save_changes').prop("disabled", true);
    // $('#cancel_changes').prop("disabled", true);
    //
    // $('#save_changes').removeClass('enabled');
    // $('#cancel_changes').removeClass('enabled');
}

function save_changes() {

    var data={phrases: []};

    $('.phrase-item').each(function() {
        var row = $(this);
        var phrase_text = row.children('.phrase-text').text();
        var duration = row.find('.select-duration').find(':selected').val();
        if ( row.hasClass('deleted') || row.hasClass('new')) {
            // Effectively, continue
            return true;
        }
        data.phrases.push({'text': phrase_text, 'duration': duration});

    });
    // TODO: Validate data before trying to post?
    var posting = $.post(phrase_api, JSON.stringify(data), function(response) {}, 'json');
    posting.done(function(result) {
        cached_data = data;
        reset_ui();
        $("body").toggleClass("dialogisOpen");
    });
    posting.fail(function(response) {
        api_fail('Saving', response);
    });
}

function draw_table(data) {
    $(".phrase-item").remove();
    var phrases = data.phrases;

    // Provide for a new phrase to be added by the user
    add_phrase_to_table({text: "[add new phrase]", duration: 2, is_new: true})

    if (phrases.length) {
        $.each(phrases, function(index, phrase) {
            add_phrase_to_table(phrase);
        });
    }
}

function add_phrase_to_table(phrase) {
    var phraseList = $('#phrase-list');
    var phrase_item = $('<div class="row phrase-item"/>');
    var phrase_item_phrase = $('<div class="cell phrase-text" />');
    var phrase_item_duration = $('<div class="cell duration" />');
    var trash = $('<div class="cell trash"></div>');
    trash.append($('<img src="images/icons/trash.png" width="24" height="24"/>'));
    $(phrase_item_phrase).html(phrase.text);
    $(phrase_item_duration).html(generate_duration_opt(phrase.duration));
    phrase_item.append(phrase_item_phrase);
    phrase_item.append(phrase_item_duration);
    phrase_item.append(trash);
    phraseList.append(phrase_item);

    if ("is_new" in phrase) {
        phrase_item.addClass('new');
    }

    // Set action listeners
    trash.click(function() { trash_phrase(phrase_item); });
    phrase_item_phrase.click(function() { edit_phrase(phrase_item); });
}

function edit_phrase(row) {
    var phrase_item_phrase = row.children('.phrase-text');
    var editable = $('<input class="editable" type="text"/>');
    var phrase_text = phrase_item_phrase.text();
    var original_phrase = phrase_text;
    phrase_item_phrase.unbind('click');
    phrase_item_phrase.empty();
    if ( ! row.hasClass('new')) {
        editable.val(phrase_text);
    }
    editable.blur(function() { save_phrase(row, original_phrase); });
    editable.keypress( function(event) {
        if ( event.which == 13 ) { save_phrase(row, original_phrase); }
    });
    phrase_item_phrase.append(editable);
    editable.focus();
}

function save_phrase(row, original_phrase) {
    var phrase_item_phrase = row.children('.phrase-text');
    var editable = phrase_item_phrase.children('input');
    var phrase_text = $.trim(editable.val());
    if (phrase_text.length == 0) {
        phrase_text = original_phrase;
    }
    editable.remove();
    phrase_item_phrase.text(phrase_text);
    phrase_item_phrase.click(function() { edit_phrase(row); });

    if (phrase_text != original_phrase) {
        row.removeClass('new');
        set_changes_pending();
    }

}

function trash_phrase(row) {
    var phrase_item_phrase = row.children('.phrase-text');
    var select = row.find('.select-duration');
    var action_icon = row.children().find('img');
    if (row.hasClass('deleted')) {
        row.removeClass('deleted');
        select.prop('disabled', false);
        select.show();
        action_icon.attr('src', 'images/icons/trash.png');
        action_icon.attr('alt', 'Delete phrase');
        phrase_item_phrase.click(function() { edit_phrase(row); });
    } else {
        row.addClass('deleted');
        select.prop('disabled', true);
        select.hide();
        action_icon.attr('src', 'images/icons/undo.png');
        action_icon.attr('alt', 'Undo');
        phrase_item_phrase.unbind('click');
        set_changes_pending();
    }
}

function generate_duration_opt(selected_duration) {
    var select = $('<select class="select-duration" />');
    for(var duration=2; duration < 11; duration++) {
        var opt = $("<option />");
        opt.val(duration);
        opt.html(duration);
        select.append(opt);
    }
    select.val(selected_duration.toString());
    select.change(function() { set_changes_pending(); });
    return select;
}

function set_changes_pending() {
    // $('.icon').addClass('enabled');
    // $('#save_changes').prop("disabled", false);
    // $('#cancel_changes').prop("disabled", false);
}

$.put = function(url, data, callback, type){

    if ( $.isFunction(data) ){
        type = type || callback,
            callback = data,
            data = {}
    }

    return $.ajax({
        url: url,
        type: 'PUT',
        success: callback,
        data: data,
        contentType: type
    });
}