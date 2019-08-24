window.$ = window.jQuery = require('jquery');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./src/database.sqlite');

// register listeners
$("#search-text").on('keyup', function (e) {
    if (e.keyCode === 13) {
        shabad.search();
    }
});

$('body').on('keyup', function(e) {
    if (! $('#shabad-tab').hasClass('d-none')) {
        if (e.keyCode == 37) {
            // previous key
            shabad.showPrevLine();
        } else if (e.keyCode == 39) {
            // next key
            shabad.showNextLine();
        }
    }
});

var shabad = {
    currentShabad: [],
    currentLineIndex: 0,
    search: function() {
        var searchText = $('#search-text').val();
        var searchResult = '';
        db.each(
            "SELECT * FROM lines where first_letters like '%" + searchText + "%'",
            function(err, row) {
                searchResult += template.getSearchLine(row);
                // console.log(row.id, row.shabad_id);
            },
            function() {
                $('#search-result').html(searchResult);
            }
        );
    },
    show: function(id, shabadId) {
        shabad.currentShabad = [];
        shabad.showPankti(id);

        var shabadResult = '';
        db.each(
            "SELECT * FROM lines where shabad_id = '" + shabadId + "'",
            function(err, row) {
                if (id == row.id) {
                    shabad.currentLineIndex = shabad.currentShabad.length;
                }
                shabad.currentShabad.push(row);
                shabadResult += template.getShabadLine(row);
            },
            function() {
                $('#shabad-tab').html(shabadResult).removeClass('d-none');
                $('#search-tab').addClass('d-none');
                template.highlightPankti(id);
            }
        );

    },
    showPankti: function(id) {
        db.each(
            "SELECT * FROM lines " +
            "LEFT JOIN translations ON lines.id = translations.line_id " +
            "where lines.id = '" + id + "'",
            function(err, row) {
                $('#gurmukhi').html(template.removePunctuations(row.gurmukhi));
                if (row.translation_source_id === 1) {
                    $('#translation').html(row.translation);
                } else if (row.translation_source_id === 3) {
                    $('#teeka').html(row.translation);
                }
            },
            function() {
                template.highlightPankti(id);
            }
        );
    },
    showNextLine: function() {
        if ((shabad.currentLineIndex + 1) === shabad.currentShabad.length) {
            return;
        }

        shabad.currentLineIndex++;
        shabad.showPankti(shabad.currentShabad[shabad.currentLineIndex].id);
    },
    showPrevLine: function() {
        if (shabad.currentLineIndex === 0) {
            return;
        }
        shabad.currentLineIndex--;
        shabad.showPankti(shabad.currentShabad[shabad.currentLineIndex].id);
    }
};

var template = {
    getSearchLine: function(row) {
        return '<li class="list-group-item">'
        + '<a href="#" onclick="shabad.show(\'' + row.id + '\', \'' + row.shabad_id + '\')">' + template.removePunctuations(row.gurmukhi) + '</a>'
        + '</li>';
    },
    getShabadLine: function(row) {
        return '<a id="pankti-' + row.id + '" class="list-group-item list-group-item-action" '
        + 'onclick="shabad.showPankti(\'' + row.id + '\')">' + template.removePunctuations(row.gurmukhi)
        + '</a>';
    },
    showPanktiLine: function(row) {
        $('#gurmukhi').html(row.gurmukhi);
    },
    removePunctuations(gurmukhi) {
        return gurmukhi.replace(/\;/g, "")
            .replace(/\./g, "");
    },
    highlightPankti: function(id) {
        if ($('#pankti-' + id).length === 0) {
            return;
        }

        $('#shabad-tab a').removeClass('list-group-item-dark');
        $('#pankti-' + id).addClass('list-group-item-dark');
        // $.scrollTo($('#pankti-' + id), 1000);

        // console.log('#pankti-' + id);
        // var id = '#pankti-FZDR';
        $('#shabad-tab').animate({scrollTop: $('#pankti-' + id).offset().top},"fast");
        // var element = document.getElementById('pankti-' + id);
        // element.scrollTo();
    }
};

