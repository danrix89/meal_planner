
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

// Global flag to know if the currently selected meal is from the meal list (if false, it's from the calendar)
var is_selected_meal_from_meal_list = true;

// Used for knowing what the previous selected meal was in case we need to unselect it when we select a new one, etc.
var previous_meal = { "id": "", "name": "", "image_path": "", "ingredients": {}, "recipe": "" };

// The currently selected and updated meal
var current_meal = { "id": "", "name": "", "image_path": "", "ingredients": {}, "recipe": "" };

// Used to record a meals data before and edit, so in case the user cancels the edit, the meal can be put back to the way it was before the edit
var meal_before_edit = { "id": "", "name": "", "image_path": "", "ingredients": {}, "recipe": "" };

// The possible database plannedMonth record data of the current month (null, if no record is in the database)
var current_plannedMonth = { id: null, formatted_date: null };

// Flag to know when the app and its controls have been initialized
var is_app_initialized = false;

// Flag to know if a new meal image file was selected for the meal's image
is_meal_image_file_changed = false;

// The list/array of user meals
var meals = [];

// The current user (if "null" then no one is logged in)
var user = {};

// Cache of user meal images (updated as user uploads new meal images)
var user_meal_images_url_cache = {};

// Cache of default meal images
var default_meal_images_url_cache = {};

// A reference to Firebase
var firebase_ref = {};

// A reference to the firebase database
var firebase_database = {};

// A reference to the firsebase authentication
var firebase_authentication = {};

// A reference to the firsebase authentication
var firebase_storage = {};

/*****************************************************/
/* Firebase Initialization Functions *****************/
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

/*****************************************************/
/* Sign-In Initialization Functions ******************/
/*****************************************************/

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

/*****************************************************/
/* App Initialization Functions **********************/
/*****************************************************/

/**
* SETUP_APP_CONTROLS
* Sets up the sign-in option buttons with click actions.
*/
function setup_app_controls() {
    // Menu bar controls
    document.getElementById('comment_bubble_button').onclick = show_user_feedback_dialog;
    document.getElementById('friend_request_button').onclick = show_friend_request_dialog;
    document.getElementById('log_out_button').onclick = logout;

    // Calendar controls
    setup_calendar_title_and_nav_buttons();
    document.getElementById('calendar_garbage_button').onclick = delete_meal_from_calendar;

    // Meal List controls
    document.getElementById('share_meal_button').onclick = show_meal_share_dialog;
    document.getElementById('add_button').onclick = setup_for_adding_new_meal;
    document.getElementById('meal_list_garbage_button').onclick = delete_meal_from_meal_list;

    // Editor controls
    document.getElementById("edit_button").onclick = edit_current_meal;
    document.getElementById("confirm_button").onclick = confirm_changes;
    document.getElementById("cancel_button").onclick = cancel_changes;
    document.getElementById("change_image_button").onclick = show_meal_image_picker_dialog;
    document.getElementById("confirm_button").classList.add("hide");
    document.getElementById("cancel_button").classList.add("hide");
    document.getElementById('meal_name_input').readOnly = true;
    document.getElementById('recipe_text_area').readOnly = true;
    document.getElementById('meal_ingredient_input').value = '';
    document.getElementById('meal_ingredient_input').parentElement.style.visibility = "hidden";
    document.getElementById('ingredient_add_button').parentElement.style.visibility = "hidden";

    // Friend Request Dialog/Pop-up
    document.getElementById('user_feedback_pop_up_background').onclick = hide_user_feedback_dialog;
    document.getElementById('send_user_feedback_button').onclick = send_user_feedback;

    // Friend Request Dialog/Pop-up
    document.getElementById('friend_request_pop_up_background').onclick = hide_friend_request_dialog;
    document.getElementById('accept_friend_request_button').onclick = accept_friend_request;
    document.getElementById('decline_friend_request_button').onclick = decline_friend_request;
    document.getElementById('send_friend_request_button').onclick = send_friend_request;
    populate_awaiting_friend_requests();

    // Meal Sharing Dialog/Pop-up
    document.getElementById('share_meal_pop_up_background').onclick = hide_meal_share_dialog;
    document.getElementById('accept_awaiting_meal_shares_button').onclick = accept_meal_share;
    document.getElementById('decline_awaiting_meal_shares_button').onclick = decline_meal_share;
    document.getElementById('share_meal_with_friend_button').onclick = share_meal_with_friend;
    populate_awaiting_meal_shares();
    populate_friend_list();

    // Meal Image Picker Dialog/Pop-up
    document.getElementById('meal_image_picker_pop_up_background').onclick = hide_meal_image_picker_dialog;
    document.getElementById('confirm_meal_image_pick_button').onclick = confirm_meal_image_pick;
    document.getElementById('image_category_list_item_my_images').onclick = populate_meal_image_picker_list_with_user_images;
    document.getElementById('image_category_list_item_default_images').onclick = populate_meal_image_picker_list_with_default_images;
    document.getElementById('meal_image_upload_button').onclick = on_upload_images_button_click;
    document.getElementById('meal_upload_progress').classList.add('hide');
    document.getElementById('meal_upload_progress_label').classList.add('hide');
    setup_meal_image_file_uploader_change_actions();
    load_and_cache_meal_images();
}

/**
* INITIALIZE_MEAL_PLANNER_APP
* Initializes the app (after a successful log in) with controls, fields, data, etc.
*/
function initialize_meal_planner_app() {
    var app_title_pixel_height = 60;
    var pixel_height = (window.innerHeight - app_title_pixel_height) + "px";
    document.getElementById("calendar_panel").style.height = pixel_height;
    document.getElementById("side_panel").style.height = pixel_height;

    // Setup app butons and other controls
    setup_app_controls();

    // Set the user's meals from the database.
    firebase_database.ref("Users_Meals/" + user.uid).once("value", initialize_user_meals_from_db_snapshot);

    is_app_initialized = true;
}

/**
* INITIALIZE_USER_MEALS_FROM_DB_SNAPSHOT
* Get the user's meals from storage (not the meal plans but their list of meals)
*/
function initialize_user_meals_from_db_snapshot(db_snapshot) {

    set_meals_from_db_snapshot(db_snapshot);

    // Set the initial current/previous meals to the first meal when loading the page.
    previous_meal = meals[0];
    set_current_meal(meals[0].id);

    // Populate the app interface with data
    populate_meal_list();
    populate_meal_editor(current_meal);
    hide_edit_mode_controls();

    // This will also populate the calendar with any planned meals
    populate_calendar_days();

    // Highlight the first meal in the meal list
    highlight_current_meal(meals[0].id, true);
}

/*****************************************************/
/* Authentication Functions **************************/
/*****************************************************/

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

        firebase_database.ref('Users').child(user.uid).once('value', function(db_snapshot) {
            if (db_snapshot.val() == null) {
                create_new_user_data(user);
            } else if (!is_app_initialized){
                // Populate the calendar, meal list, etc.
                initialize_meal_planner_app();
            }
        });

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

/*****************************************************/
/* Sign-In Implementation Functions ******************/
/*****************************************************/

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
            .then(create_new_user_data)
            .catch (function(event) {alert(event.message);
        });
    } else {
        txtPassword.focus();
        alert("Passwords must be 6 or more characters");
    }
}

function create_new_user_data(firebase_user) {
    // Create the user in the database
    firebase_database.ref('Users/'+ firebase_user.uid).set({ display_name: firebase_user.displayName, email: firebase_user.email });

    // Set the user's meals in the database as the default meals
    firebase_database.ref("DefaultMeals").once("value", function(db_snapshot) {
        var default_meals = db_snapshot.val();
        var db_users_meals_ref = firebase_database.ref('Users_Meals/' + firebase_user.uid);

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

        if (!is_app_initialized) {
            initialize_meal_planner_app();
        }
    });
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
    firebase_authentication.signInWithPopup(provider)
        .catch(function(error) {
            console.log(error.message);
        });
}

/*****************************************************/
/* App Implementation Functions **********************/
/*****************************************************/

function set_meals_from_db_snapshot(db_snapshot) {
    var user_meals_from_db = db_snapshot.val();
    meals = [];

    // Loop through each of the meals (by id)
    for (var meal_id in user_meals_from_db) {

        // Ensure the id is valid
        if (user_meals_from_db.hasOwnProperty(meal_id)) {
            // Create a meal object and set the id, name, image_path, ingredients
            // etc.
            var meal = {}
            meal.id = meal_id;
            meal.name = user_meals_from_db[meal_id].name;
            meal.image_path = user_meals_from_db[meal_id].image_path;
            meal.image_source_url = "";
            meal.recipe = user_meals_from_db[meal_id].recipe;
            meal.ingredients = user_meals_from_db[meal_id].ingredients;

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
    document.getElementById("month_title").innerHTML = formatted_date(calendar_date);

    // Set the current_plannedMonth from the database?
    firebase_database.ref('Users_PlannedMonths/' + user.uid).orderByChild("formatted_date").equalTo(formatted_date(calendar_date)).once("value", function(snapshot) {
        var plannedMonths = snapshot.val();
        if (isValueSet(plannedMonths)) {
            for (var plannedMonth_record_id in plannedMonths) {
                if (plannedMonths.hasOwnProperty(plannedMonth_record_id)) {
                    if (plannedMonths[plannedMonth_record_id].formatted_date == formatted_date(calendar_date)) {
                        current_plannedMonth = { id: plannedMonth_record_id, formatted_date: plannedMonths[plannedMonth_record_id].formatted_date };
                    }
                }
            }
        } else {
            current_plannedMonth = { id: null, formatted_date: null };
        }
    })

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
                // Create and setup the DOM elements that will hold meal data for that day
                var calendar_day_number_element = document.createElement("div");
                var calendar_day_data_container_element = document.createElement("div");

                // Setup calendar_day_data_day_element
                calendar_day_number_element.classList.add("calendar_day_number_element");
                calendar_day_number_element.innerHTML = day;

                // Setup calendar_day_data_container_element
                calendar_day_data_container_element.id = "calendar_day_data_container_element_" + day;
                calendar_day_data_container_element.classList.add("calendar_day_data_container_element");
                calendar_day_data_container_element.setAttribute("ondrop", "drop_meal(event)");
                calendar_day_data_container_element.setAttribute("ondragover", "allow_meal_drop(event)")
                calendar_day_data_container_element.setAttribute("data-day", day);
                calendar_day_data_container_element.setAttribute("data-is-container", true);

                // Add the data div to the element
                calendar_day_element.appendChild(calendar_day_number_element);
                calendar_day_element.appendChild(calendar_day_data_container_element);

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
    get_meal_plan_for_current_month();
}

/**
*
*/
function get_meal_plan_for_current_month() {
    if (current_plannedMonth.formatted_date == formatted_date(calendar_date) && isValueSet(current_plannedMonth.id)) {
        var db_plannedMonths_mealPlans_ref = firebase_database.ref('PlannedMonths_MealPlans/' + current_plannedMonth.id);
        db_plannedMonths_mealPlans_ref.orderByChild("day").once("value", function(db_mealPlans_snapshot) {
            populate_calendar_with_mealPlans_snapshot(db_mealPlans_snapshot.val());
        });
    } else {
        var db_users_plannedMonths_ref = firebase_database.ref('Users_PlannedMonths/' + user.uid);
        db_users_plannedMonths_ref.orderByChild("formatted_date").equalTo(formatted_date(calendar_date)).once("value", function(db_snapshot) {
            for (var plannedMonth_id in db_snapshot.val()) {
                if (db_snapshot.val().hasOwnProperty(plannedMonth_id) && (formatted_date(calendar_date) == (db_snapshot.val()[plannedMonth_id]).formatted_date)) {
                    current_plannedMonth = { id: plannedMonth_id, formatted_date: (db_snapshot.val()[plannedMonth_id]).formatted_date };
                    get_meal_plan_for_current_month();
                    break;
                }
            }
        });
    }
}

/**
*
*/
function populate_calendar_with_mealPlans_snapshot(meal_plans_snapshot) {

    for (var mealPlan_id in meal_plans_snapshot) {
        if (meal_plans_snapshot.hasOwnProperty(mealPlan_id)) {
            var meal_plan_object = meal_plans_snapshot[mealPlan_id];
            add_meal_element_to_calendar(mealPlan_id, meal_plan_object.name, meal_plan_object.image_path, meal_plan_object.day);
        }
    }
}

/**
*
*/
function add_meal_element_to_calendar(id, name, image_path, day) {
    var calendar_day_element = document.getElementById('calendar_day_data_container_element_' + day);
    var image_element = document.createElement("img");
    var name_element = document.createElement("div");

    // Setup image_element
    image_element.id = 'drag_' + id + '_calendar';
    image_element.classList.add("calendar_day_data_container_image_element");
    image_element.setAttribute('draggable', 'true');
    image_element.setAttribute('ondragstart', 'drag_meal(event)');
    image_element.setAttribute('data-meal-id', id);
    image_element.setAttribute('data-image-path', image_path);
    image_element.onclick = (function(a_id) { return function() { select_meal_in_calendar(a_id); } })(id);
    set_image_src(firebase_storage.ref().child(image_path), image_element);

    // Setup name_element
    name_element.id = "calendar_day_data_container_name_element_" + id;
    name_element.classList.add("calendar_day_data_container_name_element");
    name_element.innerHTML = name;

    // Add the elements to the container
    calendar_day_element.appendChild(image_element);
    calendar_day_element.appendChild(name_element);
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
* ADD_NEW_MEAL_TO_CURRENT_MONTH_MEAL_PLAN
* Add a new meal to the meal plan for the current month
* @param day on the calendar that the meal is being planned for
* @param meal_id from the meal in the users meal list
*/
function add_new_meal_to_meal_plan(day, meal_id, plannedMonth_id)
{
    firebase_database.ref('Users_Meals/' + user.uid + "/" + meal_id).once("value", function(db_snapshot) {
        // Add the meal to the database
        var db_plannedMonths_mealPlans_ref = firebase_database.ref('PlannedMonths_MealPlans/' + plannedMonth_id);
        var new_mealPlan_record_ref = db_plannedMonths_mealPlans_ref.push();
        var meal_plan_object = db_snapshot.val();
        meal_plan_object.day = day;
        new_mealPlan_record_ref.set(meal_plan_object);

        var meal_object = {id: new_mealPlan_record_ref.key, name: meal_plan_object.name, image_path: meal_plan_object.image_path, recipe: meal_plan_object.recipe, ingredients: meal_plan_object.ingredients};
        previous_meal = current_meal;
        current_meal = meal_object;

        // Create a new meal calendar day element
        add_meal_element_to_calendar(new_mealPlan_record_ref.key, meal_object.name, meal_object.image_path, day);

        // Set the meal editor to the newly added meal
        populate_meal_editor(current_meal);

        // Highlight the newly added meal
        highlight_current_meal(current_meal.id, false);
    }, function(errorObject) {
        console.log("The read failed: " + errorObject.code);
        console.log("The read failed: " + errorObject.message);
    });
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

    var meal_id = document.getElementById(data).getAttribute("data-meal-id");

    // Find the parent element of the dropped meal (where did we drag it from?)
    var parent_element = document.getElementById(data).parentElement;

    var target_day = event.target.getAttribute("data-day");
    if (target_day == null) {
        target_day = event.target.parentElement.getAttribute("data-day");
        if (target_day == null) {
            target_day = -1;
        }
    }

    // If the parent element is a meal list item, copy the data over...
    if (parent_element.className.includes("flex-meal-item")) {
        // Get the meal plan for the current month from the database (using the "formatted_date")
        var db_users_plannedMonths_ref = firebase_database.ref('Users_PlannedMonths/' + user.uid)
        db_users_plannedMonths_ref.once("value", function(snapshot) {
            // Loop through the months to see if one matches the current formatted_date
            var already_existing_plannedMonth_id = null;
            var plannedMonths_MealPlans = snapshot.val()
            for (var plannedMonth_id in plannedMonths_MealPlans) {
                if (plannedMonths_MealPlans.hasOwnProperty(plannedMonth_id)) {
                    if (plannedMonths_MealPlans[plannedMonth_id].formatted_date == formatted_date(calendar_date)) {
                        already_existing_plannedMonth_id = plannedMonth_id;
                        break;
                    }
                }
            }

            if (isValueSet(already_existing_plannedMonth_id)) {
                current_plannedMonth = { id: plannedMonth_id, formatted_date: (snapshot.val()[plannedMonth_id]).formatted_date };
                // Check if a meal is already is that spot
                firebase_database.ref('PlannedMonths_MealPlans/' + already_existing_plannedMonth_id).once("value", function(db_snapshot) {
                    var meal_plans = db_snapshot.val();
                    if (isValueSet(meal_plans)) {
                        for (var meal_plan_id in meal_plans) {
                            if (meal_plans.hasOwnProperty(meal_plan_id) && meal_plans[meal_plan_id].day == target_day) {
                                // Delete the meal in the database
                                firebase_database.ref('PlannedMonths_MealPlans/' + already_existing_plannedMonth_id + '/' + meal_plan_id).remove();

                                // Remove the element from the calendar
                                var meal_plan_image_element = document.getElementById('drag_' + meal_plan_id + '_calendar');
                                meal_plan_image_element.parentElement.removeChild(meal_plan_image_element);
                                var meal_plan_name_element = document.getElementById('calendar_day_data_container_name_element_' + meal_plan_id);
                                meal_plan_name_element.parentElement.removeChild(meal_plan_name_element);

                                // End the loop
                                break;
                            }
                        }
                        // Create a new meal
                        add_new_meal_to_meal_plan(target_day, meal_id, already_existing_plannedMonth_id);
                    }
                })
            } else {
                // If not, then create a new plannedMonth and add the meal to that planned month
                var new_plannedMonths_record_ref = db_users_plannedMonths_ref.push();
                var plannedMonth_object = {formatted_date: formatted_date(calendar_date)};
                new_plannedMonths_record_ref.set(plannedMonth_object);
                current_plannedMonth = { id: new_plannedMonths_record_ref.key, formatted_date: formatted_date(calendar_date) };
                add_new_meal_to_meal_plan(target_day, meal_id, new_plannedMonths_record_ref.key);
            }
        }, function (errorObject) {
          console.log("The read failed: " + errorObject.code);
          console.log("The read failed: " + errorObject.message);
        });
    } else { // Else, the data should be transfered/moved
        var source_meal_plan_image_element = document.getElementById(data);
        var source_meal_plan_name_element = document.getElementById("calendar_day_data_container_name_element_" + source_meal_plan_image_element.dataset.mealId);
        var source_day = source_meal_plan_image_element.parentElement.getAttribute("data-day");
        var image_path = source_meal_plan_image_element.getAttribute("data-image-path");

        // Does the target day have a meal already there?
        var is_meal_plan_container_element = event.target.getAttribute("data-is-container");
        if (is_meal_plan_container_element) {
            add_meal_element_to_calendar(source_meal_plan_image_element.getAttribute("data-meal-id"), source_meal_plan_name_element.innerHTML, image_path, target_day);
        } else {
            // Copy the image over
            var target_meal_plan_image_element = event.target
            var target_meal_plan_name_element = document.getElementById("calendar_day_data_container_name_element_" + target_meal_plan_image_element.dataset.mealId);

            // Replace the image/name in the target parentElement
            set_image_src(firebase_storage.ref().child(image_path), target_meal_plan_image_element);
            target_meal_plan_image_element.setAttribute("data-image-path", image_path);
            target_meal_plan_image_element.id = source_meal_plan_image_element.id;
            target_meal_plan_name_element.innerHTML = source_meal_plan_name_element.innerHTML;
        }

        // Update the "day" in the database record and delete the other target day's record (if any)
        overwrite_meal_plan_day(target_day, source_day);

        // Remove the image from the source parentElement
        source_meal_plan_image_element.parentElement.style.backgroundColor = "";
        source_meal_plan_image_element.parentElement.removeChild(source_meal_plan_image_element);
        source_meal_plan_name_element.parentElement.removeChild(source_meal_plan_name_element);
    }
}

/**
* Overwrite Meal Plan Day
* Overwrites a meal plan day by updating the record of the source day with the
* target day, and deleting the record with the target day.
*/
function overwrite_meal_plan_day(target_day, source_day) {
    // Check if current_plannedMonth is the same as the current month...
    if ((current_plannedMonth.formatted_date == formatted_date(calendar_date)) && (isValueSet(current_plannedMonth.id))) {
        // Save the changes to the database
        var db_plannedMonths_mealPlans_ref = firebase_database.ref("PlannedMonths_MealPlans/" + current_plannedMonth.id);
        db_plannedMonths_mealPlans_ref.once("value", function(db_snapshot) {
            var meal_plans = db_snapshot.val();
            // Loop through and find the target day (if any) and remove that record
            for (var meal_plan_id in meal_plans) {
                if (meal_plans.hasOwnProperty(meal_plan_id)) {
                    if ((meal_plans[meal_plan_id]).day == target_day) {
                        // Delete the meal that has the target_day
                        firebase_database.ref("PlannedMonths_MealPlans/" + current_plannedMonth.id + "/" + meal_plan_id).remove();
                    }
                }
            }
            // Loop through and find the source day and update it's "day" with the target_day
            for (var meal_plan_id in meal_plans) {
                if (meal_plans.hasOwnProperty(meal_plan_id)) {
                    if ((meal_plans[meal_plan_id]).day == source_day) {
                        // Set the current_meal to the meal plan of the source day
                        var meal_object = {id: meal_plan_id, name: (meal_plans[meal_plan_id]).name, recipe: (meal_plans[meal_plan_id]).recipe, image_path: (meal_plans[meal_plan_id]).image_path, ingredients: (meal_plans[meal_plan_id]).ingredients};
                        current_meal = meal_object;
                        // Set the source meal's day with the new target_day
                        firebase_database.ref("PlannedMonths_MealPlans/" + current_plannedMonth.id + "/" + meal_plan_id + "/day").set(target_day);
                    }
                }
            }
            highlight_current_meal(current_meal.id, false);
        });
    } else {
        // If the current_plannedMonth is not this month (or not set), then update in and recall this function (recursion)
        firebase_database.ref('Users_PlannedMonths' + user.uid).orderByChild("formatted_date").equalTo(formatted_date(calendar_date)).once("value", function(db_snapshot) {
            for (var plannedMonth_id in db_snapshot.val()) {
                if (db_snapshot.val().hasOwnProperty(plannedMonth_id) && (db_snapshot.val()[plannedMonth_id]).formatted_date == formatted_date(calendar_date)) {
                    current_plannedMonth = { id: plannedMonth_id, formatted_date: formatted_date(calendar_date) };
                    overwrite_meal_plan_day(target_day, source_day);
                }
            }
        })
    }

    // If the user is overwriting a day, delete the one that's being overwritten
}

/**
* Deletes the currently selected meal from the users meals
*/
function delete_meal_from_meal_list()
{
    if (!current_meal.is_calendar_meal) {
        if (confirm("Are you sure you want to remove " + current_meal.name + " from your meals? (This cannot be undone)")) {
            // Get the meal id
            var meal_id = current_meal.id;

            // Remove that one item from the calendar in HTML
            var meal_element_to_be_removed = document.getElementById("meal_list_item_" + meal_id);
            meal_element_to_be_removed.parentElement.removeChild(meal_element_to_be_removed);

            // Delete the meal from the Users_Meals in the database
            var meal_record_to_remove = firebase_database.ref("Users_Meals/" + user.uid + "/" + meal_id);
            meal_record_to_remove.remove();

            // Remove the meal from the "meals" in memory
            for (var i = 0; i < meals.length; i++) {
                if (meals[i].id == meal_id) {
                    meals.splice(i, 1);
                    break;
                }
            }
        }
    }
}

/**
* Deletes the currently selected calendar meal from the current month's meal plan
*/
function delete_meal_from_calendar()
{
    if (current_meal.is_calendar_meal) {
        var meal_id = current_meal.id
        var meal_image_element_to_be_removed = document.getElementById("drag_" + meal_id + "_calendar");
        var meal_name_element_to_be_removed = document.getElementById("calendar_day_data_container_name_element_" + meal_id);
        var meal_container_element = meal_image_element_to_be_removed.parentElement;

        // Remove that one item from the calendar in HTML
        meal_container_element.removeChild(meal_image_element_to_be_removed);
        meal_container_element.removeChild(meal_name_element_to_be_removed);
        meal_container_element.style.backgroundColor = "";

        // Delete the PlannedMonths_MealPlans record for that day
        if (isValueSet(current_plannedMonth.id) && current_plannedMonth.formatted_date == formatted_date(calendar_date)) {
            var mealPlan_record_to_remove = firebase_database.ref("PlannedMonths_MealPlans/" + current_plannedMonth.id + "/" + meal_id);
            mealPlan_record_to_remove.remove();
        } else {
            firebase_database.ref('Users_PlannedMonths' + user.uid).orderByChild("formatted_date").equalTo(formatted_date(calendar_date)).once("value", function(db_snapshot) {
                for (var plannedMonth_id in db_snapshot.val()) {
                    if (db_snapshot.val().hasOwnProperty(plannedMonth_id) && (db_snapshot.val()[plannedMonth_id]).formatted_date == formatted_date(calendar_date)) {
                        current_plannedMonth = { id: plannedMonth_id, formatted_date: formatted_date(calendar_date) };
                        var mealPlan_record_to_remove = firebase_database.ref("PlannedMonths_MealPlans/" + current_plannedMonth.id + "/" + meal_id);
                        mealPlan_record_to_remove.remove();
                    }
                }
            })
        }
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
        add_meal_list_element(meals[i].id, meals[i].name, meals[i].image_path);
    }
}

/**
* Add meal list element
* Adds a meal list element to the meal list with an id, name, and image_path.
*/
function add_meal_list_element(id, name, image_path) {
    var id = id;
    var image_path = image_path;
    var meal_list_item_element = document.createElement("li");
    var meal_name_element = document.createElement("div");
    var image_element = document.createElement("img");

    // Set up the meal image element
    image_element.id = "drag_" + id;
    set_image_src(firebase_storage.ref().child(image_path), image_element);
    image_element.draggable = true;
    image_element.setAttribute('ondragstart', 'drag_meal(event)');
    image_element.setAttribute("data-meal-id", id);
    image_element.setAttribute("data-image-path", image_path);
    image_element.setAttribute("onclick","select_meal_in_meal_list('" + id + "')");

    // Set up the meal name div element
    meal_name_element.classList.add("meal_name");
    meal_name_element.id = "meal_list_name_" + id;
    meal_name_element.innerHTML = name;

    // Setup the meal list item element
    meal_list_item_element.id = "meal_list_item_" + id;
    meal_list_item_element.classList.add("flex-meal-item");

    // Insert the image and name into the meal list item
    meal_list_item_element.appendChild(image_element);
    meal_list_item_element.appendChild(meal_name_element);

    // Insert all of it into the meal list
    document.getElementById('meal_unordered_list').appendChild(meal_list_item_element);
}

/**
* Show Hide Ingredient Remove Buttons
* Toggles between sh
*/
function show_hide_ingredeint_remove_buttons(isShow)
{
    if (isShow) {
        for (var ingredient in current_meal.ingredients) {
            if (current_meal.ingredients.hasOwnProperty(ingredient)) {
                // Ensure a remove button doesn't already exist
                if (!isValueSet(document.getElementById("ingredient_remove_button_" + ingredient))) {
                    // Setup the ingredient remove button (nested in the ingredient element)
                    var ingredient_remove_button = document.createElement("button");
                    ingredient_remove_button.classList.add("remove_ingredient_button");
                    ingredient_remove_button.id = "ingredient_remove_button_" + ingredient;
                    ingredient_remove_button.setAttribute("onclick", "remove_ingredient('" + ingredient + "')");

                    // Setup the ingredient remove button image (in the button)
                    var ingredient_remove_button_image = document.createElement("img");
                    ingredient_remove_button_image.src = "images\\controls\\cancel_orange.png";
                    ingredient_remove_button_image.classList.add("button_image");
                    ingredient_remove_button.appendChild(ingredient_remove_button_image);

                    document.getElementById(ingredient).appendChild(ingredient_remove_button);
                }
            }
        }
    } else {
        for (var ingredient in current_meal.ingredients) {
            if (current_meal.ingredients.hasOwnProperty(ingredient)) {
                // Check if the ingredient list item has a remove button
                var ingredient_remove_button = document.getElementById("ingredient_remove_button_" + ingredient);
                if (isValueSet(ingredient_remove_button)) {
                    // If so, remove the button from the list item element
                    ingredient_remove_button.parentElement.removeChild(ingredient_remove_button);
                }
            }
        }
    }
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

        current_meal.is_calendar_meal = false;

        // Populate the meal editor with the current meal
        populate_meal_editor(current_meal);

        // Set that you're selecting a meal from the meal list
        is_selected_meal_from_meal_list = true;

        // Highlight the selected/clicked meal
        highlight_current_meal(meal_id, true);
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
        if ((current_plannedMonth.formatted_date == formatted_date(calendar_date)) && isValueSet(current_plannedMonth.id)) {
            firebase_database.ref('PlannedMonths_MealPlans/' + current_plannedMonth.id + "/" + meal_id).once("value", function(db_snapshot) {
                previous_meal = current_meal;
                var meal_object = { id: meal_id, name: (db_snapshot.val())["name"], recipe: (db_snapshot.val())["recipe"], image_path: (db_snapshot.val())["image_path"], ingredients: (db_snapshot.val())["ingredients"]}
                current_meal = meal_object;
                current_meal.is_calendar_meal = true;

                // Populate the meal editor with the current meal
                populate_meal_editor(current_meal);

                // Set that you're selecting a meal from the meal list
                is_selected_meal_from_meal_list = false;

                // Highlight the selected/clicked meal
                highlight_current_meal(meal_id, false);
            })
        } else {
            // If the current_plannedMonth is not this month (or not set), then update in and recall this function (recursion)
            var db_plannedMonths_mealPlans_ref = firebase_database.ref('PlannedMonths_MealPlans');
            firebase_database.ref('Users_PlannedMonths' + user.uid).orderByChild("formatted_date").equalTo(formatted_date(calendar_date)).once("value", function(db_snapshot) {
                for (var plannedMonth_id in db_snapshot.val()) {
                    if (db_snapshot.val().hasOwnProperty(plannedMonth_id) && (db_snapshot.val()[plannedMonth_id]).formatted_date == formatted_date(calendar_date)) {
                        current_plannedMonth = { id: plannedMonth_id, formatted_date: formatted_date(calendar_date) };
                        select_meal_in_calendar(meal_id);
                    }
                }
            })
        }
    }
}

/**
* Setup_for_adding_new_meal
* Actions for when the add meal button is clicked in the meal list (a.k.a. the + button)
*/
function setup_for_adding_new_meal()
{
    // Ensure the user isn't already editing or adding a meal
    if (!is_edit_mode && !is_adding_new_meal)
    {
        is_adding_new_meal = true;
        is_edit_mode = true;

        // Set the previous meal
        previous_meal = current_meal;

        // Set the current meal to a new empty one for editing
        current_meal = { id: "", name: "", image_path: "", ingredients: {}, recipe: "" };

        // Setup the meal editor
        setup_meal_editor_for_adding_new_meal();
    }
}

/**
* Setup_meal_editor_for_adding_new_meal
* Actions for when the add meal button is clicked in the meal list (a.k.a. the + button)
*/
function setup_meal_editor_for_adding_new_meal()
{
    // Setup the meal editor
    show_edit_mode_controls();

    // Populate the editor with the new meal (all fields will be blank)
    populate_meal_editor(current_meal);
    document.getElementById('meal_name_input').focus();
}

/**
* Add meal list item from db snapshot
* Adds a new meal list element to the meal list using the db snapshot of the newly added meal
*/
function add_meal_list_item_from_db_snapshot(db_snapshot) {
    // Add the meal to "meals"
    var meal_object = db_snapshot.val();
    meal_object.id = db_snapshot.key;
    meals.push(meal_object);

    // Add the meal to the meal list from the snapshot
    add_meal_list_element(meal_object.id, meal_object.name, meal_object.image_path);

    // Select the newly added meal (this should populate the meal editor)
    select_meal_in_meal_list(meal_object.id);
}

/**
* Updates meal list item from db snapshot
* Updates meal list element in the meal list using the db snapshot of the edited meal
*/
function update_meal_list_item_with_changes_from_db_snapshot(db_snapshot) {
    // Update the meal list item to reflect what's in the database
    var id = db_snapshot.key;

    set_image_src(firebase_storage.ref().child((db_snapshot.val())["image_path"]), document.getElementById("drag_" + id));
    document.getElementById("meal_list_name_" + id).innerHTML = (db_snapshot.val())["name"];

    // Select the newly edited meal (this should populate the meal editor)
    select_meal_in_meal_list(id)
}

/**
* Updates meal list item from db snapshot
* Updates meal list element in the meal list using the db snapshot of the edited meal
*/
function update_calendar_item_with_changes_from_db_snapshot(db_snapshot) {
    // Update the meal list item to reflect what's in the database
    var id = db_snapshot.key;

    set_image_src(firebase_storage.ref().child((db_snapshot.val())["image_path"]), document.getElementById('drag_' + id + '_calendar'));
    document.getElementById("calendar_day_data_container_name_element_" + id).innerHTML = (db_snapshot.val())["name"];

    // Select the newly edited meal (this should populate the meal editor)
    select_meal_in_calendar(id);
}

/**
* ADD_INGREDIENT
* Adds an ingredient to the current_meal with the value of the ingredient text field.
*/
function add_ingredient()
{
    var ingredient_input_field = document.getElementById('meal_ingredient_input');
    if (is_edit_mode && ingredient_input_field.value != '')
    {
        // Get the value from the field
        var ingredient = ingredient_input_field.value;

        // Add it to the current meal
        if (isValueSet(current_meal.ingredients)) {
            current_meal.ingredients[ingredient] = ingredient;
        } else {
            current_meal.ingredients = {};
            current_meal.ingredients[ingredient] = ingredient;
        }

        // Add this ingredent to the ingredient list (HTML)
        var ingredient_list = document.getElementById('ingredients_unordered_list');
        add_ingredient_element_to_list(ingredient_list, ingredient);

        // Clear the field
        ingredient_input_field.value = '';
    }
}

function show_edit_mode_controls() {
    document.getElementById('edit_button').classList.add("hide");
    document.getElementById('meal_name_input').readOnly = false;
    document.getElementById('recipe_text_area').readOnly = false;
    document.getElementById('meal_ingredient_input').value = '';
    document.getElementById('meal_ingredient_input').parentElement.style.visibility = "visible";
    document.getElementById('ingredient_add_button').parentElement.style.visibility = "visible";
    document.getElementById('cancel_button').classList.remove("hide");
    document.getElementById('confirm_button').classList.remove("hide");
    document.getElementById('change_image_button').classList.remove("hide");
    show_hide_ingredeint_remove_buttons(true);
}

function hide_edit_mode_controls() {
    document.getElementById('edit_button').classList.remove("hide");
    document.getElementById('meal_name_input').readOnly = true;
    document.getElementById('recipe_text_area').readOnly = true;
    document.getElementById('meal_ingredient_input').value = '';
    document.getElementById('meal_ingredient_input').parentElement.style.visibility = "hidden";
    document.getElementById('ingredient_add_button').parentElement.style.visibility = "hidden";
    document.getElementById('cancel_button').classList.add("hide");
    document.getElementById('confirm_button').classList.add("hide");
    document.getElementById('change_image_button').classList.add("hide");
    show_hide_ingredeint_remove_buttons(false);
}

/**
* EDIT_CURRENT_MEAL
* Actions for when the edit button is clicked
*/
function edit_current_meal()
{
    // Toggle edit mode
    is_edit_mode = true;

    // Save the current meal before we edit it so we can recover if the user
    // decides to cancel their changes
    meal_before_edit = copy_meal(current_meal);

    // Show the edit mode controls in the meal editor pane.
    show_edit_mode_controls();
}

/**
* Confirm Changes
* Actions for when the edit button is clicked (
*/
function confirm_changes()
{
    // Take everything out of edit mode
    is_edit_mode = false;

    // ...Save changes to meal name and instructions
    current_meal.name = document.getElementById('meal_name_input').value;
    current_meal.recipe = document.getElementById('recipe_text_area').value;

    // Handle the image_path
    var image_path_input_element = document.getElementById('meal_image_input');
    current_meal.image_path = image_path_input_element.value;
    if (current_meal.image_path == "") {
        image_path_input_element.value = "meal_images/default_images/default_image.jpg";
        current_meal.image_path = image_path_input_element.value
    }

    // If we were adding then set the flag so we know we aren't in adding meal mode
    if (is_adding_new_meal)
    {
        is_adding_new_meal = false;

        // Write user meal to database
        var db_users_meals_ref = firebase_database.ref('Users_Meals/' + user.uid);
        var meal_object = { name: current_meal.name, image_path: current_meal.image_path, recipe: current_meal.recipe, ingredients: current_meal.ingredients };
        var new_users_meals_record_ref = db_users_meals_ref.push();
        new_users_meals_record_ref.set(meal_object);
        current_meal.id = new_users_meals_record_ref.key;

        // Add the meal to the meals object
        firebase_database.ref("Users_Meals/" + user.uid + "/" + new_users_meals_record_ref.key).once("value", add_meal_list_item_from_db_snapshot);
    } else {
        if (is_selected_meal_from_meal_list) {
            // Save the changes to the database
            var db_users_meals_meal_ref = firebase_database.ref("Users_Meals/" + user.uid + "/" + current_meal.id);
            var meal_object = { name: current_meal.name, image_path: current_meal.image_path, recipe: current_meal.recipe, ingredients: current_meal.ingredients };
            db_users_meals_meal_ref.set(meal_object);

            for (var i = 0; i < meals.length; i++)
            {
                if (meals[i].id == current_meal.id) {
                    meals[i] = copy_meal(current_meal);
                    break;
                }
            }

            // Refresh the meal list with those changes
            db_users_meals_meal_ref.once("value", update_meal_list_item_with_changes_from_db_snapshot);
        } else {
            // Update calendar meal
            update_calendar_meal(current_meal.id);
        }
    }
    hide_edit_mode_controls();
}

function toggle_locking_meal_editor_controls(is_to_lock_controls) {
    if (is_to_lock_controls) {
        document.getElementById('edit_button').disabled = true;
        document.getElementById('cancel_button').disabled = true;
        document.getElementById('confirm_button').disabled = true;
        document.getElementById('meal_name_input').disabled = true;
        document.getElementById('recipe_text_area').disabled = true;
        document.getElementById('meal_ingredient_input').readOnly = true;
        document.getElementById('meal_ingredient_input').readOnly = true;
        document.getElementById('ingredient_add_button').disabled = true;
        for (var ingredient in current_meal.ingredients) {
            if (current_meal.ingredients.hasOwnProperty(ingredient)) {
                // Check if the ingredient list item has a remove button
                var ingredient_remove_button = document.getElementById("ingredient_remove_button_" + ingredient);
                if (isValueSet(ingredient_remove_button)) {
                    // If so, remove the button from the list item element
                    ingredient_remove_button.disabled = true;
                }
            }
        }
    } else {
        document.getElementById('edit_button').disabled = false;
        document.getElementById('cancel_button').disabled = false;
        document.getElementById('confirm_button').disabled = false;
        document.getElementById('meal_name_input').disabled = false;
        document.getElementById('recipe_text_area').disabled = false;
        document.getElementById('ingredient_add_button').disabled = false;
        for (var ingredient in current_meal.ingredients) {
            if (current_meal.ingredients.hasOwnProperty(ingredient)) {
                // Check if the ingredient list item has a remove button
                var ingredient_remove_button = document.getElementById("ingredient_remove_button_" + ingredient);
                if (isValueSet(ingredient_remove_button)) {
                    // If so, remove the button from the list item element
                    ingredient_remove_button.disabled = false;
                }
            }
        }
    }
}

/**
*
*/
function update_calendar_meal(id) {
    // Check if current_plannedMonth is the same as the current month...
    if ((current_plannedMonth.formatted_date == formatted_date(calendar_date)) && isValueSet(current_plannedMonth.id)) {
        // Save the changes to the database
        var db_plannedMonths_mealPlans_meal_ref = firebase_database.ref("PlannedMonths_MealPlans/" + current_plannedMonth.id + "/" + id);
        db_plannedMonths_mealPlans_meal_ref.once("value", function(db_snapshot) {
            var meal_object = {day: (db_snapshot.val()).day, name: current_meal.name, image_path: current_meal.image_path, recipe: current_meal.recipe, ingredients: current_meal.ingredients };
            db_plannedMonths_mealPlans_meal_ref.set(meal_object);
            db_plannedMonths_mealPlans_meal_ref.once("value", function(db_snapshot_new) {
                update_calendar_item_with_changes_from_db_snapshot(db_snapshot_new);
            });
        });
    } else {
        // If the current_plannedMonth is not this month (or not set), then update in and recall this function (recursion)
        var db_plannedMonths_mealPlans_ref = firebase_database.ref('PlannedMonths_MealPlans');
        firebase_database.ref('Users_PlannedMonths' + user.uid).orderByChild("formatted_date").equalTo(formatted_date(calendar_date)).once("value", function(db_snapshot) {
            for (var plannedMonth_id in db_snapshot.val()) {
                if (db_snapshot.val().hasOwnProperty(plannedMonth_id) && (db_snapshot.val()[plannedMonth_id]).formatted_date == formatted_date(calendar_date)) {
                    current_plannedMonth = { id: plannedMonth_id, formatted_date: formatted_date(calendar_date) };
                    update_calendar_meal(id);
                }
            }
        })
    }
}

/**
* FUNCTION_NAME
* Description
* @param
* @return
*/
function cancel_changes()
{
    // Take everything out of edit mode
    is_edit_mode = false;

    // Check if adding we were adding a new meal
    if (is_adding_new_meal) {
        is_adding_new_meal = false;

        // set current meal back to previous meal
        current_meal = previous_meal;
    } else {
        // We aren't adding a new meal. This means we're editing
        // the current meal, so we need to put the current meal
        // back to the way it was before we started editing.
        current_meal = copy_meal(meal_before_edit);
    }

    populate_meal_editor(current_meal);
    hide_edit_mode_controls();
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
*/
function set_current_meal(meal_id)
{
    previous_meal = copy_meal(current_meal);
    for (var i = 0; i < meals.length; i++)
    {
        if (meals[i].id == meal_id) {
            current_meal = copy_meal(meals[i]);
            break;
        }
    }
}

/**
* POPULATE_MEAL_EDITOR
* Populates the meal editor (the box/window at the bottom right hand side of the interface)
* @param meal used to populate the editor with it's data
*/
function populate_meal_editor(meal)
{
    // Set the meal name, image path, and recipe fields/text areas
    var meal_name_iput = document.getElementById('meal_name_input');
    meal_name_iput.value = meal.name;
    var meal_image_path_input = document.getElementById('meal_image_input');
    meal_image_path_input.value = meal.image_path;
    var meal_instructions_text_area = document.getElementById('recipe_text_area');
    meal_instructions_text_area.value = meal.recipe;

    // Clear the current ingredient list and then populate it with the ingredients
    var ingredient_list = document.getElementById('ingredients_unordered_list')
    ingredient_list.innerHTML = "";

    for (var ingredient in meal.ingredients) {
        if (meal.ingredients.hasOwnProperty(ingredient)) {
            add_ingredient_element_to_list(ingredient_list, ingredient)
        }
    }

    // Setup the onclick functionality
    document.getElementById('ingredient_add_button').onclick = add_ingredient;
}

function add_ingredient_element_to_list(ingredient_list, ingredient) {
    // Create the HTML elements
    var ingredient_element = document.createElement("li");
    var ingredient_name_element = document.createElement("div");
    var ingredient_name_text_node = document.createTextNode(ingredient);

    // Setup the ingredient list item element
    ingredient_element.id = ingredient;

    // Setup the ingredient name element (nested in the ingredient element)
    ingredient_name_element.classList.add("ingredient");
    ingredient_name_element.id = "ingredient_name_" + ingredient;
    ingredient_name_element.appendChild(ingredient_name_text_node);

    // Setup the ingredient element (with the nested name and remove button)
    ingredient_element.classList.add("flex-ingredient-item");
    ingredient_element.appendChild(ingredient_name_element);

    // Add the ingredient to the ingredients list
    ingredient_list.appendChild(ingredient_element);

    if (is_edit_mode) {
        // Add a remove button
        show_hide_ingredeint_remove_buttons (true);
    }
}

/**
* HIGHLIGHT_CURRENT_MEAL
* Highlights the currently selected meal in the meal list so the user knows which one they are one
* @param meal_id used to know which meal in the list to highlight
*/
function highlight_current_meal(meal_id, is_being_selected_from_meal_list)
{
    // Remove the highlight on the last selected meal in the meal list (if any)
    var meal_list_element = document.getElementById("meal_list_item_" + previous_meal.id);
    if (isValueSet(meal_list_element)) {
        meal_list_element.style.backgroundColor = "";
    }

    // Remove the highlight on the last selected meal in the calendar (if any)
    var meal_calendar_day_element = document.getElementById('drag_' + previous_meal.id + '_calendar');
    if (isValueSet(meal_calendar_day_element)) {
        if (isValueSet(meal_calendar_day_element.parentElement)) {
            meal_calendar_day_element.parentElement.style.backgroundColor  = "";
        }
    }


    if (is_being_selected_from_meal_list) {
        // Add the highlight on the meal with meal_id
        meal_list_element = document.getElementById("meal_list_item_" + meal_id);
        if (isValueSet(meal_list_element)) {
            meal_list_element.style.backgroundColor = "#33afff";
        }
    } else {
        meal_calendar_day_element = document.getElementById('drag_' + meal_id + '_calendar');
        if (isValueSet(meal_calendar_day_element)) {
            if (isValueSet(meal_calendar_day_element.parentElement)) {
                meal_calendar_day_element.parentElement.style.backgroundColor  = "#33afff";
            }
        }

    }
}

/**
* REMOVE_INGREDIENT
* Removes an ingredient from the current meal
* @param ingredient_index used to know which ingredient to remove
* @return
*/
function remove_ingredient(ingredient)
{
    // Check if in edit mode (only remove in edit mode)
    if (is_edit_mode)
    {
        // Remove (or delete) the ingredient from the ingredient list of the current meal
        delete current_meal.ingredients[ingredient];

        // Remove the ingredient HTML element
        var ingredient_list_element = document.getElementById(ingredient);
        ingredient_list_element.parentElement.removeChild(ingredient_list_element);
    }
}

/***************
* User Feedback Functions
***************/

/**
* Shows the friend request pop-up dialog window
*/
function show_user_feedback_dialog() {
    document.getElementById('user_feedback_pop_up_background').style.display = "block";
}

/**
* When the user clicks anywhere outside of the dialog/pop-up, close it (make it disappear)
*/
function hide_user_feedback_dialog(event) {
    var modal = document.getElementById('user_feedback_pop_up_background');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function send_user_feedback() {
    var user_feedback_text = document.getElementById("user_feedback_textarea").value;
    if (user_feedback_text != "") {
        var new_feedback_record_ref = firebase_database.ref('Feedback').push();
        new_feedback_record_ref.set({user_id: user.uid, user_email: user.email, feedback: user_feedback_text});
        document.getElementById("user_feedback_textarea").value = "";
        alert("Thank you for you feedback. It will be reviewed soon.")
    }
}

/***************
* Friend Request Functions
***************/

/**
* Populates the awaiting friend request list with possible friend requests.
*/
function populate_awaiting_friend_requests() {
    firebase_database.ref('Users_FriendRequests/' + user.uid).once("value", function(db_snapshot) {
        var requests = db_snapshot.val();
        var awaiting_friend_requests_selection_element = document.getElementById('friend_request_list');
        for (var request_id in requests) {
            if (requests.hasOwnProperty(request_id)) {
                var request_option_element = document.createElement("option");
                request_option_element.value = request_id;
                request_option_element.setAttribute("data-id", requests[request_id].id);
                request_option_element.setAttribute("data-email", requests[request_id].email);
                request_option_element.text = requests[request_id].email;
                awaiting_friend_requests_selection_element.add(request_option_element);
            }
        }

        if (isValueSet(requests)) {
            document.getElementById('friend_request_no_requests_placeholder').classList.add('hide');
        } else {
            document.getElementById('friend_request_list_container').classList.add('hide');
            document.getElementById('friend_request_controls_container').classList.add('hide');
        }
    });
}

/**
* Shows the friend request pop-up dialog window
*/
function show_friend_request_dialog() {
    document.getElementById('friend_request_pop_up_background').style.display = "block";
}

/**
* When the user clicks anywhere outside of the dialog/pop-up, close it (make it disappear)
*/
function hide_friend_request_dialog(event) {
    var modal = document.getElementById('friend_request_pop_up_background');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

/**
* Accepts the friend request of the currently selected "option" in the selction box
*/
function accept_friend_request() {
    handle_friend_request_accept_or_decline(true);
}

/**
* Declines the friend request of the currently selected "option" in the selction box
*/
function decline_friend_request() {
    handle_friend_request_accept_or_decline(false);
}

/**
* Accepts the friend request of the currently selected "option" in the selction box
*/
function handle_friend_request_accept_or_decline(is_accepted) {
    var awaiting_friend_requests_selection_element = document.getElementById('friend_request_list');
    var selected_request  = awaiting_friend_requests_selection_element.options[awaiting_friend_requests_selection_element.selectedIndex];
    var request_id = selected_request.value;
    var friend_id = selected_request.getAttribute('data-id');
    var friend_email = selected_request.getAttribute('data-email');

    // Remove the friend request from the database
    firebase_database.ref('Users_FriendRequests/' + user.uid + "/" + request_id).remove();

    if (is_accepted) {
        // Add the friend record for the friend
        create_friend_record(friend_id, user.uid, user.email);

        // Add the friend record for the user
        create_friend_record(user.uid, friend_id, friend_email);
    }

    // Remove the request from the selection list
    awaiting_friend_requests_selection_element.removeChild(selected_request);
}

/**
*
*/
function create_friend_record(user_id, friend_id, friend_email) {
    var db_users_friends_ref = firebase_database.ref('Users_Friends/' + user_id);
    var new_friend_record_ref = db_users_friends_ref.push();
    var friend_object = { id: friend_id, email: friend_email};
    new_friend_record_ref.set(friend_object);
}


/**
*
*/
function send_friend_request() {
    // Get the email from the input field
    var email = document.getElementById('send_friend_request_input').value;

    if (isValueSet(email)) {
        // Query the database for user with the email and set up the callback
        firebase_database.ref('Users').orderByChild("email").equalTo(email).once("value", function(db_snapshot) {
            if (isValueSet(db_snapshot)) {
                var users = db_snapshot.val();
                var friend_id = "";
                var friend_email = "";
                for (var user_id in users) {
                    if (users.hasOwnProperty(user_id) && (users[user_id]).email == email) {
                        friend_id = user_id;
                        friend_email = (users[user_id]).email;
                        break;
                    }
                }

                // Check if a friend request isn't already there
                firebase_database.ref('Users_FriendRequests/' + friend_id).once("value", function(db_requests_snapshot) {
                    var is_already_requested = false;
                    var requests = db_requests_snapshot.val();
                    for (var request_id in requests) {
                        if (requests.hasOwnProperty(request_id) && requests[request_id].email == email) {
                            is_already_requested = true;
                            alert("You've already sent a request to: " + friend_email);
                            break;
                        }
                    }

                    if (!is_already_requested) {
                        // Create a new request for that user
                        var new_friend_request_record_ref = firebase_database.ref('Users_FriendRequests/' + friend_id).push();
                        var friend_request_object = {id: user.uid, email: user.email};
                        new_friend_request_record_ref.set(friend_request_object);
                        alert("Friend request sent to: " + friend_email);
                    }
                });
            }
        });
    }

    // Clear the field
    document.getElementById('send_friend_request_input').value = "";
}



/***************
* Meal Sharing Functions
***************/

/**
* Populates the awaiting meal shares list with possible shared meals from friends.
*/
function populate_awaiting_meal_shares() {
    firebase_database.ref('Users_MealShares/' + user.uid).once("value", function(db_snapshot) {
        var meal_shares = db_snapshot.val();
        var awaiting_meal_share_selection_element = document.getElementById('awaiting_meal_shares_list');
        for (var meal_share_id in meal_shares) {
            if (meal_shares.hasOwnProperty(meal_share_id)) {
                var meal_share_option_element = document.createElement("option");
                meal_share_option_element.value = meal_share_id;
                meal_share_option_element.setAttribute("data-friend-id", meal_shares[meal_share_id].friend_id);
                meal_share_option_element.setAttribute("data-friend-email", meal_shares[meal_share_id].friend_email);
                meal_share_option_element.setAttribute("data-meal-name", meal_shares[meal_share_id].meal_name);
                meal_share_option_element.setAttribute("data-meal-database-path", meal_shares[meal_share_id].meal_path);
                meal_share_option_element.text = meal_shares[meal_share_id].meal_name + " From: " + meal_shares[meal_share_id].friend_email;
                awaiting_meal_share_selection_element.add(meal_share_option_element);
            }
        }

        if (isValueSet(meal_shares)) {
            document.getElementById('no_awaiting_meal_shares_placeholder').classList.add('hide');
            awaiting_meal_share_selection_element.selectedIndex = 0;
        } else {
            document.getElementById('awaiting_meal_shares_list_container').classList.add('hide');
            document.getElementById('awaiting_meal_shares_controls_container').classList.add('hide');
        }
    });
}

/**
* Populates the friend list in the pop-up that the user can share meals with
*/
function populate_friend_list() {
    firebase_database.ref('Users_Friends/' + user.uid).once("value", function(db_snapshot) {
        var friends = db_snapshot.val();
        var friend_selection_element = document.getElementById('share_meal_with_friend_list');
        for (var friend_record_id in friends) {
            if (friends.hasOwnProperty(friend_record_id)) {
                var friend_option_element = document.createElement("option");
                friend_option_element.value = friend_record_id;
                friend_option_element.setAttribute("data-friend-id", friends[friend_record_id].id);
                friend_option_element.setAttribute("data-friend-email", friends[friend_record_id].email);
                friend_option_element.text = friends[friend_record_id].email;
                friend_selection_element.add(friend_option_element);
            }
        }

        // Handle if the user has friends or not.
        var share_button = document.getElementById("share_meal_with_friend_button");
        if (isValueSet(friends)) {
            //
            friend_selection_element.selectedIndex = 0;
            share_button.disabled = false;
        } else {
            share_button.disabled = true;
        }
    });
}

/**
* Shows the friend request pop-up dialog window
*/
function show_meal_share_dialog() {
    document.getElementById('share_meal_pop_up_background').style.display = "block";
}

/**
*
*/
function hide_meal_share_dialog() {
    var modal = document.getElementById('share_meal_pop_up_background');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

/**
*
*/
function accept_meal_share() {
    handle_meal_share_accept_or_decline(true);
}

/**
*
*/
function decline_meal_share() {
    handle_meal_share_accept_or_decline(false);
}

/**
* Accepts the friend request of the currently selected "option" in the selction box
*/
function handle_meal_share_accept_or_decline(is_accepted) {
    var awaiting_meal_shares_selection_element = document.getElementById('awaiting_meal_shares_list');
    var selected_meal_share  = awaiting_meal_shares_selection_element.options[awaiting_meal_shares_selection_element.selectedIndex];
    var meal_share_id = selected_meal_share.value;
    var meal_name = selected_meal_share.getAttribute('data-meal-name');
    var meal_database_path = selected_meal_share.getAttribute('data-meal-database-path');
    var friend_id = selected_meal_share.getAttribute('data-friend-id');
    var friend_email = selected_meal_share.getAttribute('data-friend-email');

    if (is_accepted) {
        // Get the meal from the friend's meals
        firebase_database.ref(meal_database_path).once("value", function(db_snapshot) {
            // Add the meal to the user's meals
            var new_user_meal_record_ref = firebase_database.ref('Users_Meals/' + user.uid).push();
            new_user_meal_record_ref.set(db_snapshot.val());

            add_meal_list_item_from_db_snapshot(db_snapshot);
        });
    }

    // Remove the friend request from the database
    firebase_database.ref('Users_MealShares/' + user.uid + "/" + meal_share_id).remove();

    // Remove the request from the selection list
    awaiting_meal_shares_selection_element.removeChild(selected_meal_share);
}

/**
*
*/
function share_meal_with_friend() {
    var friends_selection_element = document.getElementById('share_meal_with_friend_list');
    var selected_friend  = friends_selection_element.options[friends_selection_element.selectedIndex];
    var friend_id = selected_friend.getAttribute("data-friend-id");
    var friend_email = selected_friend.getAttribute("data-friend-email");
    var meal_name = current_meal.name;
    var meal_path = "Users_Meals/" + user.uid + "/" + current_meal.id;

    if (confirm("Do you want to share " + current_meal.name + " with " + friend_email + "?")) {
        // Add a meal share record for the friend with the friend_id so that the
        // friend can accept/decline it later.
        var db_users_mealShares_friend_ref = firebase_database.ref('Users_MealShares/' + friend_id);
        var new_mealShares_friend_record_ref = db_users_mealShares_friend_ref.push();
        var meal_share_object = { friend_id: user.uid, friend_email: user.email, meal_name: meal_name, meal_path: meal_path };
        new_mealShares_friend_record_ref.set(meal_share_object);

        alert(current_meal.name + " shared with " + friend_email + ".");
    }
}

/***************
* Image Picking Functions
***************/
function load_and_cache_meal_images() {
    // Load user images
    firebase.database().ref("Users_Images/" + user.uid).on("value", function(snapshot) {
        var filename_records = snapshot.val()
        var user_storage_reference_path_prefix = "meal_images/user_images/" + user.uid + "/";
        // Loop through each file record and add the name to the array
        var user_filenames = [];
        for (var id in filename_records) {
            if (filename_records.hasOwnProperty(id)) {
                user_filenames.push(filename_records[id].filename);
            }
        }
        if (user_filenames.length > 0) {
            document.getElementById("image_category_list_item_my_images").innerHTML = "My Images (" + user_filenames.length + ")";
            populate_cache(user_meal_images_url_cache, user_filenames, 0, user_storage_reference_path_prefix);
        }
    })

    // Load default images
    firebase.database().ref("DefaultMealImages").on("value", function(snapshot) {
        var filename_records = snapshot.val()
        var default_storage_reference_path_prefix = "meal_images/default_images/";
        // Loop through each file record and add the name to the array
        var default_filenames = []
        for (var id in filename_records) {
            if (filename_records.hasOwnProperty(id)) {
                default_filenames.push(filename_records[id]);
            }
        }
        if (default_filenames.length > 0) {
            document.getElementById("image_category_list_item_default_images").innerHTML = "Default Images (" + default_filenames.length + ")";
            populate_cache(default_meal_images_url_cache, default_filenames, 0, default_storage_reference_path_prefix);
        }
    })
}

function populate_cache(cache_object, filenames, index, storage_reference_path_prefix) {
    if (index >= filenames.length) {
        return;
    } else {
        firebase_storage.ref(storage_reference_path_prefix + filenames[index]).getDownloadURL()
            .then(function(url) {
                // add it to the cache
                cache_object[url] = storage_reference_path_prefix + filenames[index];
                // Recursively call the function to not ensure proper indexing
                populate_cache(cache_object, filenames, ++index, storage_reference_path_prefix);
            })
            .catch(function(error) {
                console.log(error.message);
            })
    }
}


/**
* Populates the image picker list with user images
*/
function populate_meal_image_picker_list_with_user_images() {
    toggle_image_category_label_selected(false);
    populate_meal_image_picker_list(user_meal_images_url_cache);
}

/**
* Populates the image picker list with default images
*/
function populate_meal_image_picker_list_with_default_images() {
    toggle_image_category_label_selected(true);
    populate_meal_image_picker_list(default_meal_images_url_cache);
}

function populate_meal_image_picker_list(url_cache) {
    var meal_image_picker_list = document.getElementById('meal_image_picker_list');
    meal_image_picker_list.innerHTML = "";
    for (var url in url_cache) {
        if (url_cache.hasOwnProperty(url)) {
            var list_item = document.createElement("li");
            list_item.classList.add("meal_image_picker_list_item");

            // Setup image_element
            var image_element = document.createElement("img");
            image_element.id = url_cache[url];
            image_element.src = url;
            image_element.classList.add("image_picker_image");
            image_element.onclick = select_meal_image;

            // Append the image an list item
            list_item.appendChild(image_element);

            meal_image_picker_list.appendChild(list_item);
        }
    }
}

function toggle_image_category_label_selected(is_default_selected) {
    var user_images_category_label = document.getElementById("image_category_list_item_my_images");
    var default_images_category_label = document.getElementById("image_category_list_item_default_images");

    if (is_default_selected) {
        user_images_category_label.setAttribute("data-is-selected", true);
        user_images_category_label.classList.remove("image_category_list_item_chosen");
        default_images_category_label.classList.add("image_category_list_item_chosen");
    } else {
        user_images_category_label.setAttribute("data-is-selected", false);
        user_images_category_label.classList.add("image_category_list_item_chosen");
        default_images_category_label.classList.remove("image_category_list_item_chosen");
    }

    // update the number of images in the label
    user_images_category_label.innerHTML = "My Images (" + objectElementCount(user_images_category_label) + ")";
    default_images_category_label.innerHTML = "Default Images (" + objectElementCount(default_meal_images_url_cache) + ")";
}

function add_image_to_user_meal_image_picker_list(url) {
    var is_user_images_selected = document.getElementById("image_category_list_item_my_images").getAttribute("data-is-selected");

    // Ensure the user images are being currenlty viewed
    if (is_user_images_selected) {
        var meal_image_picker_list = document.getElementById('meal_image_picker_list');

        // Check to see if the images was already loaded in (asynchronously)
        var already_has_image = false;
        for (var i = 0; i < meal_image_picker_list.children.length; i++) {
            if (meal_image_picker_list.children[i].src = url) {
                already_has_image = true;
                break;
            }
        }

        // If not there, add it
        if (!already_has_image) {
            var list_item = document.createElement("li");
            list_item.classList.add("meal_image_picker_list_item");

            // Setup image_element
            var image_element = document.createElement("img");
            image_element.id = url_cache[url];
            image_element.src = url;
            image_element.classList.add("image_picker_image");
            image_element.onclick = select_meal_image;

            // Append elements (proper nesting)
            list_item.appendChild(image_element);
            meal_image_picker_list.appendChild(list_item);
        }
    }
}

/**
* Shows the friend request pop-up dialog window
*/
function show_meal_image_picker_dialog() {
    if (!isEmpty(user_meal_images_url_cache)) {
        populate_meal_image_picker_list_with_user_images();
    } else {
        populate_meal_image_picker_list_with_default_images();
    }
    document.getElementById('meal_image_picker_pop_up_background').style.display = "block";
}

/**
*
*/
function hide_meal_image_picker_dialog() {
    var modal = document.getElementById('meal_image_picker_pop_up_background');
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

function select_meal_image(event) {
    var meal_image_picker_list = document.getElementById('meal_image_picker_list');
    var previous_image_id = meal_image_picker_list.getAttribute("data-current-image-id");
    var previous_selected_image = document.getElementById(previous_image_id);
    var currently_selected_image = document.getElementById(event.target.id);

    // Deselect the previous_selected_image
    if (isValueSet(previous_selected_image)) {
        previous_selected_image.classList.remove("selected_image");
    }

    // Select the currently selected image
    currently_selected_image.classList.add("selected_image");

    meal_image_picker_list.setAttribute("data-current-image-id", currently_selected_image.id);
}

function setup_meal_image_file_uploader_change_actions() {
    var meal_image_upload_element = document.getElementById('meal_image_upload');
    var meal_image_upload_label_element = document.getElementById('meal_image_upload_label');
	meal_image_upload_element.addEventListener('change', function(event) {
		var fileName = '';

		if(this.files && this.files.length > 1) {
            fileName = (this.getAttribute('data-multiple-caption') || '').replace( '{count}', this.files.length );
        } else if (this.files && this.files.length == 1) {
            fileName = event.target.value.split( '\\' ).pop();
        } else {
            fileName = "Choose an Image"
        }

		meal_image_upload_label_element.innerHTML = fileName;
	});
}

function on_upload_images_button_click() {
    // Get the files
    var files = document.getElementById('meal_image_upload').files;

    if (files.length > 0) {
        // show the progress bar
        document.getElementById('meal_upload_progress').classList.remove("hide");

        // Upload the images using recursion
        upload_images_from_files(files, 0);
    }
}

function upload_images_from_files(files, index) {

    if (index >= files.length) {
        var progress_bar = document.getElementById('meal_upload_progress');
        var progress_label = document.getElementById('meal_upload_progress_label');
        progress_bar.value = 0;
        progress_bar.classList.add("hide");
        progress_label.classList.add("hide");
        return;
    } else {
        var progress_bar = document.getElementById('meal_upload_progress');
        var progress_label = document.getElementById('meal_upload_progress_label');

        // Make a storage reference
        var image_path = 'meal_images/user_images/' + user.uid + "/" + files[index].name;
        var storage_ref = firebase_storage.ref(image_path);

        // Upload the image
        var upload_task = storage_ref.put(files[index]);

        // Update the progress bar
        upload_task.on("state_changed",
            function handl_progress(snapshot) {
                var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progress_bar.value = percentage;
                progress_label.innerHTML = "Downloading " + (index + 1) + " out of " + files.length;
                progress_label.classList.remove("hide");
            },
            function handle_errors(error) {
                console.log("ERROR: " + error.message);
            },
            function handle_completion() {
                // Make a new database record for the uploaded file
                var new_user_image_record_ref = firebase_database.ref('Users_Images/' + user.uid).push();
                new_user_image_record_ref.set({filename: files[index].name});

                // Get image download url and ddd url to the cache
                var storage_path = "meal_images/user_images/" + user.uid + "/" + files[index].name;
                firebase_storage.ref(storage_path).getDownloadURL()
                    .then(function(url) {
                        user_meal_images_url_cache[url] = storage_path;
                        populate_meal_image_picker_list_with_user_images();
                    })

                // Recursively upload
                upload_images_from_files(files, ++index);
            }
        );
    }
}

/**
*
*/
function confirm_meal_image_pick() {
    var image_path = document.getElementById('meal_image_picker_list').getAttribute("data-current-image-id");
    document.getElementById('meal_image_input').value = image_path;
    document.getElementById('meal_image_picker_pop_up_background').style.display = "none";
}

/*****************************************
    Support Functions
*****************************************/

function isEmpty(object) {
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

function objectElementCount(object) {
    var count = 0;
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            count++;
        }
    }
    return count;
}

function isValueSet(value) {
    return value != null && value != undefined && value != "";
}

function copy_meal(meal) {
    var ingredients = {};
    for (var ingredient in meal.ingredients) {
        if (meal.ingredients.hasOwnProperty(ingredient)) {
            ingredients[ingredient] = ingredient;
        }
    }
    result = { "id": meal.id, "name": meal.name, "image_path": meal.image_path, "ingredients": ingredients, "recipe": meal.recipe, "is_calendar_meal": meal.is_calendar_meal};
    return result;
}
