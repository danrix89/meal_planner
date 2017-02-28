
/*****************************************************/
/***** Global Constants ******************************/
/*****************************************************/

// API for getting an example meal plan (testing purposes)
const example_meal_plan_json_api = "https://api.myjson.com/bins/156vi5";

// API for getting default meals for the user's meal list
const default_meals_json_api = "https://api.myjson.com/bins/skhh9";

// Firebase API URL used for calls the that API
const firebase_api = "https://www.gstatic.com/firebasejs/3.6.6/firebase.js";

// Constant for the Firebase configuration
const firebase_configuration = {
    apiKey: "AIzaSyBigHw-J3ndPKHwWc4UEIpK1VF89VJJWF8",
    authDomain: "my-mealplanner.firebaseapp.com",
    databaseURL: "https://my-mealplanner.firebaseio.com",
    storageBucket: "my-mealplanner.appspot.com",
    messagingSenderId: "470333058555"
};

// An array of the month names
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


/*****************************************************/
/***** Global Variables ******************************/
/*****************************************************/

// Today's full date
var todays_date = new Date();

// The current or most recently chosen date on the calendar (defaulted intially to today's date)
var calendar_date = todays_date;

// Global flag to know if the user is currently editing a meal (edit mode)
var is_edit_mode = false;

// Global flag to know if the user is currently adding a new meal
var is_adding_new_meal = false;

// Used for knowing what the previous selected meal was in case we need to unselect it when we select a new one, etc.
var previous_meal = { "id": "", "name": "", "image_url": "", "ingredients": [], "recipe": "" };

// The currently selected and updated meal
var current_meal = { "id": "", "name": "", "image_url": "", "ingredients": [], "recipe": "" };

// Used to record a meals data before and edit, so in case the user cancels the edit, the meal can be put back to the way it was before the edit
var meal_before_edit = { "id": "", "name": "", "image_url": "", "ingredients": [], "recipe": "" };

// The array of every months meal plan
var meal_plans = { "meal_plans": [] };

// The meal plan for the month the users is currently viewing
var current_calendar_month_meal_plan = { "formatted_date": "", "meal_plan": [] };

// The list/array of user meals
var meals = [];

// The current user (if "null" then no one is logged in)
var user = {};

// A reference to Firebase
var firebase_ref = {};

// A reference to the firebase database
var firebase_database = {};

// A reference to the firsebase authentication
var firebase_authentication = {};

// A reference to the firsebase authentication
var firebase_storage = {};

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

    // Initialize firebase
    $.getScript(firebase_api, initialize_firebase);
};

/**
* INITIALIZE_FIREBASE
* Initializes the firebase_ref global variable and other firebase global reference
* variables to be used in the app, using the Firebase javascript file.
*/
function initialize_firebase() {
    // Initialize Firebase

    firebase.initializeApp(firebase_configuration);
    firebase_ref = firebase;
    firebase_database = firebase.database();
    firebase_authentication = firebase.auth();
    firebase_storage = firebase.storage();
    console.log("Firebase Initialized");

    // Setup authentiation state change action
    firebase_authentication.onAuthStateChanged(on_authentication_state_changed);

    // Setup sign-in Page
    setup_sign_in_controls();
}

/**
* ON_AUTHENTICATION_STATE_CHANGED
* Handles what happens when a user logs in and out of the app.
* @param = firebase_user which is either null (meaning no one is logged in) or
*          has a user with credentials embedded in the object
*/
function on_authentication_state_changed(firebase_user) {
    if (firebase_user) {
        // Set the user
        user = firebase_user;
        console.log("User '" + user.uid + "' is logged in.");

        // Populate the calendar, meal list, etc.
        initialize_meal_planner_app();

        // Go to the app (hide the sign in controls)
        document.getElementById("sign_in_page").setAttribute("class", "hide");
        document.getElementById("main_box").classList.remove("hide");
    } else {
        // Set user to null
        user = null;
        console.log("No user is logged in!");

        // Return to the sign in page (hiding the app controls)
        document.getElementById("sign_in_page").setAttribute("class", "sign_in_page");
        document.getElementById("main_box").classList.add("hide");
    }
}

/**
* SETUP_SIGN_IN_CONTROLS
* Sets up the sign-in option buttons with click actions.
*/
function setup_sign_in_controls() {

    var btnCreateAccount = document.getElementById("btnCreateAccount");
    btnCreateAccount.setAttribute("onclick", "create_new_account()");

    var btnLogin = document.getElementById("btnLogin");
    btnLogin.setAttribute("onclick", "log_in()");

    var btnGoogle = document.getElementById("btnGoogle");
    btnGoogle.setAttribute("onClick", "log_in_with_google()");

    var btnFacebook = document.getElementById("btnFacebook");
    btnFacebook.setAttribute("onClick", "log_in_with_facebook()");

    var linkCreateAccount = document.getElementById("linkCreateAccount");
    linkCreateAccount.addEventListener("click", toggle_create_account_view);
}

/**
* SET_IMAGE_SRC
* Sets the image url source on an HTML image (img) element.
* @param = image_ref is the reference object to the image in the firebase storage.
* @param = image_element is the HTML image element that will have its source
*          set.
*/
function set_image_src(image_ref, image_element) {
    image_ref.getDownloadURL()
        .then( function(url) {
            image_element.src = url;
        })
        .catch( function (error) {
            console.log(error.message);
        })
}

/**
* TOGGLE_CREATE_ACCOUNT_VIEW
* Toggles between showing the controls to create a new user account or the
* regular login controls for existing users.
*/
function toggle_create_account_view() {
    var btnCreateAccount = document.getElementById("btnCreateAccount");
    var linkCreateAccount = document.getElementById("linkCreateAccount");
    var btnLogin = document.getElementById("btnLogin");
    var sign_in_provider_title_container = document.getElementById("sign_in_provider_title_container");
    var sign_in_provider_button_container = document.getElementById("sign_in_provider_button_container");

    if (btnLogin.classList.contains("hide")) {
        btnLogin.classList.remove("hide");
    } else {
        btnLogin.classList.add("hide");
    }

    if (btnCreateAccount.classList.contains("hide")) {
        btnCreateAccount.classList.remove("hide");
        linkCreateAccount.innerHTML = "Back to Log In";
    } else {
        btnCreateAccount.classList.add("hide");
        linkCreateAccount.innerHTML = "Create Account";
    }
}

/**
* CREATE_NEW_ACCOUNT
* Creates a new user account using the values in the email and password fields.
*/
function create_new_account() {
    // Get the data from the fields
    var txtEmail = document.getElementById("txtEmail");
    var txtPassword = document.getElementById("txtPassword");

    if (txtPassword.value.length >= 6) {
        const promise = firebase_authentication.createUserWithEmailAndPassword(txtEmail.value, txtPassword.value);

        promise
            .then(function(firebase_user) {
                // Create the user in the database
                firebase_database.ref().child('Users').child(firebase_user.uid).set({ display_name: firebase_user.displayName, email: firebase_user.email });

                // Set the user's meals in the database as the default meals
                firebase_database.ref("DefaultMeals").on("value", function(db_snapshot) {
                    var default_meals = db_snapshot.val();
                    var db_users_meals_ref = firebase_database.ref().child('Users_Meals/' + firebase_user.uid);

                    // Loop through each of the default meals (by id)
                    for (var default_meal_id in default_meals) {
                        // Ensure the id is valid
                        if (default_meals.hasOwnProperty(default_meal_id)) {
                            // Create a new user meal
                            var new_users_meals_record_ref = db_users_meals_ref.push();

                            // Set the new user meal to the default one
                            new_users_meals_record_ref.set(default_meals[default_meal_id]);
                        }
                    }
                });
            })
            .catch (function(event) {alert(event.message);
        });
    } else {
        txtPassword.focus();
        alert("Passwords must be 6 or more characters");
    }
}

/**
* LOG_IN
* Logs an existing user in using an email and password. Also, validates the
* password length.
*/
function log_in() {
    // Get the data from the fields
    var txtEmail = document.getElementById("txtEmail");
    var txtPassword = document.getElementById("txtPassword");

    if (txtPassword.value.length >= 6) {
        const promise = firebase_authentication.signInWithEmailAndPassword(txtEmail.value, txtPassword.value);

        promise
            .catch (function(event) {alert(event.message);
        });
    } else {
        txtPassword.focus();
        alert("Passwords must be 6 or more characters");
    }
}

/**
* LOG_IN_WITH_GOOGLE
* logs the user in using the google provider.
*/
function log_in_with_google() {
    var provider = new firebase_ref.auth.GoogleAuthProvider();
    log_in_with_provider(provider);
}

/**
* LOG_IN_WITH_FACEBOOK
* logs the user in using the google provider.
*/
function log_in_with_facebook() {
    var provider = new firebase_ref.auth.FacebookAuthProvider();
    log_in_with_provider(provider);
}

/**
* LOG_IN_WITH_PROVIDER
* logs the user in using some provider.
*/
function log_in_with_provider(provider) {
    firebase_authentication.signInWithPopup(provider).catch(function(error) {console.log(error.message);} );
}

/**
* INITIALIZE_MEAL_PLANNER_APP
* Initializes the app (after a successful log in) with controls, fields, data, etc.
*/
function initialize_meal_planner_app() {

    // Set the user's meals from the database.
    firebase_database.ref("Users_Meals/" + user.uid).on("value", initialize_user_meals_from_db_snapshot);

    // Setup the calendar title and nav buttons
    setup_calendar_title_and_nav_buttons();

    // Setup the current session's meal plans with user data
    setup_initial_meal_plans();

    // Setup button on click event functions
    document.getElementById('log_out_button').onclick = logout;
}

/**
* INITIALIZE_USER_MEALS_FROM_DB_SNAPSHOT
* Get the user's meals from storage (not the meal plans but their list of meals)
*/
function initialize_user_meals_from_db_snapshot(db_snapshot) {
    var user_meals_from_db = db_snapshot.val();
    set_meals(user_meals_from_db);

    // Set the initial current/previous meals to the first meal when loading the page.
    previous_meal = meals[0];
    set_current_meal(meals[0].id);

    // Populate the app interface with data
    populate_meal_list();
    populate_meal_editor(current_meal);
    populate_calendar_days();
}

function set_meals(user_meals_from_db) {

    // Loop through each of the meals (by id)
    for (var meal_id in user_meals_from_db) {

        // Ensure the id is valid
        if (user_meals_from_db.hasOwnProperty(meal_id)) {
            // Create a meal object and set the id, name, image_url, ingredients
            // etc.
            var meal = {}
            meal.id = meal_id;
            meal.name = user_meals_from_db[meal_id].name;
            meal.image_url = user_meals_from_db[meal_id].image_path;
            meal.image_source_url = "";
            meal.recipe = user_meals_from_db[meal_id].recipe;
            meal.ingredients = [];
            var i = 0;
            for (ingredient in user_meals_from_db[meal_id].ingredients) {
                meal.ingredients[i] = ingredient;
                i++;
            }

            // Add the meal to the meals in memory
            meals.push(meal);
        }
    }
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
* SETUP_INITIAL_MONTHLY_MEAL_PLAN_DATA
* Does the initial set up of what the user's meal plans are
* to later be displayed.
*/
function setup_initial_meal_plans() {
    // Get all the user's saved meal plans from storage
    var previously_saved_meal_plan_data = localStorage.user_meal_plan_data;

    // If the user has meal plan data
    if (previously_saved_meal_plan_data != null) {
        // Set the meal plan data object
        meal_plans = JSON.parse(previously_saved_meal_plan_data);

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
    for (var i = 0; i < meal_plans.meal_plans.length; i++) {
        if (meal_plans.meal_plans[i].formatted_date == formatted_date(calendar_date)) {
            current_calendar_month_meal_plan = meal_plans.meal_plans[i];
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
* GOT_IT_BUTTON_ONCLICK
* Onclick action for the "Got it" (or OK) button in the modal dialog
*
* @param a_nothing (ignore this)
*/
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
* ADVANCE_MONTH
* Advances the calendar to a different month based on a_value and then repopulates the calendar
* @param a_value is used to either increment or decrement the months
*/
//
function advance_month(a_value) {
    // Increment/Decrement the month
    calendar_date.setMonth(calendar_date.getMonth() + a_value)

    // Format the new date to only have the month name and year (e.g. January 2017)
    var current_calendar_date = formatted_date(calendar_date);

    // Display the formatted date on the calendar title
    document.getElementById("month_title").innerHTML = current_calendar_date;

    // Check if a meal plan for this month already exists and set the current_calendar_month_meal_plan to that
    var already_has_meal_plan = false;
    for (var i = 0; i < meal_plans.meal_plans.length; i++) {
        if (meal_plans.meal_plans[i].formatted_date == current_calendar_date) {
            current_calendar_month_meal_plan = meal_plans.meal_plans[i];
            already_has_meal_plan = true;
            break;
        }
    }

    // If no meal plan exists create a new one and push it to the meal_plans
    if (!already_has_meal_plan) {
        var new_month_meal_plan = { "formatted_date": "", "meal_plan": [] };
        new_month_meal_plan.formatted_date = current_calendar_date;
        new_month_meal_plan.meal_plan = [];
        meal_plans.meal_plans.push(new_month_meal_plan);
        current_calendar_month_meal_plan = new_month_meal_plan;
    }

    // Repopulate the calander
    populate_calendar_days();
}

/**
* FORMATTED_DATE
* Returns a formatted date (e.g. "September 2016")
* @param a_date is the date to be formated
* @return the formated date
*/
function formatted_date(a_date) {
    var date = new Date();
    date = a_date;
    return months[date.getMonth()] + ' ' + date.getFullYear();
}

/**
* POPULATE_CALENDAR_DAYS
* Populates the calendar with squares (days) and the populates it with meal plan data
*/
function populate_calendar_days() {
    // Clear the calendar (if not empty)
    var calendar_element = document.getElementById('calendar');
    calendar_element.innerHTML = "";

    // Setup number of days, day index, calendar square count, etc.
    var number_of_days = days_in_month(calendar_date.getMonth(), calendar_date.getFullYear());

    // Used for keeping track of the days in the month
    var day = 1;

    // What day of the week does the first day land on?
    var first_day = first_day_of_month(calendar_date.getFullYear(), calendar_date.getMonth()).getDay();

    // Determine the number of weeks (rows) in the calendar
    var row_count = (((first_day == 5 || first_day == 6) && (number_of_days == 31)) || ((first_day == 6) && (number_of_days >= 30)) ? 6 : 5);

    // The calendar square index (which square is it currently on?)
    var calendar_square_index = 0;

    // Dynamically build the squares/days
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
                calendar_day_data_div_element.setAttribute("ondrop", "drop_meal(event)");
                calendar_day_data_div_element.setAttribute("ondragover", "allow_meal_drop(event)")
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
* FIRST_DAY_OF_MONTH
* Return the first day of the week for a given month (e.g. Monday = August 1, 2016).
* @param year of the month (critical to know which day of the week)
* @return
*/
function first_day_of_month(year, month) {
    return new Date(year, month, 1);
}

/**
* DAYS_IN_MONTH
* Returns the number of days in a given month for a particular year.
* @param month you want the number of days for
* @param year that the month is in (so you can account for leap years)
* @return the number of days in the month (e.g. Feb 2016 = 29 days OR Feb 2017 = 28 days)
*/
function days_in_month(month, year) {
    return new Date(year, month + 1, 0).getDate();
}

/**
* POPULATE_CALENDAR_WITH_MEAL_PLAN
* Populate the current month with the meals the that month's meal plans (if any)
*/
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
        image_element.setAttribute('ondragstart', 'drag_meal(event)');
        image_element.setAttribute('data-meal-id', meal_id);
        image_element.onclick = (function (a_meal_id) { return function () { select_meal_in_calendar(a_meal_id); } })(meal_id);

        calendar_day_element.appendChild(image_element);
    }
}

/**
* ADD_NEW_MEAL_TO_CURRENT_MONTH_MEAL_PLAN
* Add a new meal to the meal plan for the current month
* @param day on the calendar that the meal is being planned for
* @param meal_id from the meal in the users meal list
*/
function add_new_meal_to_current_month_meal_plan(day, meal_id)
{
    // A variable to store the meal from the user's
    // meal list that matches the meal_id parameter
    var matched_meal;

    // A flag to know if a matching meal was found
    var is_meal_found = false;

    // Find the meal from the users meal list using the meal_id parameter
    for (var i = 0; i < meals.length; i++) {
        // Copy the meal info from meals into the new_meal object
        if (meals[i].id == meal_id)
        {
            matched_meal = meals[i];
            is_meal_found = true;
            break;
        }
    }

    // Check if the meal was found and then
    // copy the data from the matched_meal to the new_meal
    if (is_meal_found)
    {
        // Variable the represents the new meal object to be added to the calendar
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

        // Find out the latest_meal_id in the current_calendar_month_meal_plan's meal_plan (default to zero)
        // then set the ID of the new_meal
        var latest_meal_id = 0;
        if (current_calendar_month_meal_plan.meal_plan.length > 0)
            latest_meal_id = parseInt(current_calendar_month_meal_plan.meal_plan[current_calendar_month_meal_plan.meal_plan.length - 1].meal.id)
        new_meal.meal.id = (latest_meal_id + 1).toString();

        // Copy over the name
        new_meal.meal.name = matched_meal.name;

        // Copy of the image url
        new_meal.meal.image_url = matched_meal.image_url;

        // Copy over all the ingredients
        for (var j = 0; j < matched_meal.ingredients.length; j++) {
            new_meal.meal.ingredients.push(matched_meal.ingredients[j]);
        }

        // Copy of the recipe instructions
        new_meal.meal.recipe = matched_meal.recipe;

        // Add the new_meal to the current_calendar_month_meal_plan
        current_calendar_month_meal_plan.meal_plan.push(new_meal);

        // Update the meal plan
        update_meal_plan(current_calendar_month_meal_plan);
    }
}

/**
* UPDATE_MEAL_PLAN
* Update the user's meal plan's with the updated current month's meal plan
*/
function update_meal_plan(meal_plan)
{
    // Check if the meal_plan already exists in the list of meal_plans
    for (var i = 0; i < meal_plans.meal_plans.length; i++) {
        // If so, overwrite that meal plan with the new meal_plan (parameter)
        if (meal_plans.meal_plans[i].formatted_date == meal_plan.formatted_date) {
            meal_plans.meal_plans[i] = meal_plan;
            return;
        }
    }

    // If we've made it this far, then an existing meal plan was not found so add it as a new plan at the back
    var back_index = meal_plans.meal_plans.length;
    meal_plans.meal_plans.push(meal_plan);
}

/**
* update_day
* Update a meal's day in a meal plan (e.g. If the user moved a meal from one day to another)
* @param meal_plan that is being updated
* @param target_day is the new day that the meal will be moving to
* @param meal_id used to know if the meal exists in the meal plan
*/
function update_day(meal_plan, target_day, meal_id)
{
    // Find the meal in the meal plan using the meal_id and meal_plan parameters
    for (var i = 0; i < meal_plan.meal_plan.length; i++)
    {
        // If found update the day to the target day parameter
        if (meal_plan.meal_plan[i].meal.id == meal_id)
        {
            meal_plan.meal_plan[i].day = target_day;
        }
    }
}

/**
* DRAG_MEAL
* Begin dragging a meal.
* @param event of the meal image being dragged
*/
function drag_meal(event) {
    event.dataTransfer.setData("text", event.target.id);
}

/**
* ALLOW_MEAL_DROP
* Allows the meal image to be dropped over other HTML elements
* @param event of the meal image being dropped
*/
function allow_meal_drop(event) {
    // By default, data/elements cannot be dropped in other elements.
    // To allow a drop, we must prevent the default handling of the element.
    // This is done by calling the event.preventDefault() method for the ondragover event
    event.preventDefault();
}

/**
* DROP_MEAL
* Description
* @param
* @return
*/
function drop_meal(event) {
    // Prevent default behavior
    event.preventDefault();

    // Get the data from the dropped meal
    var data = event.dataTransfer.getData("text");

    // Find the parent element of the dropped meal (where did we drag it from?)
    var parent_element = document.getElementById(data).parentElement;

    // If the parent element is a meal list item, copy the data over...
    if (parent_element.className.includes("flex-meal-item")) {
        var node_copy = document.getElementById(data).cloneNode(true);
        var new_id = data + "_calendar";
        var element_count = $('[id^=' + new_id + ']').length;
        new_id += (element_count + 1).toString();
        node_copy.id = new_id;
        event.target.appendChild(node_copy);

        // Create a new meal with the meal info from meals matching meal_id to add to the meal plan
        var day = event.target.getAttribute("data-day");
        var meal_id = document.getElementById(data).getAttribute("data-meal-id");
        add_new_meal_to_current_month_meal_plan(day, meal_id);
        meal_id = current_calendar_month_meal_plan.meal_plan[current_calendar_month_meal_plan.meal_plan.length - 1].meal.id;
        var element = document.getElementById(new_id);
        element.onclick = (function (a_meal_id) { return function () { select_meal_in_calendar(a_meal_id); } })(meal_id);
        element.setAttribute("data-meal-id", meal_id);
    }
    else // ... Else, the data should be transfered/moved
    {
        // Copy the image over with onclick functionality
        var element = document.getElementById(data);
        var target_parent = event.target.parentElement;
        var target_day = target_parent.getAttribute("data-day");
        var image_url = element.getAttribute("src");
        var source_day = document.getElementById(data).parentElement.getAttribute("data-day"); // Get a copy of the source parent's data-day attribtute

        // Check if the user is overwriting a day by copying over...
        var is_day_already_filled = false;
        var index_of_meal_to_replace;
        for (var i = 0; i < current_calendar_month_meal_plan.meal_plan.length; i++) {
            if (current_calendar_month_meal_plan.meal_plan[i].day == target_day) {
                is_day_already_filled = true;
                index_of_meal_to_replace = i;
            }
        }

        // Handle copying the data over into the new day square on the calendar (even if it's already filled)
        if (is_day_already_filled) {
            if (window.confirm("Are you sure you want to replace this meal?")) {
                ev.target.appendChild(element);
                var meal_id = element.getAttribute("data-meal-id");
                ev.target.setAttribute("src", image_url);
                element.onclick = (function (a_meal_id) { return function () { select_meal_in_calendar(a_meal_id); } })(meal_id);
                current_calendar_month_meal_plan.meal_plan.splice(index_of_meal_to_replace, 1);
                update_day(current_calendar_month_meal_plan, target_day, meal_id);
            }
        }
        else {
            ev.target.appendChild(element);
            var meal_id = element.getAttribute("data-meal-id");
            element.onclick = (function (a_meal_id) { return function () { select_meal_in_calendar(a_meal_id); } })(meal_id);
            target_day = document.getElementById(data).parentElement.getAttribute("data-day");
            update_day(current_calendar_month_meal_plan, target_day, meal_id);
        }
    }
}



/**
* DROP_TO_MEAL_LIST_GARBAGE
* Description
* @param
* @return
*/
function drop_to_meal_list_garbage(event)
{
    event.preventDefault();

    var data = event.dataTransfer.getData("text");
    var element = document.getElementById(data);
    var meal_id = element.getAttribute("data-meal-id");

    if (window.confirm("Are you sure you want to delete this meal forever?"))
    {
        for (var i = 0; i < meals.length; i++)
        {
            if (meals[i].id == meal_id)
            {
                meals.splice(i, 1);
            }
        }

        // Repopulate the meal list
        populate_meal_list();
    }
}

/**
* DROP_TO_CALENDAR_GARBAGE
* Description
* @param
* @return
*/
function drop_to_calendar_garbage(event)
{
    event.preventDefault();

    var data = event.dataTransfer.getData("text");
    var element = document.getElementById(data);
    var meal_id = element.getAttribute("data-meal-id");

    if (window.confirm("Are you sure you want to delete this meal from your meal plan?"))
    {
        for (var i = 0; i < current_calendar_month_meal_plan.meal_plan.length; i++)
        {
            if (current_calendar_month_meal_plan.meal_plan[i].meal.id == meal_id)
            {
                current_calendar_month_meal_plan.meal_plan.splice(i, 1);
            }
        }

        // Repopulate the calendar
        populate_calendar_days();

        // Update the meal plan for that month to reflect the change
        update_meal_plan(current_calendar_month_meal_plan);
    }
}

/**
* POPULATE_MEAL_LIST
* Populates the meal list on the right hand side of the interface
*/
function populate_meal_list()
{
    // Get the meal list (container) and clear it of any items
    var meal_list_element = document.getElementById('meal_unordered_list');
    meal_list_element.innerHTML = "";

    for (var i = 0; i < meals.length; i++)
    {
        var id = meals[i].id;
        var image_url = meals[i].image_url;
        var meal_list_item_element = document.createElement("li");
        var meal_name_element = document.createElement("div");
        var image_element = document.createElement("img");

        // Set up the meal image element
        image_element.id = "drag_" + id;
        set_image_src(firebase_storage.ref().child(image_url), image_element);
        image_element.draggable = true;
        image_element.setAttribute('ondragstart', 'drag_meal(event)');
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
* SETUP_MEAL_ONCLICK_FUNCTION
* Sets up the onclick function for meals in either the meal list
*/
function setup_meal_onclick_function()
{
    for (var i = 0; i < meals.length; i++)
    {
        var id = meals[i].id
        var element = document.getElementById('drag_' + id)
        element.setAttribute("onclick","select_meal_in_meal_list('" + id + "')");
        //element.onclick = (function (current_i) { return function () { select_meal_in_meal_list(current_i); } })(meals[i].id);
    }
}

/**
* SETUP_ADD_MEAL_ONCLICK_FUNCTION
* Sets up the onclick function for when the add meal button is clicked (the "+" icon in the meal list)
*/
function setup_add_meal_onclick_function()
{
    document.getElementById('add_button').onclick = add_new_meal_to_list;
}

/**
* SETUP_INGREDIENT_ONCLICK_FUNCTION
* Sets up the onclick function for each of the ingredient buttons for the currently selected meal
* (e.g. If "Spaghetti" is selected meal the ingredients buttons: "Noodles" and "Sauce" will have the same onclick functionality)
*/
function setup_ingredient_onclick_function()
{
    for (var i = 0; i < current_meal.ingredients.length; i++)
    {
        document.getElementById('button_' + i).onclick = (function (current_i) { return function () { remove_ingredient(current_i); } })(i);
    }
}

/**
* SETUP_ADD_INGREDIENT_BUTTON_ONCLICK_FUNCTION
* Sets up the onclick function of the add ingredient button (next to the ingredient text field when in edit mode)
*/
function setup_add_ingredient_button_onclick_function()
{
    document.getElementById('ingredient_add_button').onclick = add_ingredient;
}

/**
*
*/
function setup_input_onkeypress_function()
{
    document.getElementById('meal_name_input').onkeypress = update_meal_name_with_field_value;
    document.getElementById('meal_name_input').onkeydown = update_meal_name_with_field_value;
    document.getElementById('recipe_text_area').onkeypress = update_meal_recipe_instructions_with_text_area_value;
}

/**
*
*/
function setup_edit_button_onclick_function()
{
    document.getElementById('edit_button').onclick = (function (meal_id) { return function () { edit_button_onclick(meal_id); } })(current_meal.id);
}

/**
*
*/
function setup_cancel_button_onclick_function()
{
    document.getElementById('cancel_button').onclick = (function (meal_id) { return function () { cancel_meal_edit_changes(meal_id); } })(current_meal.id);
}

/**
* SELECT_MEAL_IN_MEAL_LIST
* Select and highlight a meal in the meal list (if not in edit mode)
* and populate the editor with its data
* @param meal_id the the newly selected/clicked meal
*/
function select_meal_in_meal_list(meal_id) {
    // Only do this if not in edit mode
    if (!is_edit_mode) {
        // Chage the current meal to the newly selected/clicked meal
        set_current_meal(meal_id);

        // Populate the meal editor with the current meal
        populate_meal_editor(current_meal);

        // Highlight the selected/clicked meal
        highlight_current_meal(meal_id);
    }
}

/**
* SELECT_MEAL_IN_CALENDAR
* Select a meal in the calendar (if not in edit mode) and
* populate the editor with its data
* @param meal_id the the newly selected/clicked meal
*/
function select_meal_in_calendar(meal_id) {
    if (!is_edit_mode) {
        // Chage the current meal to the newly selected/clicked meal
        set_current_meal_with_calendar_meal(meal_id);

        // Populate the meal editor with the current meal
        populate_meal_editor(current_meal);
    }
}

/**
* UPDATE_MEAL_NAME_WITH_FIELD_VALUE
* Update the current meal's name with the text in the meal name text field.
*/
function update_meal_name_with_field_value()
{
    // Set the current meal's name to the value fo the field
    current_meal.name = document.getElementById('meal_name_input').value;
}

/**
* ON_MEAL_INTSTRUCTIONS_INPUT_KEY_PRESS
* Update the current meal's recipe instructions with the text in the
* instructions text area.
*/
function update_meal_recipe_instructions_with_text_area_value()
{
    // Set the current meal's name to the value fo the text area
    current_meal.recipe = document.getElementById('recipe_text_area').value;
}

/**
* ADD_NEW_MEAL_TO_LIST
* Actions for when the add meal button is clicked in the meal list (a.k.a. the + button)
*/
function add_new_meal_to_list()
{
    if (!is_edit_mode && !is_adding_new_meal)
    {
        is_adding_new_meal = true;
        is_edit_mode = true;
        var latest_meal_id = (parseInt(meals[meals.length - 1].id) + 1);
        var new_meal = { id: "", name: "", image_url: "", ingredients: [], recipe: "" };
        new_meal.id = latest_meal_id.toString();
        new_meal.image_url = "images\\default_image.jpg"

        // Set the previous and current meal
        previous_meal = current_meal;
        current_meal = new_meal;

        // Add the new meal to the user's list of meals
        meals.push(current_meal);

        // Populate the editor with the new meal (all fields will be blank)
        populate_meal_editor(current_meal);
        document.getElementById('meal_name_input').focus();

        setup_input_onkeypress_function();
    }
}

/**
* ADD_INGREDIENT
* Adds an ingredient to the current_meal with the value of the ingredient text field.
*/
function add_ingredient()
{
    if (is_edit_mode && !document.getElementById('meal_ingredient_input').value == '')
    {
        var ingredient = document.getElementById('meal_ingredient_input').value;
        current_meal.ingredients.push(ingredient);
        document.getElementById('meal_ingredient_input').value = '';
        populate_meal_editor(current_meal);
    }
}

/**
* EDIT_BUTTON_ONCLICK
* Actions for when the edit button is clicked (
* @param
* @return
*/
function edit_button_onclick(meal_id)
{
    // If we were in edit mode, then the user is clicking the
    // save button (which was the edit button - now it looks
    // like a checkmark), so we need to save the user's work.
    if (is_edit_mode)
    {
        // ...Save changes to meal name and instructions
        current_meal.name = document.getElementById('meal_name_input').value;
        current_meal.recipe = document.getElementById('recipe_text_area').value;

        // If we were adding then set the flag so we know
        // we aren't in adding meal mode
        if (is_adding_new_meal)
        {
            // Write user meal to database
            var db_users_meals_ref = firebase_database.ref().child('Users_Meals/' + user.uid);
            var meal_object = { name: current_meal.name, image: "someImage.png", recipe: current_meal.recipe, ingredients: {} };
            for (var i = 0; i < current_meal.ingredients.length; ++i) {
                meal_object.ingredients[current_meal.ingredients[i]] = current_meal.ingredients[i];
            }
            var new_users_meals_record_ref = db_users_meals_ref.push();
            new_users_meals_record_ref.set(meal_object);
            // var meal_id = new_users_meals_record_ref.key;

            is_adding_new_meal = false;
        }

        // Populate the meal list to reflect our changes
        populate_meal_list();
    }
    else
    {
        // Save the current meal before we edit it so we
        // can recover if the user decides to cancel their
        // changes
        meal_before_edit = current_meal;
    }

    // Toggle edit mode
    is_edit_mode = !is_edit_mode;

    // Populate the meal editor to reflect being in edit mode or not
    populate_meal_editor(current_meal);
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function cancel_meal_edit_changes(meal_id)
{
    if (is_edit_mode) {
        // Take everything out of edit mode / adding mode
        is_edit_mode = false;

        // Check if adding we were adding a new meal
        if (is_adding_new_meal)
        {
            is_adding_new_meal = false;

            // Remove current meal from meals because
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
            // We aren't adding a new meal. This means we're editing
            // the current meal, so we need to put the current meal
            // back to the way it was before we started editing.
            current_meal = meal_before_edit;
        }

        populate_meal_editor(current_meal);
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
* LOGOUT
* Logs the users out of their account
* (check the "onAuthStateChanged" function to know what happens when they
* log out).
*/
function logout()
{
    firebase_authentication.signOut();
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
    save_meal_list();

    if (localStorage.user_meal_plan_data != null) {
        alert("Your meal plan has been saved.")
    }

    if (localStorage.user_meal_list != null) {
        alert("Your meal plan has been saved.")
    }
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
* POPULATE_MEAL_EDITOR
* Populates the meal editor (the box/window at the bottom right hand side of the interface)
* @param meal used to populate the editor with it's data
*/
function populate_meal_editor(meal)
{
    // Set the meal name input field and instructions text area
    var meal_instructions_text_area = document.getElementById('recipe_text_area');
    meal_instructions_text_area.value = meal.recipe;
    var meal_name_iput = document.getElementById('meal_name_input');
    meal_name_iput.value = meal.name;

    // Handle Edit Mode
    if (is_edit_mode)
    {
        // Set the text fields to read/write
        meal_name_iput.readOnly = false;
        meal_instructions_text_area.readOnly = false;
        document.getElementById('meal_ingredient_input').value = '';

        // Show the edit controls/buttons
        document.getElementById('edit_button').src = "images\\controls\\check.png";
        document.getElementById('edit_button').parentElement.style.backgroundColor = "#00e364";
        document.getElementById('cancel_button').parentElement.style.visibility = "visible";
        document.getElementById('meal_ingredient_input').parentElement.style.visibility = "visible";
        document.getElementById('ingredient_add_button').parentElement.style.visibility = "visible";
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


    // Clear the current ingredient list and then populate it with the ingredients
    document.getElementById('ingredients_unordered_list').innerHTML = "";
    for (var i = 0; i < meal.ingredients.length; i++)
    {
        // Create the HTML elements
        var ingredient_element = document.createElement("li");
        var ingredient_name_element = document.createElement("div");
        var ingredient_name_text_node = document.createTextNode(meal.ingredients[i]);
        var ingredient_remove_button = document.createElement("div");
        var ingredient_remove_button_icon = is_edit_mode ? 'x' : '';


        // Setup the ingredient name element (nested in the ingredient element)
        ingredient_name_element.classList.add("ingredient");
        ingredient_name_element.id = "ingredient_" + i;
        ingredient_name_element.appendChild(ingredient_name_text_node);

        // Setup the ingredient remove button (nested in the ingredient element)
        ingredient_remove_button.classList.add("remove_ingredient_button");
        ingredient_remove_button.id = "button_" + i;
        ingredient_remove_button.innerHTML = ingredient_remove_button_icon;

        // Setup the ingredient element (with the nested name and remove button)
        ingredient_element.classList.add("flex-ingredient-item");
        ingredient_element.appendChild(ingredient_name_element);
        ingredient_element.appendChild(ingredient_remove_button);

        // Add the ingredient to the ingredients list
        document.getElementById('ingredients_unordered_list').appendChild(ingredient_element);
    }

    // Setup the onclick functionality
    setup_ingredient_onclick_function();
    setup_edit_button_onclick_function();
    setup_cancel_button_onclick_function();
    setup_add_ingredient_button_onclick_function();
}

/**
* HIGHLIGHT_CURRENT_MEAL
* Highlights the currently selected meal in the meal list so the user knows which one they are one
* @param meal_id used to know which meal in the list to highlight
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
* REMOVE_INGREDIENT
* Removes an ingredient from the current meal
* @param ingredient_index used to know which ingredient to remove
* @return
*/
function remove_ingredient(ingredient_index)
{
    // Check if in edit mode (only remove in edit mode)
    if (is_edit_mode)
    {
        // Remove (or splice) the ingredient from the ingredient list
        current_meal.ingredients.splice(ingredient_index, 1);

        // Repopulate the meal editor to reflect the change
        populate_meal_editor(current_meal);
    }
}

/**
* SAVE_MEAL_PLAN
* Saves all the user's meal plans to storage
*/
function save_meal_plan()
{
    try
    {
        localStorage.user_meal_plan_data = JSON.stringify(meal_plans);
    }
    catch (exception)
    {
        // Alert the user there was a problem saving
        alert("We are unable to save your meal plans. We apologize for any inconvenience.");
    }

}

/**
* SAVE_MEAL_LIST
* Saves the user's current meal list (as shown in the interface) to storage.
*/
function save_meal_list() {
    try {
        localStorage.user_meal_list = JSON.stringify(meals);
        // for (var meal in meals) {
        //     if (meals.hasOwnProperty(meal)) {
        //         var db_users_meals_ref = firebase_database.ref().child('Users_Meals/' + user_id);
        //         var meal_object = { name: txtMealName.value, recipe: txtMealRecipe.value, ingredients: { "ingredient_1": txtMealIngredient1.value, "ingredient_2": txtMealIngredient2.value, "ingredient_3": txtMealIngredient3.value } };
        //         var new_users_meals_record_ref = db_users_meals_ref.push();
        //         new_users_meals_record_ref.set(meal_object);
        //         meal_id = new_users_meals_record_ref.key;
        //     }
        // }
    }
    catch (exception) {
        // Alert the user there was a problem saving
        alert("We are unable to save your changes to the meals in your meal list. We apologize for any inconvenience.");
    }
}
