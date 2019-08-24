window.$ = window.jQuery = require('jquery');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database('./src/database.sqlite');

// register listeners
$("#search-text").on('keyup', function (e) {
    if (e.keyCode === 13) {
        shabad.search();
    }
});

var shabad = {
    currentShabad: {},
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
        db.each(
            "SELECT * FROM lines where id = '" + id + "'",
            function(err, row) {
                $('#gurmukhi').html(template.removePunctuations(row.gurmukhi));
            }
        );

        var shabadResult = '';
        db.each(
            "SELECT * FROM lines where shabad_id = '" + shabadId + "'",
            function(err, row) {
                shabadResult += template.getSearchLine(row);
            }
        );

    },
    showPankti: function(id) {
        
    }
};

var template = {
    getSearchLine: function(row) {
        return '<li class="list-group-item">'
        + '<a href="#" onclick="shabad.show(\'' + row.id + '\', \'' + row.shabad_id + '\')">' + template.removePunctuations(row.gurmukhi) + '</a>'
        + '</li>';
    },
    getShabadLine: function(row) {
        return '<li class="list-group-item">'
        + '<a href="#" onclick="shabad.showPankti(\'' + row.id + '\')">' + template.removePunctuations(row.gurmukhi) + '</a>'
        + '</li>';
    },
    showPanktiLine: function(row) {
        $('#gurmukhi').html(row.gurmukhi);
    },
    removePunctuations(gurmukhi) {
        return gurmukhi.replace(/;/g, "");
    }
};

