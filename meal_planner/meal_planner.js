
/*****************************************************/
/***** Global Variables ******************************/
/*****************************************************/

// Today's full date
var todays_date = new Date();

// The current or most recently chosen date on the calendar (defaulted intially to today's date)
var calendar_date = todays_date;

// An array of the month names
var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Global flag to know if the user is currently editing a meal (edit mode)
var is_edit_mode = false;

// Global flag to know if the user is currently adding a new meal
var is_adding_new_meal = false;

// Global flag to know if the edited data needs to be auto-saved
var is_need_to_auto_save = false;

// Used for recovering from cancelled saves/edits
var previous_meal = { "id": "", "name": "", "image_url": "", "ingredients": [], "recipe": "" };

// The currently selected and updated meal
var current_meal = { "id": "", "name": "", "image_url": "", "ingredients": [], "recipe": "" };

// The temporary meal used in autosave functionality
var auto_saved_meal = { "id": "", "name": "", "image_url": "", "ingredients": [], "recipe": "" };

// The array of every months meal plan
var monthly_meal_plan_data = { "meal_plans": [] };

// The meal plan for the month the users is currently viewing
var current_calendar_month_meal_plan = { "formatted_date": "", "meal_plan": [] };

// Hard coded example month meal plan
var example_meal_plan_json_api = "https://api.myjson.com/bins/156vi5";

// Hard coded default meals for meal list
var default_meals_json_api = "https://api.myjson.com/bins/skhh9";

var meals;






/*****************************************************/
/******** Functions **********************************/
/*****************************************************/

/**
* ON_PAGE_LOAD
* Initializes the page after all the DOM objects have been parsed by the browser.
*
* @para event : The event object for when the page is loaded (not used in this function)
*/
function on_page_load(event) {
    // Check if the user has visted the site before and 
    if (document.cookie[0] != "has_visited=true") {
        // Show a welcome screen if they haven't visited before
        modal = document.getElementById('welcome_modal');
        setup_got_it_button_onclick_function();
        display_modal();
    }

    // Set a cookie saying that the user has visited
    document.cookie = "has_visited=true";

    // Set what happens when the user leaves the web page
    window.onbeforeunload = on_before_unload;

    // Add close modal function to the window.onclick event
    window.addEventListener("click", close_modal);

    // Set the meals from user's meals in storage
    meals = get_user_meals();

    // Setup the calendar title and nav buttons
    setup_calendar_title_and_nav_buttons();

    // Setup the current session's meal plans with user data
    setup_initial_monthly_meal_plan_data();

    // Setup button on click event functions
    setup_calendar_help_button_onclick_function();
    setup_calendar_print_button_onclick_function();
    setup_calendar_grocery_list_button_onclick_function();
    setup_calendar_save_button_onclick_function();
};

/**
* GET_USER_MEALS
* Get the user's meals from storage (not the meal plans but their list of meals)
*/
function get_user_meals() {
    // Request the user's meal data  
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            // Once retrieved, set the meals variable and populate the interface
            meals = JSON.parse(request.responseText);
            populate_meal_list();
            previous_meal = meals[0];
            set_current_meal(meals[0].id); // Set the initial current/previous meals to the first meal when loading the page.
            populate_calendar_days();
            set_meal_editor_data();
        }
    };
    request.open("GET", default_meals_json_api, true);
    request.send();
}


/**
* SETUP_CALENDAR_TITLE_AND_NAV_BUTTONS
* Setup the calendar title section with a title and arrow button functionality
*
*/
function setup_calendar_title_and_nav_buttons() {
    // Calendar month title
    document.getElementById("month_title").innerHTML = formatted_date(calendar_date);

    // Previous month arrow button on click event
    document.getElementById("previous_month").addEventListener("click", function () {
        advance_month(-1);
    })

    // Next month arrow button on click event
    document.getElementById("next_month").addEventListener("click", function () {
        advance_month(1);
    })
}


/**
* ON_BEFORE_UNLOAD
* Actions to take before the web page is exited by the user (e.g. prompt the user if they saved 
*
* @para event : The event object for when the page is being exited (unloaded)
*/
function on_before_unload(event) {

    // Set event to the window's event object, if undefined.
    if (typeof event == 'undefined') {
        event = window.event;
    }

    // If the unload event object really does exist then set the message
    if (event) {
        event.returnValue = 'Did you remember to save your meal plan?';
    }
}

/**
* SETUP_INITIAL_MONTHLY_MEAL_PLAN_DATA
* Does the initial set up of what the user's meal plans are
* to later be displayed.
*/
function setup_initial_monthly_meal_plan_data() {
    // Get all the user's saved meal plans from storage
    var previously_saved_meal_plan_data = localStorage.user_meal_plan_data;

    // If the user has meal plan data
    if (previously_saved_meal_plan_data != null) {
        // Set the meal plan data object
        monthly_meal_plan_data = JSON.parse(previously_saved_meal_plan_data);

        // set the meal plan for the currently view calendar month
        set_initial_calendar_month_meal_plan();
    }
}

/**
* SET_INITIAL_CALENDAR_MONTH_MEAL_PLAN
* Set the meal plan for the calendar's current month 
* so the calendar will be populated with any saved 
* plans for that month (if any).
*/
function set_initial_calendar_month_meal_plan() {
    for (var i = 0; i < monthly_meal_plan_data.meal_plans.length; i++) {
        if (monthly_meal_plan_data.meal_plans[i].formatted_date == formatted_date(calendar_date)) {
            current_calendar_month_meal_plan = monthly_meal_plan_data.meal_plans[i];
            return;
        }
    }

    // If we've gotten this far, then the current month doesn't have a meal plan
    current_calendar_month_meal_plan.formatted_date = formatted_date(calendar_date);
}

/**
* DISPLAY_MODAL
* Displays the welcome modal dialog
*/
function display_modal() {
    document.getElementById('welcome_modal').style.display = "block";
}

/**
* CLOSE_MODAL
* When the user clicks anywhere outside of the modal, close it (make it disappear)
*/
function close_modal(event) {
    var modal = document.getElementById('welcome_modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

/**
* SETUP_GOT_IT_BUTTON_ONCLICK_FUNCTION
* Setup for the "Got it" (or OK) button in the modal dialog
*/
function setup_got_it_button_onclick_function() {
    document.getElementById('got_it_button').onclick = (function (a_nothing) { return function () { got_it_button_onclick(a_nothing); } })(false);
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
// Onclick action for the "Got it" (or OK) button in the modal dialog
function got_it_button_onclick(a_nothing) {
    document.getElementById('welcome_modal').style.display = "none";
}

/**
* HAS_VISITED
* Has the user visited the site before?
*/
function has_visited() {
    return document.cookie[0] = "has_visited=true";
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
// Advances the calendar to a different month based on a_value
function advance_month(a_value) {
    calendar_date.setMonth(calendar_date.getMonth() + a_value)
    var current_calendar_date = formatted_date(calendar_date);
    document.getElementById("month_title").innerHTML = current_calendar_date;

    // Check if a meal plan for this month already exists and set the current_calendar_month_meal_plan to that
    var already_has_meal_plan = false;
    for (var i = 0; i < monthly_meal_plan_data.meal_plans.length; i++) {
        if (monthly_meal_plan_data.meal_plans[i].formatted_date == current_calendar_date) {
            current_calendar_month_meal_plan = monthly_meal_plan_data.meal_plans[i];
            already_has_meal_plan = true;
            break;
        }
    }
    // If no meal plan exists create a new one and push it to the monthly_meal_plan_data
    if (!already_has_meal_plan) {
        var new_month_meal_plan = { "formatted_date": "", "meal_plan": [] };
        new_month_meal_plan.formatted_date = current_calendar_date;
        new_month_meal_plan.meal_plan = [];
        monthly_meal_plan_data.meal_plans.push(new_month_meal_plan);
        current_calendar_month_meal_plan = new_month_meal_plan;
    }

    // Populate the calander
    populate_calendar_days();
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
// Returns a formatted date (e.g. "September 2016")
function formatted_date(a_date) {
    var date = new Date();
    date = a_date;
    return months[date.getMonth()] + ' ' + date.getFullYear();
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
// Populates the calendar with days and meal plan data
function populate_calendar_days() {
    // Clear the calendar (if not empty)
    var calendar_element = document.getElementById('calendar');
    calendar_element.innerHTML = "";

    // Setup number of days, day index, calendar square count, etc.
    var number_of_days = daysInMonth(calendar_date.getMonth(), calendar_date.getFullYear());

    // Used for keeping track of the days in the month
    var day = 1;

    // What day of the week does the first day land on?
    var first_day = first_day_of_month(calendar_date.getFullYear(), calendar_date.getMonth()).getDay();

    // Determine the number of weeks (rows) in the calendar
    var row_count = (((first_day == 5 || first_day == 6) && (number_of_days == 31)) || ((first_day == 6) && (number_of_days >= 30)) ? 6 : 5);

    // The calendar square index (which square is it currently on?)
    var calendar_square_index = 0;

    // Dynamically build the squares
    for (var i = 0; i < row_count; i++) {
        // Create a new week (container) element
        var calendar_week_element = document.createElement("tr");
        calendar_week_element.classList.add("calendar_body_container");

        // Loop through the days of that week and add them to the week
        for (var j = 0; j < 7; j++) {
            // Create a new day
            var calendar_day_element = document.createElement("td");
            calendar_day_element.classList.add("calendar_body_item");

            // Will the calendar_day_element will hold data?
            if (calendar_square_index >= first_day && day <= number_of_days) {
                // Create and setup the data div that will hold meal data for that day
                var calendar_day_data_div_element = document.createElement("div");
                calendar_day_data_div_element.id = "calendar_day_div_" + day;
                calendar_day_data_div_element.setAttribute("ondrop", "drop(event)");
                calendar_day_data_div_element.setAttribute("ondragover", "allow_drop(event)")
                calendar_day_data_div_element.setAttribute("data-day", day);
                calendar_day_data_div_element.innerHTML = day;

                // Add the data div to the element
                calendar_day_element.appendChild(calendar_day_data_div_element);

                // Increment the day
                day++;
            }

            // Add the day to the week
            calendar_week_element.appendChild(calendar_day_element);

            // Increment which square it is on
            calendar_square_index++;
        }

        // Add the week to the calendar
        calendar_element.appendChild(calendar_week_element);
    }

    // Now populate the month with any meal data
    populate_calendar_with_meal_plan();
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
// Return the first day of a month (e.g. Monday = August 1, 2016)
function first_day_of_month(year, month) {
    return new Date(year, month, 1);
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
// Return the number of days in a month (e.g. October = 31)
function daysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
// Populate the current month with the meals
function populate_calendar_with_meal_plan() {
    for (var i = 0; i < current_calendar_month_meal_plan.meal_plan.length; i++) {
        var meal_id = current_calendar_month_meal_plan.meal_plan[i].meal.id;
        var day = current_calendar_month_meal_plan.meal_plan[i].day;
        var image_url = current_calendar_month_meal_plan.meal_plan[i].meal.image_url;

        var calendar_day_element = document.getElementById('calendar_day_div_' + day);

        var image_element = document.createElement("img");
        image_element.setAttribute('id', 'drag_' + meal_id + '_' + i + '_' + '_calendar');
        image_element.setAttribute('src', image_url);
        image_element.setAttribute('draggable', 'true');
        image_element.setAttribute('ondragstart', 'drag(event)');
        image_element.setAttribute('data-meal-id', meal_id);
        image_element.onclick = (function (a_meal_id) { return function () { onclick_calendar_meal(a_meal_id); } })(meal_id);

        calendar_day_element.appendChild(image_element);
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
// Add a new meal to the meal plan for the current month
function add_new_meal_to_current_month_meal_plan(day, meal_id)
{
    var new_meal = {
        "day": day,
        "meal": {
            "id": '',
            "name": '',
            "image_url": '',
            "ingredients": [],
            "recipe": ''
        }
    };

    // Copy the meal info from meals into the new_meal
    for (var i = 0; i < meals.length; i++) {
        if (meals[i].id == meal_id)
        {
            // Find out the latest_meal_id in the current_calendar_month_meal_plan's meal_plan
            var latest_meal_id;
            if (current_calendar_month_meal_plan.meal_plan.length == 0)
                latest_meal_id = 0;
            else
                latest_meal_id = parseInt(current_calendar_month_meal_plan.meal_plan[current_calendar_month_meal_plan.meal_plan.length - 1].meal.id)

            // Set the data for the new_meal you'll be adding
            new_meal.meal.id = (latest_meal_id + 1).toString();
            new_meal.meal.name = meals[i].name;
            new_meal.meal.image_url = meals[i].image_url;
            for (var j = 0; j < meals[i].ingredients.length; j++) {
                new_meal.meal.ingredients.push(meals[i].ingredients[j]);
            }
            new_meal.meal.recipe = meals[i].recipe;
            break;
        }
    }

    // Add the new_meal to the current_calendar_month_meal_plan
    current_calendar_month_meal_plan.meal_plan.push(new_meal);
    update_meal_plan_data();
}

/**
* FUNCTION_NAME
* Update the user's meal plan's with the updated current month's meal plan
* @param
* @return
*/
function update_meal_plan_data()
{
    // Loop through the existing plans
    for (var i = 0; i < monthly_meal_plan_data.meal_plans.length; i++) {
        if (monthly_meal_plan_data.meal_plans[i].formatted_date == current_calendar_month_meal_plan.formatted_date) {
            monthly_meal_plan_data.meal_plans[i] = current_calendar_month_meal_plan;
            return;
        }
    }

    // If we've made it this far, then an existing meal plan was not found so add it as a new plan at the back
    var back_index = monthly_meal_plan_data.meal_plans.length;
    monthly_meal_plan_data.meal_plans.push(current_calendar_month_meal_plan);
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
// Update the calendar day for a meal in the meal plan (If the user moved a meal from one day to another)
function update_day(target_day, meal_id)
{
    for (var i = 0; i < current_calendar_month_meal_plan.meal_plan.length; i++)
    {
        if (current_calendar_month_meal_plan.meal_plan[i].meal.id == meal_id)
        {
            current_calendar_month_meal_plan.meal_plan[i].day = target_day;
        }
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
document.drag = function (ev)
{
    ev.dataTransfer.setData("text", ev.target.id);
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
document.allow_drop = function (ev)
{
    ev.preventDefault();
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
document.drop = function (ev)
{
    ev.preventDefault();
    var data = ev.dataTransfer.getData("text"); 
    var parent_element = document.getElementById(data).parentElement;
        
    // If the parent element is a meal list item, copy the data over...
    if (parent_element.className.includes("flex-meal-item"))
    {
        var node_copy = document.getElementById(data).cloneNode(true);
        var new_id = data + "_calendar";
        var element_count = $('[id^=' + new_id + ']').length;
        new_id += (element_count + 1).toString();
        node_copy.id = new_id;
        ev.target.appendChild(node_copy);

        // Create a new meal with the meal info from meals matching meal_id to add to the meal plan
        var day = ev.target.getAttribute("data-day");
        var meal_id = document.getElementById(data).getAttribute("data-meal-id");
        add_new_meal_to_current_month_meal_plan(day, meal_id);
        meal_id = current_calendar_month_meal_plan.meal_plan[current_calendar_month_meal_plan.meal_plan.length - 1].meal.id;
        var element = document.getElementById(new_id);
        element.onclick = (function (a_meal_id) { return function () { onclick_calendar_meal(a_meal_id); } })(meal_id);
        element.setAttribute("data-meal-id", meal_id);
    }
    else // ... Else, the data should be transfered/moved
    {
        // Copy the image over with onclick functionality
        var element = document.getElementById(data);
        var target_parent = ev.target.parentElement;
        var target_day = target_parent.getAttribute("data-day");
        var image_url = element.getAttribute("src");
        var source_day = document.getElementById(data).parentElement.getAttribute("data-day"); // Get a copy of the source parent's data-day attribtute

        // Check if the user is overwriting a day by copying over...
        var is_day_already_filled = false;
        var index_of_meal_to_replace;
        for (var i = 0; i < current_calendar_month_meal_plan.meal_plan.length; i++)
        {
            if (current_calendar_month_meal_plan.meal_plan[i].day == target_day)
            {
                is_day_already_filled = true;
                index_of_meal_to_replace = i;
            }
        }

        if (is_day_already_filled)
        {
            if (window.confirm("Are you sure you want to replace this meal?"))
            {
                ev.target.appendChild(element);
                var meal_id = element.getAttribute("data-meal-id");
                ev.target.setAttribute("src", image_url);
                element.onclick = (function (a_meal_id) { return function () { onclick_calendar_meal(a_meal_id); } })(meal_id);
                current_calendar_month_meal_plan.meal_plan.splice(index_of_meal_to_replace, 1);
                update_day(target_day, meal_id);
            }
        }
        else
        {
            ev.target.appendChild(element);
            var meal_id = element.getAttribute("data-meal-id");
            element.onclick = (function (a_meal_id) { return function () { onclick_calendar_meal(a_meal_id); } })(meal_id);
            target_day = document.getElementById(data).parentElement.getAttribute("data-day");
            update_day(target_day, meal_id);
        }
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
document.drop_to_garbage = function (ev)
{
    ev.preventDefault();

    var data = ev.dataTransfer.getData("text");
    var element = document.getElementById(data);
    var meal_id = element.getAttribute("data-meal-id");

    // Set up where you get the meals from
    var meals = meals;

    if (window.confirm("Are you sure you want to delete this meal forever?"))
    {
        for (var i = 0; i < meals.length; i++)
        {
            if (meals[i].id == meal_id)
            {
                meals.splice(i, 1);
            }
        }
        populate_meal_list();
        setup_meal_onclick_function();
    }
}
    
/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
document.drop_to_calendar_garbage = function (ev)
{
    ev.preventDefault();

    var data = ev.dataTransfer.getData("text");
    var element = document.getElementById(data);
    var meal_id = element.getAttribute("data-meal-id");

    var meals = meals;

    if (window.confirm("Are you sure you want to delete this meal from your meal plan?")) 
    {
        for (var i = 0; i < current_calendar_month_meal_plan.meal_plan.length; i++) 
        {
            if (current_calendar_month_meal_plan.meal_plan[i].meal.id == meal_id) 
            {
                current_calendar_month_meal_plan.meal_plan.splice(i, 1);
            }
        }
        populate_calendar_days();
        update_meal_plan_data();
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function populate_meal_list()
{
    for (var i = 0; i < meals.length; i++)
    {
        var id = meals[i].id;
        var image_url = meals[i].image_url;
        var meal_list_item_element = document.createElement("li");
        var meal_name_element = document.createElement("div");
        var image_element = document.createElement("img");

        // Set up the meal image element
        image_element.id = "drag_" + id;
        image_element.src = image_url;
        image_element.draggable = true;
        image_element.setAttribute('ondragstart', 'drag(event)');
        image_element.setAttribute("data-meal-id", id);

        // Set up the meal name div element
        meal_name_element.classList.add("meal_name");
        meal_name_element.innerHTML = meals[i].name;
        
        // Setup the meal list item element
        meal_list_item_element.id = "meal_list_item_" + id;
        meal_list_item_element.classList.add("flex-meal-item");

        // Insert the image and name into the meal list item
        meal_list_item_element.appendChild(image_element);
        meal_list_item_element.appendChild(meal_name_element);

        document.getElementById('meal_unordered_list').appendChild(meal_list_item_element);
    }

    // Setup onclick functions
    setup_meal_onclick_function();
    setup_add_meal_onclick_function();
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function setup_meal_onclick_function()
{
    for (var i = 0; i < meals.length; i++)
    {
        document.getElementById('drag_' + meals[i].id).onclick = (function (current_i) { return function () { onclick_meal(current_i); } })(meals[i].id);
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function setup_add_meal_onclick_function()
{
    document.getElementById('add_button').onclick = (function (meal_id) { return function () { on_add_meal_buton_click(meal_id); } })(current_meal.id);
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function setup_ingredient_onclick_function()
{
    for (var i = 0; i < current_meal.ingredients.length; i++)
    {
        document.getElementById('button_' + i).onclick = (function (current_i) { return function () { remove_ingredient(current_i); } })(i);
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function setup_add_ingredient_button_onclick_function()
{
    document.getElementById('ingredient_add_button').onclick = (function (current_i) { return function () { add_ingredient_button_onclick(current_i); } })(1);
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function setup_input_onkeypress_function()
{
    document.getElementById('meal_name_input').onkeypress = (function (nothing) { return function () { on_meal_name_input_key_press(nothing); } })(0);
    document.getElementById('meal_name_input').onkeydown = (function (ev) { return function () { on_meal_name_input_key_press(nothing); } })(0);
    document.getElementById('recipe_text_area').onkeypress = (function (nothing) { return function () { on_meal_intstructions_input_key_press(nothing); } })(0);
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function setup_edit_button_onclick_function()
{
    document.getElementById('edit_button').onclick = (function (meal_id) { return function () { edit_button_onclick(meal_id); } })(current_meal.id);
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function setup_cancel_button_onclick_function()
{
    document.getElementById('cancel_button').onclick = (function (meal_id) { return function () { cancel_button_onclick(meal_id); } })(current_meal.id);
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function setup_calendar_help_button_onclick_function()
{
    document.getElementById('help_button').onclick = (function (a_nothing) { return function () { calendar_help_button_onclick(a_nothing); } })(false);
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function setup_calendar_print_button_onclick_function()
{
    document.getElementById('print_button').onclick = (function (a_nothing) { return function () { calendar_print_button_onclick(a_nothing); } })(false);
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function setup_calendar_grocery_list_button_onclick_function()
{
    document.getElementById('grocery_list_button').onclick = (function (a_nothing) { return function () { calendar_grocery_list_button_onclick(a_nothing); } })(false);
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function setup_calendar_save_button_onclick_function()
{
    document.getElementById('save_button').onclick = (function (a_nothing) { return function () { calendar_save_button_onclick(a_nothing); } })(false);
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function onclick_meal(meal_id)
{
    if (!is_edit_mode)
    {
        set_current_meal(meal_id);
        set_meal_editor_data();
        highlight_current_meal(meal_id);
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function onclick_calendar_meal(meal_id) {
    if (!is_edit_mode)
    {
        set_current_meal_with_calendar_meal(meal_id);
        set_meal_editor_data();
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function on_meal_name_input_key_press(nothing)
{
    current_meal.name = document.getElementById('meal_name_input').value;
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function on_meal_intstructions_input_key_press(nothing)
{
    current_meal.recipe = document.getElementById('recipe_text_area').value;
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function on_add_meal_buton_click(meal_id)
{
    if (!is_edit_mode && !is_adding_new_meal)
    {
        is_adding_new_meal = true;
        is_edit_mode = true;
        set_current_meal(meal_id);
        var latest_meal_id = (parseInt(meals[meals.length - 1].id) + 1);
        var new_meal = { "id": "", "name": "", "image_url": "", "ingredients": [], "recipe": "" };
        new_meal.id = latest_meal_id.toString();
        new_meal.image_url = "images\\default_image.jpg"

        current_meal = new_meal;
        meals.push(current_meal);
        set_meal_editor_data();
        document.getElementById('meal_name_input').focus();

        setup_input_onkeypress_function();
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function add_ingredient_button_onclick(ingredient_index)
{
    if (is_edit_mode && !document.getElementById('meal_ingredient_input').value == '')
    {
        var ingredient = document.getElementById('meal_ingredient_input').value;
        current_meal.ingredients.push(ingredient);
        document.getElementById('meal_ingredient_input').value = '';
        set_meal_editor_data();
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function edit_button_onclick(meal_id)
{
    if (is_edit_mode)
    {
        // Save changes to meal name and instructions
        current_meal.name = document.getElementById('meal_name_input').value;
        current_meal.recipe = document.getElementById('recipe_text_area').value;

        if (is_adding_new_meal)
        {
            is_adding_new_meal = false;
        }
        populate_meal_list();
    }
    else
    {
        is_need_to_auto_save = true;
    }

    is_edit_mode = !is_edit_mode;
    set_meal_editor_data();
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function cancel_button_onclick(meal_id)
{
    if (is_edit_mode) {
        // Take everything out of edit mode / adding mode
        is_edit_mode = false;

        // Check if adding...
        if (is_adding_new_meal)
        {
            is_adding_new_meal = false;
            // Remove current meal from meals
            for (var i = 0; i < meals.length; i++)
            {
                if (meals[i].id == meal_id) {
                    meals.splice(i, 1);
                }
            }

            // set current meal back to previous meal
            current_meal = previous_meal;
        }
        else {
            // Replace the values of the current meal
            current_meal.name = auto_saved_meal.name;
            current_meal.recipe = auto_saved_meal.recipe;
            // Clear out current meal recipes then add them back from  auto save
            current_meal.ingredients.length = 0;
            for (var i = 0; i < auto_saved_meal.ingredients.length; i++)
            {
                current_meal.ingredients.push(auto_saved_meal.ingredients[i]);
            }
        }

        set_meal_editor_data();
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function calendar_help_button_onclick(a_nothing)
{
    document.getElementById("welcome_modal_title").innerHTML = "Help";
    display_modal();
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function calendar_print_button_onclick(a_nothing)
{
    alert("Printing coming soon.")
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function calendar_grocery_list_button_onclick(a_nothing)
{
    alert("Grocery list coming soon.")
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function calendar_save_button_onclick(a_nothing)
{
    save_meal_plan();
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function set_current_meal(meal_id)
{
    previous_meal = current_meal;
    for (var i = 0; i < meals.length; i++)
    {
        if (meals[i].id == meal_id)
            current_meal = meals[i];
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function set_current_meal_with_calendar_meal(meal_id)
{
    previous_meal = current_meal;
    for (var i = 0; i < current_calendar_month_meal_plan.meal_plan.length; i++)
    {
        if (current_calendar_month_meal_plan.meal_plan[i].meal.id == meal_id)
            current_meal = current_calendar_month_meal_plan.meal_plan[i].meal;
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function set_meal_editor_data()
{
    // Set the meal name input field and instructions text area
    var meal_instructions_text_area = document.getElementById('recipe_text_area');
    meal_instructions_text_area.value = current_meal.recipe;
    var meal_name_iput = document.getElementById('meal_name_input');
    meal_name_iput.value = current_meal.name;

    // Handle Edit Mode
    if (is_edit_mode)
    {
        meal_name_iput.readOnly = false;
        meal_instructions_text_area.readOnly = false;
        document.getElementById('meal_ingredient_input').value = '';

        document.getElementById('edit_button').src = "images\\controls\\check.png";
        document.getElementById('edit_button').parentElement.style.backgroundColor = "#00e364";
        document.getElementById('cancel_button').parentElement.style.visibility = "visible";
        document.getElementById('meal_ingredient_input').parentElement.style.visibility = "visible";
        document.getElementById('ingredient_add_button').parentElement.style.visibility = "visible";

        if (is_need_to_auto_save)
        {
            // Auto save the meal data in the auto_Saved_meal
            is_need_to_auto_save = false;
            auto_saved_meal.name = current_meal.name;
            auto_saved_meal.recipe = current_meal.recipe;
            // Clear the auto save ingredients just in case, then set them to the current meal's ingredients
            auto_saved_meal.ingredients.length = 0;
            for (var i = 0; i < current_meal.ingredients.length; i++)
            {
                auto_saved_meal.ingredients.push(current_meal.ingredients[i]);
            }
        }
    }
    else
    {
        meal_name_iput.readOnly = true;
        meal_instructions_text_area.readOnly = true;
        document.getElementById('edit_button').src = "images\\controls\\pen.png";
        document.getElementById('edit_button').parentElement.style.backgroundColor = "#33afff";
        document.getElementById('cancel_button').parentElement.style.visibility = "hidden";
        document.getElementById('meal_ingredient_input').parentElement.style.visibility = "hidden";
        document.getElementById('ingredient_add_button').parentElement.style.visibility = "hidden";
    }


    // Set the meal ingredients list
    var ingredients = '';
    for (var i = 0; i < current_meal.ingredients.length; i++)
    {
        var x = ''
        if (is_edit_mode)
            x = 'x';
        ingredients += '<li class="flex-ingredient-item"><div class="ingredient" id="ingredient_' + i + '">' + current_meal.ingredients[i] + '</div><div class="remove_ingredient_button" id="button_' + i + '">' + x + '</div></li>';
    }
    document.getElementById('ingredients_unordered_list').innerHTML = ingredients;

    // Setup the onclick functionality
    setup_ingredient_onclick_function();
    setup_edit_button_onclick_function();
    setup_cancel_button_onclick_function();
    setup_add_ingredient_button_onclick_function();
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function highlight_current_meal(meal_id)
{
    // Remove the highlight on the last selected meal
    var element_id = "meal_list_item_" + (previous_meal.id);
    var meal_list_element = document.getElementById(element_id);
    meal_list_element.style.border = "0px solid #33afff";

    // Add the highlight on the meal with meal_id
    element_id = "meal_list_item_" + (meal_id);
    meal_list_element = document.getElementById(element_id);
    meal_list_element.style.border = "3px solid #33afff";
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function remove_ingredient(ingredient_index)
{
    if (is_edit_mode)
    {
        current_meal.ingredients.splice(ingredient_index, 1);
        set_meal_editor_data();
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function save_meal_plan()
{
    try
    {
        localStorage.user_meal_plan_data = JSON.stringify(monthly_meal_plan_data);
    }
    catch (exception)
    {
        alert("We are unable to save your meal plan. We apologize for any inconvenience.")
    }

    if (localStorage.user_meal_plan_data != null)
    {
        alert("Your meal plan has been saved.")
    }
}