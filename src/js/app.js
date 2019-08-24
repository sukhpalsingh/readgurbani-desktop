window.$ = window.jQuery = require('jquery');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./src/database.sqlite');

var shabad = {
    currentShabad: [],
    currentLineSerial: 0,
    currentBookmarkSerial: 0,
    currentSource: 'shabad',
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
        shabad.currentSource = 'shabad';
        shabad.currentShabad = [];

        var shabadResult = '';
        db.each(
            "SELECT * FROM lines where shabad_id = '" + shabadId + "'",
            function(err, row) {
                shabad.currentShabad.push(row);
                shabadResult += template.getShabadLine(row);

                if (id == row.id) {
                    shabad.showPankti(shabad.currentShabad.length);
                    shabad.currentBookmarkSerial = shabad.currentShabad.length;
                }
            },
            function() {
                $('#shabad-tab').html(shabadResult);
                template.showPanel('shabad-tab');
                template.highlightPankti(id);
            }
        );

    },
    showPankti: function(serial) {
        shabad.currentLineSerial = serial;
        var id = shabad.currentShabad[shabad.currentLineSerial - 1].id;
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
        if (shabad.currentSource === 'baani') {
            baani.openedId = id;
            baani.openSerial = serial;
        }
    },
    showNextLine: function() {
        if (shabad.currentLineSerial === shabad.currentShabad.length) {
            return;
        }

        shabad.showPankti(++shabad.currentLineSerial);
    },
    showPrevLine: function() {
        if (shabad.currentLineSerial === 1) {
            return;
        }

        shabad.showPankti(--shabad.currentLineSerial);
    },
    loadBanis: function() {
        var baniResult = '';
        db.each(
            "SELECT * FROM banis",
            function(err, row) {
                baniResult += template.getBaniListLine(row);
            },
            function() {
                $('#pothi-tab').html(baniResult);
            }
        );
    }
};

var baani = {
    openedId: '',
    openSerial: 1,
    show: function(baaniId) {
        shabad.currentSource = 'baani';
        shabad.currentShabad = [];

        var shabadResult = '';
        var matchFound = false;
        db.each(
            "SELECT * FROM bani_lines "
            + "INNER JOIN lines ON bani_lines.line_id = lines.id "
            + "WHERE bani_id = '" + baaniId + "' "
            + "ORDER BY line_group, order_id",
            function(err, row) {
                shabad.currentShabad.push(row);
                shabadResult += template.getShabadLine(row);

                if (baani.openedId === '') {
                    baani.openedId = row.id;
                } else if (baani.openedId === row.id) {
                    matchFound = true;
                }
            },
            function() {
                $('#shabad-tab').html(shabadResult);
                template.showPanel('shabad-tab');
                if (matchFound === false) {
                    baani.openedId = '';
                    baani.openSerial = 1;
                }

                shabad.showPankti(baani.openSerial);
                shabad.currentBookmarkSerial = baani.openSerial;
            }
        );
    }
};

var template = {
    getSearchLine: function(row) {
        return '<a href="#" class="list-group-item list-group-item-action" onclick="shabad.show(\'' + row.id + '\', \'' + row.shabad_id + '\')">'
        + template.removePunctuations(row.gurmukhi) + '</a>';
    },
    getShabadLine: function(row) {
        var serial = shabad.currentShabad.length;
        return '<a href="#" id="pankti-' + row.id + '" class="list-group-item list-group-item-action" '
        + 'onclick="shabad.showPankti(' + serial + ')">' + template.removePunctuations(row.gurmukhi)
        + '</a>';
    },
    getBaniListLine: function(row) {
        return '<a href="#" id="baani-' + row.id + '" class="list-group-item list-group-item-action" '
        + 'onclick="baani.show(' + row.id + ')">' + row.name_gurmukhi
        + '</a>'
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
    },
    showPanel: function(id) {
        $('.tab').addClass('d-none');
        $('.tab-btn').addClass('text-muted');
        $('#' + id).removeClass('d-none');
        $('#' + id + '-btn').removeClass('text-muted');
    },
    togalOverlaySize: function() {
        $('.overlay-panel').toggleClass('minimised');
        $('.overlay-panel .window-btn').toggleClass('d-none');
        $('.overlay-panel .card-body').toggleClass('d-none');
        $('.overlay-panel .card-footer').toggleClass('d-none');
    }
};

// register listeners
$('body').on('keydown', function(e) {
    if (! $('#shabad-tab').hasClass('d-none')) {
        if (e.keyCode == 37) {
            // previous key
            shabad.showPrevLine();
        } else if (e.keyCode == 39) {
            // next key
            shabad.showNextLine();
        } else if (e.keyCode == 32) {
            // space key
            shabad.showPankti(shabad.currentBookmarkSerial);
        }
    } else if (! $('#search-tab').hasClass('d-none')) {
        if (e.keyCode === 13) {
            shabad.search();
        }
    }
});

shabad.loadBanis();