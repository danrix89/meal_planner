
$(document).ready(function () {

    /************************************************************************************************************************************************************************************
    *************************************************************************************************************************************************************************************
    * Initial Page Setup
    *************************************************************************************************************************************************************************************
    ************************************************************************************************************************************************************************************/
    var todays_date = new Date();
    var calendar_date = todays_date;
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
//    var current_meal = [];
//    current_meal = meals[0];
    

    // Set the month title with todays date
    $("#month_title").text(formatted_date(calendar_date));







    /************************************************************************************************************************************************************************************
    *************************************************************************************************************************************************************************************
    * Functions
    *************************************************************************************************************************************************************************************
    ************************************************************************************************************************************************************************************/

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




    // Drag & Drop

    /**********************************
    * Drag
    * 
    **********************************/
    document.drag = function(ev) {
        ev.dataTransfer.setData("text", ev.target.id);
    }

    /**********************************
    * Allow_drop
    * 
    **********************************/
    document.allow_drop = function (ev)
    {
        ev.preventDefault();
    }


    /**********************************
   * Drop
   * 
   **********************************/
    document.drop = function(ev)
    {
        ev.preventDefault();
        var data = ev.dataTransfer.getData("text"); 
        var parent_element = document.getElementById(data).parentElement;
        
        // If the parent element is a meal list item, copy the data over...
        if (parent_element.className.includes("flex-meal-item"))
        {
            var node_copy = document.getElementById(data).cloneNode(true);
            var new_id = data + "_new";
            var element_count = $('[id^=' + new_id + ']').length;
            new_id += (element_count + 1).toString();
            node_copy.id = new_id;
            ev.target.appendChild(node_copy);
        }
        else // ... Else, the data should be transfered/moved
        {
            var element = document.getElementById(data);
            ev.target.appendChild(element);

        }

    }

    /**********************************
   * ON LOAD
   * This function will run all the functions necessary to run when the page is initially loaded.
   **********************************/
    window.onload = function ()
    {
        // Populate the meal list with meals
        populate_meals();
        populate_calendar_days();
        set_initial_meal_editor_data();
    };

    function populate_meals()
    {
        var meal_list_item = '';
        for (var i = 0; i < meals.length; i++)
        {
            meal_list_item += '<li class="flex-meal-item"><img id="drag_' + meals[i].id + '" src="' + meals[i].image_url + '" draggable="true" ondragstart="drag(event)"><div class="meal_name">' + meals[i].name + '</div></li>';
            document.getElementById('meal_unordered_list').innerHTML = meal_list_item;
        }
    }

    function set_initial_meal_editor_data()
    {
        // Set the meal name input field
        document.getElementById('meal_name_input').value = meals[0].name;
        // Set the meal ingredients list
        var ingredients = '';
        for (var i = 0; i < meals[0].ingredients.length; i++)
        {
            ingredients += '<li class="flex-ingredient-item"><div class="ingredient" id="ingredient_' + i + '">' + meals[0].ingredients[i] + '</div><div class="remove_ingredient_button" id="button_1">x</div></li>';
            document.getElementById('ingredients_unordered_list').innerHTML = ingredients;
        }
        // Set the meal instructions text area
        document.getElementById('recipe_text_area').value = meals[0].recipe;
    }

    function set_meal_editor_data(meal_id)
    {
        document.getElementById('');

        var ingredients = '';
        var current_meal = {};

        for (var i = 0; i < meals.length; i++)
        {
            if (meals[i].id == (i+1))
            {
                current_meal = meals[i];
            }
        }

        for (var i = 0; i < current_meal.ingredients.length; i++) {
            ingredients += '<li class="flex-ingredient-item"><div class="ingredient" id="ingredient_' + i + '">' + current_meal.ingredients[i] + '</div><div class="remove_ingredient_button" id="button_1" onclick="remove_ingredient(ingredient)">x</div></li>';
            document.getElementById('ingredients_unordered_list').innerHTML = ingredients;
        }
    }

    function remove_ingredient(ingredient)
    {
        ;
    }

    function populate_calendar_days()
    {
        //                     <li class="flex_calendar_body_item"><div id="calendar_day_div_1" ondrop="drop(event)" ondragover="allow_drop(event)"></div></li>
        var calendar_day_squares = '';
        var number_of_days = daysInMonth(calendar_date.getMonth(), calendar_date.getFullYear());
        for (var i = 0; i < 35; i++) 
        {
            calendar_day_squares += '<li class="flex_calendar_body_item"><div id="calendar_day_div_' + i + '" ondrop="drop(event)" ondragover="allow_drop(event)"></div></li>';
            document.getElementById('calendar').innerHTML = calendar_day_squares;
        }
    }

    function daysInMonth(month,year) 
    {
        return new Date(year, month, 0).getDate();
    }

    /**********************************************************************
     * Computes and returns the offset for the first day of a given month year.
    ***********************************************************************/
    function computeOffset(month, year)
    {
        var numDays = 0;
        for (var yearCount = 1753; yearCount <= year; yearCount++)
        {
            if (yearCount == year)
            {
                for (var i = 1; i < month; i++)
                {
                    numDays = numDays + computeNumDays(i, year);
                }
            }
            else
                // If not at the end, add another years worth of days
            {
                if (isLeapYear(yearCount))
                    numDays = numDays + 366;
                else
                    numDays = numDays + 365;
            }
        }
        var offset = numDays % 7;
        return offset;
    }

    /**********************************************************************
     * Is a given year a technical leap year?
     * For more information on what qualifies as a leap year visit:
     * www.timeanddate.com/date/leapyear.html
    ***********************************************************************/
    function isLeapYear(year)
    {
       var result = false;
        // If it's divisible by 4 it might be a leap year
        if ((year % 4) == 0)
        {
            // If it's divisible by 100 it might NOT be a leap year...
            if ((year % 100) == 0)
            {
                // ...unless it's also divisible by 400
                if ((year % 400) == 0)
                {
                    result = true;
                }
            }
                // If it's divisible by 4 and not divisible by 100
            else
            {
                result = true;
            }
        }
        return result;
    }

    /************************************************************************************************************************************************************************************
    *************************************************************************************************************************************************************************************
    * Global Constants
    *************************************************************************************************************************************************************************************
    ************************************************************************************************************************************************************************************/

    // Hard coded meals
    var meals = [
          {
              "id": "1",
              "name": "Soup",
              "image_url": "images\\soup.jpg", // https://sites.psu.edu/siowfa15/2015/10/06/does-chicken-soup-actually-help-colds/
              "ingredients": [ "Chicken", "Broth", "Carrots", "Celary", "Noodles" ],
              "recipe": "Yay these are the ingredients!"
          },
          {
              "id": "2",
              "name": "Pizza",
              "image_url": "images\\pizza.jpg", // http://kingrichiespizza.com/
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "3",
              "name": "Pasta Primavera",
              "image_url": "images\\pasta_primavera.jpg", // http://www.foodnetwork.com/recipes/giada-de-laurentiis/pasta-primavera-recipe.html
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "4",
              "name": "BBQ Pork Sandwiches",
              "image_url": "images\\bbq_pork_sandwich.jpg", // http://www.foodnetwork.com/recipes/paula-deen/bbq-pork-sandwich-recipe.html
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "5",
              "name": "Potpie",
              "image_url": "images\\potpie.jpg", // http://www.pillsbury.com/recipes/classic-chicken-pot-pie/1401d418-ac0b-4b50-ad09-c6f1243fb992
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "6",
              "name": "Taco Salad",
              "image_url": "images\\taco_salad.jpg", // https://www.babble.com/best-recipes/perfectly-baked-tortilla-bowl/
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "7",
              "name": "Left-Overs",
              "image_url": "images\\leftovers.jpg", // http://www.bonappetit.com/test-kitchen/primers/article/thanksgiving-leftovers-guide
              "ingredients": [
                {
                    "ingredient_1": "Whatever is in the fridge",
                }],
              "recipe": "Pull it out and microwave it"
          },
          {
              "id": "8",
              "name": "Fettuccine Alfredo",
              "image_url": "images\\fettuccine_alfredo.jpg", //http://www.daringgourmet.com/2015/12/01/fettuccine-alfredo/
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "9",
              "name": "Mac & Cheese",
              "image_url": "images\\mac_and_cheese.jpg", // http://www.eater.com/forums/new-york/2014/10/9/6952397/who-has-the-best-mac-and-cheese-in-the-city
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "10",
              "name": "Teriyaki Chicken",
              "image_url": "images\\teriyaki_chicken.jpg", // http://www.soberjulie.com/2016/03/chicken-teriyaki-bowl-recipe/
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "11",
              "name": "Baked Ziti",
              "image_url": "images\\baked_ziti.jpg", // http://www.melskitchencafe.com/classic-baked-ziti/
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "12",
              "name": "Pigs in a Blanket",
              "image_url": "images\\pigs_in_a_blanket.jpg", // http://lovinfromtheoven.blogspot.com/2010/10/pigs-in-blanket.html
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "13",
              "name": "Ceasar Salad",
              "image_url": "images\\ceasar_salad.jpg", // http://www.pastryartbakerycafe.com/meal/caesar-salad/
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "14",
              "name": "Wraps",
              "image_url": "images\\wraps.jpg", // http://www.foodnetwork.com/recipes/jeff-mauro/grilled-chicken-caesar-wrap-recipe.html
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "15",
              "name": "Hawaiian Haystacks",
              "image_url": "images\\haystacks.jpg", // http://www.chrislovesjulia.com/2012/10/halloween-haystacks-and-egging.html
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "16",
              "name": "Baked Potato",
              "image_url": "images\\baked_potato.jpg", // http://www.recipeshubs.com/loaded-baked-potatoes/25931
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "17",
              "name": "Shrimp Scampy",
              "image_url": "images\\shrimp_scampi.jpg", // http://www.seriouseats.com/2014/09/how-to-make-the-best-shrimp-scampi.html
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "18",
              "name": "Clam Chowder",
              "image_url": "images\\clam_chowder.jpg", // http://jeffreyseafood.com/products/76571-clam-chowder-fresh-baked-clam-chowder-from-the-special-recipe-from-san-francisco
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "19",
              "name": "Burgers",
              "image_url": "images\\burgers.jpg", // http://miami.eat24hours.com/burgers
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "20",
              "name": "Fish n' Chips",
              "image_url": "images\\fish_n_chips.jpg", // http://www.keyword-suggestions.com/ZmlzaCBhbmQgIGNoaXBz/
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "21",
              "name": "Steak",
              "image_url": "images\\steak.jpg", // http://ingredientsnetwork.com/scientists-create-steak-from-vegetables-news037723.html
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "22",
              "name": "spaghetti",
              "image_url": "images\\spaghetti.jpg", // http://tiger.towson.edu/~awiggi4/recipe.html
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "23",
              "name": "Biscuits and Gravy",
              "image_url": "images\\biscuits_and_gravy.jpg", // http://www.recipeshubs.com/biscuits-and-gravy/37591
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "24",
              "name": "Beans and Rice",
              "image_url": "images\\beans_and_rice.jpg", // http://www.thebittenword.com/thebittenword/2010/02/cajun-red-beans-and-rice.html
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "25",
              "name": "lasagna",
              "image_url": "images\\lasagna.jpg", // http://www.huffingtonpost.com/2014/10/07/lasagna-recipes-easy-chicken_n_1249660.html
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "26",
              "name": "Stuffed Bell Peppers",
              "image_url": "images\\stuffed_bell_peppers.jpg", // http://sweetpeaskitchen.com/2010/08/stuffed-bell-peppers/
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "27",
              "name": "Grilled Cheese",
              "image_url": "images\\grilled_cheese.jpg", // https://www.timeout.com/chicago/restaurants/the-best-grilled-cheese-sandwiches-in-chicago
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "28",
              "name": "Enchiladas",
              "image_url": "images\\enchiladas.jpg", // http://www.deecuisine.com/2014/07/semi-homemade-enchiladas-with-imusa-mccormick.html
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "29",
              "name": "Chicken",
              "image_url": "images\\chicken.jpg", // http://www.keyword-suggestions.com/Y2hpY2tlbiBkaW5uZXI/
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          },
          {
              "id": "30",
              "name": "Dine-Out",
              "image_url": "images\\dine_out.jpg", // http://www.keyword-suggestions.com/ZGluZXI/
              "ingredients": [
                {
                    "ingredient_1": "chicken",
                    "ingredient_2": "noodles",
                    "ingredient_3": "broth",
                    "ingredient_4": "carrots",
                    "ingredient_5": "celary"
                }],
              "recipe": "These are the instructions..."
          }
    ];


});

