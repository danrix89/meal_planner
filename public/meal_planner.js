
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
    document.getElementById('log_out_button').onclick = logout;

    // Calendar controls
    setup_calendar_title_and_nav_buttons();

    // Meal List controls
    document.getElementById('add_button').onclick = setup_for_adding_new_meal;

    // Editor controls
    document.getElementById("edit_button_div").onclick = edit_current_meal;
    document.getElementById("confirm_button_div").onclick = confirm_changes;
    document.getElementById("cancel_button_div").onclick = cancel_changes;
    document.getElementById("confirm_button_div").classList.add("hide");
    document.getElementById("cancel_button_div").classList.add("hide");
    document.getElementById('meal_name_input').readOnly = true;
    document.getElementById('recipe_text_area').readOnly = true;
    document.getElementById('meal_ingredient_input').value = '';
    document.getElementById('meal_ingredient_input').parentElement.style.visibility = "hidden";
    document.getElementById('ingredient_add_button').parentElement.style.visibility = "hidden";

}

/**
* INITIALIZE_MEAL_PLANNER_APP
* Initializes the app (after a successful log in) with controls, fields, data, etc.
*/
function initialize_meal_planner_app() {
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
    highlight_current_meal(meals[0].id, true);

    // Populate the app interface with data
    populate_meal_list();
    populate_meal_editor(current_meal);
    hide_edit_mode_controls();

    // This will also populate the calendar with any planned meals
    populate_calendar_days();
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
    var test_mode = false;
    if (test_mode) {
        ////////////////////////////////////////////////////////////////////////
        //////////////////////////// TEST LOG IN ///////////////////////////////
        ////////////////////////////////////////////////////////////////////////
        user = {};
        user.uid = "ontlsfCfjpaHDnu5tpr0533Wvuo1";
        initialize_meal_planner_app();
        document.getElementById("sign_in_page").setAttribute("class", "hide");
        document.getElementById("main_box").classList.remove("hide");
        ////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////
    } else {
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
    document.getElementById("month_title").innerHTML = current_calendar_date;

    // TODO: Set the current_plannedMonth from the database?

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
    get_meal_plan_for_current_month();
}

/**
*
*/
function get_meal_plan_for_current_month() {
    var db_users_plannedMonths_ref = firebase_database.ref('Users_PlannedMonths/' + user.uid);
    db_users_plannedMonths_ref.orderByChild("formatted_date").equalTo(formatted_date(calendar_date)).once("value", function(db_snapshot) {
        for (var plannedMonth_id in db_snapshot.val()) {
            if (db_snapshot.val().hasOwnProperty(plannedMonth_id) && (formatted_date(calendar_date) == (db_snapshot.val()[plannedMonth_id]).formatted_date)) {
                current_plannedMonth = { id: plannedMonth_id, formatted_date: (db_snapshot.val()[plannedMonth_id]).formatted_date };
                var db_plannedMonths_mealPlans_ref = firebase_database.ref('PlannedMonths_MealPlans/' + plannedMonth_id);
                db_plannedMonths_mealPlans_ref.orderByChild("day").once("value", function(db_mealPlans_snapshot) {
                    populate_calendar_with_mealPlans_snapshot(db_mealPlans_snapshot.val());
                });
                break;
            }
        }
    });
}

/**
*
*/
function populate_calendar_with_mealPlans_snapshot(meal_plans_snapshot) {

    for (var mealPlan_id in meal_plans_snapshot) {
        if (meal_plans_snapshot.hasOwnProperty(mealPlan_id)) {
            var meal_plan_object = meal_plans_snapshot[mealPlan_id];
            add_meal_element_to_calendar(mealPlan_id, meal_plan_object.image_path, meal_plan_object.day);
        }
    }
}

/**
*
*/
function add_meal_element_to_calendar(id, image_path, day) {

    var image_element = document.createElement("img");
    image_element.id = 'drag_' + id + '_calendar';
    image_element.setAttribute('draggable', 'true');
    image_element.setAttribute('ondragstart', 'drag_meal(event)');
    image_element.setAttribute('data-meal-id', id);
    image_element.onclick = (function(a_id) { return function() { select_meal_in_calendar(a_id); } })(id);
    set_image_src(firebase_storage.ref().child(image_path), image_element);

    var calendar_day_element = document.getElementById('calendar_day_div_' + day);
    calendar_day_element.appendChild(image_element);
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
        var meal_object = db_snapshot.val();
        meal_object.day = day;
        new_mealPlan_record_ref.set(meal_object);

        // Create a new meal calendar day element
        add_meal_element_to_calendar(new_mealPlan_record_ref.key, meal_object.image_path, day);
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

    var day = event.target.getAttribute("data-day");

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

            if (already_existing_plannedMonth_id != null) {
                // If so, then add the new meal to that month
                add_new_meal_to_meal_plan(day, meal_id, already_existing_plannedMonth_id);
                current_plannedMonth = { id: plannedMonth_id, formatted_date: (snapshot.val()[plannedMonth_id]).formatted_date };
            } else {
                // If not, then create a new plannedMonth and add the meal to that planned month
                var new_plannedMonths_record_ref = db_users_plannedMonths_ref.push();
                var plannedMonth_object = {formatted_date: formatted_date(calendar_date)};
                new_plannedMonths_record_ref.set(plannedMonth_object);
                add_new_meal_to_meal_plan(day, meal_id, new_plannedMonths_record_ref.key);
                current_plannedMonth = { id: new_plannedMonths_record_ref.uid, formatted_date: formatted_date(calendar_date) };
            }
        }, function (errorObject) {
          console.log("The read failed: " + errorObject.code);
          console.log("The read failed: " + errorObject.message);
        });
    }
    // Else, the data should be transfered/moved
    else
    {
        // Copy the image over with onclick functionality
        var element = document.getElementById(data);
        var target_parent = event.target.parentElement;
        var target_day = target_parent.getAttribute("data-day");
        var image_path = element.getAttribute("src");
        var source_day = document.getElementById(data).parentElement.getAttribute("data-day"); // Get a copy of the source parent's data-day attribtute

        // Update the "day" in the database record

        // If the user is overwriting a day, delete the one that's being overwritten
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
    var meal_id = document.getElementById(data).getAttribute("data-meal-id");

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
    var meal_element_to_be_removed = document.getElementById(data);
    var meal_id = meal_element_to_be_removed.getAttribute("data-meal-id");

    // Remove that one item from the calendar in HTML
    meal_element_to_be_removed.parentElement.removeChild(meal_element_to_be_removed);

    // Delete the PlannedMonths_MealPlans record for that day
    if (current_plannedMonth.id != null && current_plannedMonth.formatted_date == formatted_date(calendar_date)) {
        var mealPlan_record_to_remove = firebase_database.ref("PlannedMonths_MealPlans/" + current_plannedMonth.id + "/" + meal_id);
        mealPlan_record_to_remove.remove();
    } else {
        var db_plannedMonths_mealPlans_ref = firebase_database.ref('PlannedMonths_MealPlans');
        db_plannedMonths_mealPlans_ref.orderByChild("formatted_date").equalTo(formatted_date(calendar_date)).once("value", function(db_snapshot) {
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
                var ingredient_name_element = document.getElementById(ingredient);

                // Setup the ingredient remove button (nested in the ingredient element)
                var ingredient_remove_button = document.createElement("div");
                ingredient_remove_button.classList.add("remove_ingredient_button");
                ingredient_remove_button.id = "ingredient_remove_button_" + ingredient;
                ingredient_remove_button.innerHTML = 'x';
                ingredient_remove_button.setAttribute("onclick", "remove_ingredient('" + ingredient + "')");


            }
        }
    } else {
        for (var ingredient in current_meal.ingredients) {
            if (current_meal.ingredients.hasOwnProperty(ingredient)) {
                // Check if the ingredient list item has a remove button
                var ingredient_remove_button = document.getElementById("ingredient_remove_button_" + ingredient);
                if (ingredient_remove_button != null && ingredient_remove_button != undefined) {
                    // If so, remove the button from the list item element
                    ingredient_remove_button.parentElement.removeChild(ingredient_remove_button);
                }
            }
        }
    }
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
        if ((current_plannedMonth.formatted_date == formatted_date(calendar_date)) && (current_plannedMonth.id != null)) {
            firebase_database.ref('PlannedMonths_MealPlans/' + current_plannedMonth.id + "/" + meal_id).once("value", function(db_snapshot) {
                previous_meal = current_meal;
                var meal_object = { id: meal_id, name: (db_snapshot.val())["name"], recipe: (db_snapshot.val())["recipe"], image_path: (db_snapshot.val())["image_path"], ingredients: (db_snapshot.val())["ingredients"]}
                current_meal = meal_object;

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
            firebase_database.ref('PlannedMonths_MealPlans').orderByChild("formatted_date").equalTo(formatted_date(calendar_date)).once("value", function(db_snapshot) {
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

    setup_input_onkeypress_function();
}

/**
* Add meal list item from db snapshot
* Adds a new meal list element to the meal list using the db snapshot of the newly added meal
*/
function add_meal_list_item_from_db_snapshot(db_snapshot) {
    // Add the meal to the meal list from the snapshot
    add_meal_list_element(db_snapshot.key, (db_snapshot.val())["name"], (db_snapshot.val())["image_path"])

    // Select the newly added meal (this should populate the meal editor)
    select_meal_in_meal_list(db_snapshot.key)
}

/**
* Updates meal list item from db snapshot
* Updates meal list element in the meal list using the db snapshot of the edited meal
*/
function update_meal_list_item_with_changes_from_db_snapshot(db_snapshot) {
    // Update the meal list item to reflect what's in the database
    var id = db_snapshot.key;
    // var meal_list_element = document.getElementById("meal_list_item_" + db_snapshot.key);

    set_image_src(firebase_storage.ref().child((db_snapshot.val())["image_path"]), document.getElementById("drag_" + id));
    document.getElementById("meal_list_name_" + id).innerHTML = (db_snapshot.val())["name"];

    // Select the newly edited meal (this should populate the meal editor)
    select_meal_in_meal_list(id)
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
        current_meal.ingredients[ingredient] = ingredient;
        document.getElementById('meal_ingredient_input').value = '';
        populate_meal_editor(current_meal);
    }
}

function show_edit_mode_controls() {
    document.getElementById('edit_button_div').classList.add("hide");
    document.getElementById('meal_name_input').readOnly = false;
    document.getElementById('recipe_text_area').readOnly = false;
    document.getElementById('meal_ingredient_input').value = '';
    document.getElementById('meal_ingredient_input').parentElement.style.visibility = "visible";
    document.getElementById('ingredient_add_button').parentElement.style.visibility = "visible";
    document.getElementById('cancel_button_div').classList.remove("hide");
    document.getElementById('confirm_button_div').classList.remove("hide");
    show_hide_ingredeint_remove_buttons(true);
}

function hide_edit_mode_controls() {
    document.getElementById('edit_button_div').classList.remove("hide");
    document.getElementById('meal_name_input').readOnly = true;
    document.getElementById('recipe_text_area').readOnly = true;
    document.getElementById('meal_ingredient_input').value = '';
    document.getElementById('meal_ingredient_input').parentElement.style.visibility = "hidden";
    document.getElementById('ingredient_add_button').parentElement.style.visibility = "hidden";
    document.getElementById('cancel_button_div').classList.add("hide");
    document.getElementById('confirm_button_div').classList.add("hide");
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

    // Show the edit mode controls in the meal editor pane.
    show_edit_mode_controls();

    // Save the current meal before we edit it so we can recover if the user
    // decides to cancel their changes
    meal_before_edit = current_meal;
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

    // If we were adding then set the flag so we know we aren't in adding meal mode
    if (is_adding_new_meal)
    {
        is_adding_new_meal = false;

        // Write user meal to database
        var db_users_meals_ref = firebase_database.ref('Users_Meals/' + user.uid);
        var meal_object = { name: current_meal.name, image_path: "meal_images/default_images/default_image.jpg", recipe: current_meal.recipe, ingredients: current_meal.ingredients };
        var new_users_meals_record_ref = db_users_meals_ref.push();
        new_users_meals_record_ref.set(meal_object);
        current_meal.id = new_users_meals_record_ref.key;

        firebase_database.ref("Users_Meals/" + user.uid + "/" + new_users_meals_record_ref.key).once("value", add_meal_list_item_from_db_snapshot);
    } else {
        if (is_selected_meal_from_meal_list) {
            // Save the changes to the database
            var db_users_meals_meal_ref = firebase_database.ref("Users_Meals/" + user.uid + "/" + current_meal.id);
            var meal_object = { name: current_meal.name, image_path: current_meal.image_path, recipe: current_meal.recipe, ingredients: current_meal.ingredients };
            db_users_meals_meal_ref.set(meal_object);

            // Refresh the meal list with those changes
            db_users_meals_meal_ref.once("value", update_meal_list_item_with_changes_from_db_snapshot);
        } else {
            // Update calendar meal
            update_calendar_meal(current_meal.id);
        }
    }
    hide_edit_mode_controls();
}

/**
*
*/
function update_calendar_meal(id) {
    // Check if current_plannedMonth is the same as the current month...
    if ((current_plannedMonth.formatted_date == formatted_date(calendar_date)) && (current_plannedMonth.id != null && current_plannedMonth.id != undefined)) {
        // Save the changes to the database
        var db_plannedMonths_mealPlans_meal_ref = firebase_database.ref("PlannedMonths_MealPlans/" + current_plannedMonth.id + "/" + id);
        var meal_object = { name: current_meal.name, image_path: current_meal.image_path, recipe: current_meal.recipe, ingredients: current_meal.ingredients };
        db_plannedMonths_mealPlans_meal_ref.set(meal_object);
    } else {
        // If the current_plannedMonth is not this month (or not set), then update in and recall this function (recursion)
        var db_plannedMonths_mealPlans_ref = firebase_database.ref('PlannedMonths_MealPlans');
        firebase_database.ref('PlannedMonths_MealPlans').orderByChild("formatted_date").equalTo(formatted_date(calendar_date)).once("value", function(db_snapshot) {
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
        current_meal = meal_before_edit;
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
*/
function set_current_meal(meal_id)
{
    previous_meal = current_meal;
    for (var i = 0; i < meals.length; i++)
    {
        if (meals[i].id == meal_id) {
            current_meal = meals[i];
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
    // Set the meal name input field and instructions text area
    var meal_instructions_text_area = document.getElementById('recipe_text_area');
    meal_instructions_text_area.value = meal.recipe;
    var meal_name_iput = document.getElementById('meal_name_input');
    meal_name_iput.value = meal.name;

    // Clear the current ingredient list and then populate it with the ingredients
    document.getElementById('ingredients_unordered_list').innerHTML = "";

    for (var ingredient in meal.ingredients) {
        if (meal.ingredients.hasOwnProperty(ingredient)) {
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
            document.getElementById('ingredients_unordered_list').appendChild(ingredient_element);
        }
    }

    // Setup the onclick functionality
    document.getElementById('ingredient_add_button').onclick = add_ingredient;
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
    if (meal_list_element != null && meal_list_element != undefined) {
        meal_list_element.style.border = "0px solid #33afff";
    }

    // TODO: Remove the highlight on the last selected meal in the calendar (if any)


    if (is_being_selected_from_meal_list) {
        // Add the highlight on the meal with meal_id
        meal_list_element = document.getElementById("meal_list_item_" + meal_id);
        meal_list_element.style.border = "3px solid #33afff";
    } else {
        // TODO: Highlight meals selected in the calendar
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
        // Remove the ingredient from the meal in the database
        firebase_database.ref('Users_Meals' + user.uid + '/' + current_meal.id + '/ingredients/' + ingredient).remove();

        // Remove (or delete) the ingredient from the ingredient list of the current meal
        delete current_meal.ingredients[ingredient];
        //current_meal.ingredients.splice(current_meal.ingredients.indexOf(ingredient), 1);

        // Remove the ingredient HTML element
        var ingredient_list_element = document.getElementById('ingredient_' + ingredient).parentElement;
        ingredient_list_element.parentElement.removeChild(ingredient_list_element);
    }
}
