
var phrase_api = "http://localhost:9292/phrases";

$(document).ready(function() {
    $.getJSON( phrase_api, {})
        .done(function(data) {
            draw_table(data);
        });
});

function draw_table(data) {
    var phraseList = $('#phrase-list');
    $(".phrase-item").remove();
    var phrases = data.phrases;
    if (phrases.length) {
        $.each(phrases, function(index, phrase) {
            var phrase_item = $('<div class="row phrase-item"/>');
            var phrase_item_phrase = $('<div class="cell phrase-text" />');
            var phrase_item_duration = $('<div class="cell duration" />');
            var trash = $('<div class="cell trash"></div>');
            trash.append($('<img src="images/icons/garbage.png" width="24" height="24"/>'));
            trash.click(function() { trash_phrase(phrase_item) });
            $(phrase_item_phrase).html(phrase.text);
            $(phrase_item_duration).html(generate_duration_opt(phrase.duration));
            phrase_item.append(phrase_item_phrase);
            phrase_item.append(phrase_item_duration);
            phrase_item.append(trash);
            phraseList.append(phrase_item)
        });
    }
}

function trash_phrase(row) {
    console.log("removing row");
    row.remove();
}

function generate_duration_opt(selected_duration) {
    var select = $('<select class="duration" />');
    for(var duration=2; duration < 11; duration++) {
        var opt = $("<option />");
        opt.val(duration);
        opt.html(duration);
        select.append(opt);
    }
    select.val(selected_duration.toString());
    return select;
}