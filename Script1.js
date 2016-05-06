var myList = [
            { "Meal_name": "Chicken & Brocolli", "Ingredient": "chicken", "Type": "meat" },
            { "Meal_name": "Chicken & Brocolli", "Ingredient": "rice", "Type": "grain" },
            { "Meal_name": "Chicken & Brocolli", "Ingredient": "brocolli", "Type": "vegitable" }
            ];

// Builds the HTML Table out of myList json data from Ivy restful service.
function buildHtmlTable() {
    var columns = addAllColumnHeaders(myList);

    for (var i = 0 ; i < myList.length ; i++) {
        var row$ = $('<tr/>');
        for (var colIndex = 0 ; colIndex < columns.length ; colIndex++) {
            var cellValue = myList[i][columns[colIndex]];

            if (cellValue == null) { cellValue = ""; }

            row$.append($('<td/>').html(cellValue));
        }
        $("#meal_ingredients").append(row$);
    }
}

// Adds a header row to the table and returns the set of columns.
// Need to do union of keys from all records as some records may not contain
// all records
function addAllColumnHeaders(myList) {
    //$("#meal_ingredients").append("<tr><th>Meal<th></tr>");
    var columnSet = [];
    var topHeaderTr$ = $('<tr/>');
    var headerTr$ = $('<tr/>');
    var topHeaderSet = false;

    for (var i = 0 ; i < myList.length ; i++) {
        var rowHash = myList[i];
        for (var key in rowHash) {
            if ($.inArray(key, columnSet) == -1) {
                if (key == "Meal_name") {
                    if (topHeaderSet == 0) {
                        var columnCount = Object.keys(rowHash).length
                        var headerTag = "<th colspan=\"" + columnCount + "\"/>"
                        topHeaderTr$.append($(headerTag).html(rowHash[key]));
                        topHeaderSet = true;
                    }
                }
                else {
                    columnSet.push(key);
                    headerTr$.append($('<th/>').html(key));
                }
            }
        }
    }
    $("#meal_ingredients").append(topHeaderTr$);
    $("#meal_ingredients").append(headerTr$);

    return columnSet;
}