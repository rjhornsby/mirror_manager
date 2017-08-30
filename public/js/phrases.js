var cached_data = {};

$(document).ready(function() {

    var fetch = $.getJSON(phraseController.api_uri, {});

    fetch.done(function(data) {
            phraseController.view.populate_table(data);
            cached_data.phrases = data.phrases;
        });
    fetch.fail(function(response){
        api_fail('Retrieving phrases', response)
    });
});

var phraseController = {
    api_uri: "http://" + $(location).attr('host') + "/phrases"
};

phraseController.model = {
    commit: function() {
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
        $.post(phraseController.api_uri, JSON.stringify(data), function(response) {}, 'json')
            .done(function() {
                cached_data.phrases = data.phrases;
            })
            .fail(function(response) {
                api_fail('Saving', response);
            });
    }


};

phraseController.view = {
    populate_table: function(data) {
        $(".phrase-item").remove();
        var phrases = data.phrases;

        if (phrases.length) {
            $.each(phrases, function(index, phrase) {
                phraseController.view.add_phrase_to_table(phrase);
            });
        }
        // Provide for a new phrase to be added by the user
        phraseController.view.add_phrase_to_table({text: "[add new phrase]", duration: 2, is_new: true});
    },
    add_phrase_to_table: function(phrase) {
        var phrase_table = $('#phrase-list');
        var row = $('<div class="row phrase-item"/>');
        var cell_phrase = $('<div class="cell phrase-text" />');
        var cell_duration = $('<div class="cell duration" />');
        $(cell_phrase).html(phrase.text);
        $(cell_duration).html(phraseController.dom.generate_duration_opt(phrase.duration));
        row.append(cell_phrase);
        row.append(cell_duration);

        phrase_table.append(row);

        if ("is_new" in phrase) {
            row.addClass('new');
            row.append('<div class="cell trash"/>');
        } else {
            phraseController.dom.create_trashcan(row);
        }

        // Set action listeners
        cell_phrase.click(function() { phraseController.view.edit(row); });
    },
    edit: function(row) {
        var phrase_item_phrase = row.children('.phrase-text');
        var editable = $('<input class="editable" type="text"/>');
        var phrase_text = phrase_item_phrase.text();
        var original_phrase = phrase_text;
        phrase_item_phrase.unbind('click');
        phrase_item_phrase.empty();
        if ( ! row.hasClass('new')) {
            editable.val(phrase_text);
        }
        editable.blur(function() { phraseController.view.save(row, original_phrase); });
        editable.keypress( function(event) {
            if ( event.which === 13 ) { phraseController.view.save(row, original_phrase); }
        });
        phrase_item_phrase.append(editable);
        editable.focus();
    },
    delete: function(row) {
        var select = row.find('.select-duration');
        row.addClass('deleted');
        select.prop('disabled', true);
        row.fadeOut("slow", function() {
            row.remove();
            phraseController.model.commit();
        });
    },
    save: function(row, original_phrase) {
        var phrase_item_phrase = row.children('.phrase-text');
        var editable = phrase_item_phrase.children('input');
        var phrase_text = $.trim(editable.val());
        if (phrase_text.length === 0) {
            phrase_text = original_phrase;
        }
        editable.remove();
        phrase_item_phrase.text(phrase_text);
        phrase_item_phrase.click(function() { phraseController.view.edit(row); });

        if (phrase_text !== original_phrase) {
            if (row.hasClass('new')) {
                phraseController.dom.create_trashcan(row);
                row.removeClass('new');
                phraseController.view.add_phrase_to_table({text: "[add new phrase]", duration: 2, is_new: true});
            }
            phraseController.model.commit();
        }

    }
};

phraseController.dom = {
    generate_duration_opt: function(selected_duration) {
        var select = $('<select class="select-duration" />');
        for(var duration=2; duration < 11; duration++) {
            var opt = $("<option />");
            opt.val(duration);
            opt.html(duration);
            select.append(opt);
        }
        select.val(selected_duration.toString());
        select.change(function() { phraseController.model.commit(); });
        return select;
    },
    create_trashcan: function(row) {
        var trash = row.children('.trash');
        if ( trash.length === 0 ) {
            trash = $('<div class="cell trash"></div>');
        }
        trash.append($('<img src="images/icons/trash.png" width="24" height="24"/>'));
        row.append(trash);
        trash.click(function() { phraseController.view.delete(row); });
    }
};


