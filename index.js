
$(document).ready(function () {

    /************************************************************
    *************************************************************
    * Initial Page Setup
    *************************************************************
    ************************************************************/
    var todays_date = new Date();
    var calendar_date = todays_date;
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Set the month title with todays date
    $("#month_title").text(formatted_date(calendar_date));


    /************************************************************
    *************************************************************
    * Functions
    *************************************************************
    ************************************************************/

    // JQuery function for when a previous month nav button is clicked
    $("#previous_month").click(function () {
        advance_month(-1);
    });

    // JQuery function for when a next month nav button is clicked
    $("#next_month").click(function () {
        advance_month(1);
    });

   /**********************************
   * Advance_month
   * Advances and sets month displayed 
   * on the calendar using a_value.
   **********************************/
    function advance_month(a_value)
    {
        calendar_date.setMonth(calendar_date.getMonth() + a_value)
        $("#month_title").text(formatted_date(calendar_date));
    }

    /**********************************
    * Formatted_date
    * Returns a formatted string version
    * of a_date.
    **********************************/
    function formatted_date(a_date)
    {
        var date = new Date();
        date = a_date;
        return months[date.getMonth()] + ' ' + date.getFullYear();
    }  

});

