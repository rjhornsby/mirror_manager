var phrase_api = "http://" + $(location).attr('host') + "/phrases";

$(document).ready(function() {

    var fetch = $.getJSON(phrase_api, {});

    fetch.done(function(data) {
            populate_phrases_table(data);
            cached_data.phrases = data.phrases;
        });
    fetch.fail(function(response){
        api_fail('Retrieving phrases', response)
    });
});

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
    var posting = $.post(phrase_api, JSON.stringify(data), function(response) {}, 'json')
        .done(function(result) {
            cached_data.phrases = data.phrases;
        })
        .fail(function(response) {
            api_fail('Saving', response);
        });
}

function populate_phrases_table(data) {
    $(".phrase-item").remove();
    var phrases = data.phrases;

    if (phrases.length) {
        $.each(phrases, function(index, phrase) {
            add_phrase_to_table(phrase);
        });
    }
    // Provide for a new phrase to be added by the user
    add_phrase_to_table({text: "[add new phrase]", duration: 2, is_new: true});
}

function create_trashcan(row) {
    var trash = row.children('.trash');
    if ( trash.length == 0 ) {
        var trash = $('<div class="cell trash"></div>');
    }
    trash.append($('<img src="images/icons/trash.png" width="24" height="24"/>'));
    row.append(trash);
    trash.click(function() { trash_phrase(row); });
}

function add_phrase_to_table(phrase) {
    var phrase_table = $('#phrase-list');
    var row = $('<div class="row phrase-item"/>');
    var cell_phrase = $('<div class="cell phrase-text" />');
    var cell_duration = $('<div class="cell duration" />');
    $(cell_phrase).html(phrase.text);
    $(cell_duration).html(generate_duration_opt(phrase.duration));
    row.append(cell_phrase);
    row.append(cell_duration);

    phrase_table.append(row);

    if ("is_new" in phrase) {
        row.addClass('new');
        row.append('<div class="cell trash"/>');
    } else {
        create_trashcan(row);
    }

    // Set action listeners
    cell_phrase.click(function() { edit_phrase(row); });
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
        if (row.hasClass('new')) {
            create_trashcan(row);
            row.removeClass('new');
            add_phrase_to_table({text: "[add new phrase]", duration: 2, is_new: true});
        }
        save_changes();

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
        row.fadeOut("slow", function() {
            save_changes();
            row.remove();
        });
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
    select.change(function() { save_changes(); });
    return select;
}

