
$(document).ready(function () {

    /************************************************************************************************************************************************************************************
    *************************************************************************************************************************************************************************************
    * Initial Page Setup
    *************************************************************************************************************************************************************************************
    ************************************************************************************************************************************************************************************/

    // Global Variables
    var todays_date = new Date();
    var calendar_date = todays_date;
    var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var previous_meal = {};
    var current_meal = {};
    var is_edit_mode = false;
    var is_adding_new_meal = false;

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
   * Advances and sets month displayed on the calendar using a_value.
   **********************************/
    function advance_month(a_value)
    {
        calendar_date.setMonth(calendar_date.getMonth() + a_value)
        $("#month_title").text(formatted_date(calendar_date));
        populate_calendar_days()
    }

    /**********************************
    * Formatted_date
    * Returns a formatted string version of a_date.
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
   * Drop to garbage
   * 
   **********************************/
    document.drop_to_garbage = function(ev)
    {
        ev.preventDefault();

        var data = ev.dataTransfer.getData("text");
        var element = document.getElementById(data);
        var meal_id = element.getAttribute("data-meal-id");
        if (window.confirm("Are you sure you want to delete this meal?")) {
            meals.splice(meal_id - 1, 1);
            populate_meal_list();
            setup_meal_onclick_function();
        }
    }

    /**********************************
   * ON LOAD
   * This function will run all the functions necessary to run when the page is initially loaded.
   **********************************/
    window.onload = function ()
    {
        populate_meal_list();
        populate_calendar_days();
        set_meal_editor_data(1);
        setup_meal_onclick_function();
    };

    function populate_meal_list()
    {
        var meal_list_item = '';
        for (var i = 0; i < meals.length; i++)
        {
            var id = meals[i].id;
            meal_list_item += '<li class="flex-meal-item" id="meal_list_item_' + id + '"><img id="drag_' + id + '" src="' + meals[i].image_url + '" draggable="true" ondragstart="drag(event)" data-meal-id="' + id + '"><div class="meal_name">' + meals[i].name + '</div></li>';
            document.getElementById('meal_unordered_list').innerHTML = meal_list_item;
        }
        setup_add_meal_onclick_function();
    }

    function setup_meal_onclick_function() {
        for (var i = 0; i < meals.length; i++)
        {
            document.getElementById('drag_' + meals[i].id).onclick = (function (current_i) { return function () { onclick_meal(current_i); } })(meals[i].id);
        }
    }

    function onclick_meal(meal_id)
    {
        set_meal_editor_data(meal_id);
        highlight_current_meal(meal_id);
    }

    function set_meal_editor_data(meal_id)
    {
        // Set the current_meal to the first meal in the meals array
        previous_meal = current_meal;
        for (var i = 0; i < meals.length; i++) 
        {
            if (meals[i].id == meal_id)
                current_meal = meals[i];
        }

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
            document.getElementById('edit_button').src = "images\\controls\\check.png";
        }
        else
        {
            meal_name_iput.readOnly = true;
            meal_instructions_text_area.readOnly = true;
            document.getElementById('edit_button').src = "images\\controls\\pen.png";
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
    }

    function highlight_current_meal(meal_id) {
        // Remove the highlight on the last selected meal
        var element_id = "meal_list_item_" + (previous_meal.id);
        var meal_list_element = document.getElementById(element_id);
        meal_list_element.style.border = "0px solid #33afff";

        // Add the highlight on the meal with meal_id
        element_id = "meal_list_item_" + (meal_id);
        meal_list_element = document.getElementById(element_id);
        meal_list_element.style.border = "3px solid #33afff";
    }

    function setup_add_meal_onclick_function()
    {
        document.getElementById('add_button').onclick = (function (meal_id) { return function () { on_add_meal_buton_click(meal_id); } })(current_meal.id);
    }

    function on_add_meal_buton_click(meal_id)
    {
        if (!is_edit_mode && !is_adding_new_meal)
        {
            is_adding_new_meal = true;
            is_edit_mode = true;
            var latest_meal_id = (parseInt(meals[meals.length - 1].id) + 1);
            var new_meal = { "id": "", "name": "", "image_url": "images' + '\\' + 'default_image.jpg", "ingredients": [], "recipe": "" };
            new_meal.id = latest_meal_id.toString();
            
            current_meal = new_meal;
            meals.push(current_meal);
            set_meal_editor_data(new_meal.id);
            document.getElementById('meal_name_input').focus();
        }
    }

    function setup_ingredient_onclick_function()
    {
        for (var i = 0; i < current_meal.ingredients.length; i++) {
            document.getElementById('button_' + i).onclick = (function (current_i) { return function () { remove_ingredient(current_i); } })(i);
        }
    }

    function remove_ingredient(ingredient_index)
    {
        if (is_edit_mode)
        {
            current_meal.ingredients.splice(ingredient_index, 1);
            set_meal_editor_data(current_meal.id);
        }
    }

    function setup_edit_button_onclick_function()
    {
        document.getElementById('edit_button').onclick = (function (meal_id) { return function () { edit_button_onclick(meal_id); } })(current_meal.id);
    }

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
                populate_meal_list();
            }
        }

        is_edit_mode = !is_edit_mode;
        set_meal_editor_data(meal_id);
    }

    function populate_calendar_days()
    {
        //                     <li class="flex_calendar_body_item"><div id="calendar_day_div_1" ondrop="drop(event)" ondragover="allow_drop(event)"></div></li>
        var calendar_day_squares = '';
        var number_of_days = daysInMonth(calendar_date.getMonth(), calendar_date.getFullYear());
        var day = 1;
        var first_day = first_day_of_month(calendar_date.getFullYear(), calendar_date.getMonth()).getDay();
        for (var i = 0; i < 35; i++) 
        {
            if (i >= first_day && day <= number_of_days)
            {
                if ((first_day == 5 || first_day == 6) && (number_of_days == 31) && (day == 24))
                    calendar_day_squares += '<li class="flex_calendar_body_item_half_day"><div class="half_day" id="calendar_day_div_' + i + '" ondrop="drop(event)" ondragover="allow_drop(event)">' + day + '</div><div class="half_day" id="calendar_day_div_' + i + '" ondrop="drop(event)" ondragover="allow_drop(event)">31</div></li>';
                else if ((first_day == 6) && (number_of_days >= 30) && (day == 23))
                    calendar_day_squares += '<li class="flex_calendar_body_item_half_day"><div class="half_day" id="calendar_day_div_' + i + '" ondrop="drop(event)" ondragover="allow_drop(event)">' + day + ' </div><div class="half_day" id="calendar_day_div_' + i + '" ondrop="drop(event)" ondragover="allow_drop(event)">30</div></li>';
                else
                calendar_day_squares += '<li class="flex_calendar_body_item"><div id="calendar_day_div_' + i + '" ondrop="drop(event)" ondragover="allow_drop(event)">' + day + '</div></li>';

                // Increment the day
                day++;
            }
            else
                calendar_day_squares += '<li class="flex_calendar_body_item"><div id="calendar_day_div_' + i + '" ondrop="drop(event)" ondragover="allow_drop(event)"></div></li>';
        }
        document.getElementById('calendar').innerHTML = calendar_day_squares;
    }

    function first_day_of_month(year, month)
    {
        return new Date(year, month, 1);
    }

    function daysInMonth(month,year) 
    {
        return new Date(year, month + 1, 0).getDate();
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
              "recipe": "Throw ingredients into large pot and let cook for 3 hours until veggies are semi soft."
          },
          {
              "id": "2",
              "name": "Pizza",
              "image_url": "images\\pizza.jpg", // http://kingrichiespizza.com/
              "ingredients": [ "Pizza Dough", "Sauce", "Toppings", "Cheese" ],
              "recipe": "Place dough on pan. spread sauce, sprinkle cheese, add toppings. Bake at 350F for 25 minutes."
          },
          {
              "id": "3",
              "name": "Pasta Primavera",
              "image_url": "images\\pasta_primavera.jpg", // http://www.foodnetwork.com/recipes/giada-de-laurentiis/pasta-primavera-recipe.html
              "ingredients": ["Bow Tie Noodles", "Carrots", "Onion", "Olive Oil", "Speghetti Squash", "Bell Pepper", "Parmesan Cheese" ],
              "recipe": "Cook noodles. Slice all veggies place them on baking sheet. drizzle olive oil over veggies. bake at 350F for 20 minutes. Add cooked veggies to pasta. sprinkle Cheese on top, stir and serve."
          },
          {
              "id": "4",
              "name": "BBQ Pork Sandwiches",
              "image_url": "images\\bbq_pork_sandwich.jpg", // http://www.foodnetwork.com/recipes/paula-deen/bbq-pork-sandwich-recipe.html
              "ingredients": ["Pork Butt", "Can of Root Beer", "BBQ Sauce"],
              "recipe": "Place Pork Butt in crockpot. Pour Root Beer over the pork. Cook on low for 8 hours. Drain the juice. Pull Pork apart add BBQ sauce and serve."
          },
          {
              "id": "5",
              "name": "Potpie",
              "image_url": "images\\potpie.jpg", // http://www.pillsbury.com/recipes/classic-chicken-pot-pie/1401d418-ac0b-4b50-ad09-c6f1243fb992
              "ingredients": ["Chicken", "Frozen Mixed Veggies", "Cream of Mushroom Soup", "Pie Crust"],
              "recipe": "Cook Chicken and cut into cubes. Combine chicken, mixed veggies and cream of mushroom into a bowl. Mix. Place mixture into pie crust. Bake at 425F for 45 minutes."
          },
          {
              "id": "6",
              "name": "Taco Salad",
              "image_url": "images\\taco_salad.jpg", // https://www.babble.com/best-recipes/perfectly-baked-tortilla-bowl/
              "ingredients": ["Black Beans", "Corn", "Mexican Rice", "Bell pepper", "Onion", "Lettuce", "Salsa", "Sour Cream", "Cheese", "Tortillas"],
              "recipe": "Drain black beans and corn. Cook rice. chop up veggies. Bake tortillas at 400f for 10 minutes. Place all ingredients in tortilla bowl and enjoy."
          },
          {
              "id": "7",
              "name": "Left-Overs",
              "image_url": "images\\leftovers.jpg", // http://www.bonappetit.com/test-kitchen/primers/article/thanksgiving-leftovers-guide
              "ingredients": ["INGREDIENT_1", "INGREDIENT_2", "INGREDIENT_3"],
              "recipe": "Pull it out and microwave it"
          },
          {
              "id": "8",
              "name": "Fettuccine Alfredo",
              "image_url": "images\\fettuccine_alfredo.jpg", //http://www.daringgourmet.com/2015/12/01/fettuccine-alfredo/
              "ingredients": ["Chicken", "Fettuccine Noodles", "Alfredo sauce"],
              "recipe": "Place chicken in crock pot pour sauce over. Cook for 4 hours on low. Cook Noodles. Combine chicken, sauce, and noodles together and serve."
          },
          {
              "id": "9",
              "name": "Mac & Cheese",
              "image_url": "images\\mac_and_cheese.jpg", // http://www.eater.com/forums/new-york/2014/10/9/6952397/who-has-the-best-mac-and-cheese-in-the-city
              "ingredients": ["Elbow Noodles", "Milk", "Cheese"],
              "recipe": "Cook Noodles. Combine milk and cheese in pan. Cook until cheese is melted. Mix in cooked noodles and bake for 15 minutes at 350F."
          },
          {
              "id": "10",
              "name": "Teriyaki Chicken",
              "image_url": "images\\teriyaki_chicken.jpg", // http://www.soberjulie.com/2016/03/chicken-teriyaki-bowl-recipe/
              "ingredients": ["Chicken", "Teriyaki sauce", "Chicken Broth", "Brown rice", "Broccoli"],
              "recipe": "Cube Chicken and place in a hot pan. Add teriyaki sauce and chicken broth. Let cook for 15 minutes on simmer. Cook rice. Wash and chop Broccoli. Scoop rice, chicken and broccoli and add to your bowl. enjoy."
          },
          {
              "id": "11",
              "name": "Baked Ziti",
              "image_url": "images\\baked_ziti.jpg", // http://www.melskitchencafe.com/classic-baked-ziti/
              "ingredients": ["Ziti noodles", "Speghetti sauce", "Cheese"],
              "recipe": "Cook noodles. Drain and add sauce. Mix. Spray baking dish. Add half noodle mixture. Sprinkle cheese. Add the rest of the noodles. Sprinkle cheese. Bake at 350F for 15 minutes."
          },
          {
              "id": "12",
              "name": "Pigs in a Blanket",
              "image_url": "images\\pigs_in_a_blanket.jpg", // http://lovinfromtheoven.blogspot.com/2010/10/pigs-in-blanket.html
              "ingredients": ["Hot dogs", "Dough"],
              "recipe": "Place hot dogs in strips of dough. Place on greased baking sheet. Bake for 8 minutes at 400F."
          },
          {
              "id": "13",
              "name": "Ceasar Salad",
              "image_url": "images\\ceasar_salad.jpg", // http://www.pastryartbakerycafe.com/meal/caesar-salad/
              "ingredients": ["Chicken", "Lettuce", "Ceasar salad dressing", "Cheese"],
              "recipe": "Chop lettuce. Combine lettuce, chicken,cheese and dressing togther and enjoy."
          },
          {
              "id": "14",
              "name": "Wraps",
              "image_url": "images\\wraps.jpg", // http://www.foodnetwork.com/recipes/jeff-mauro/grilled-chicken-caesar-wrap-recipe.html
              "ingredients": ["Chicken", "Lettuce", "Tortillas", "Tomatoes"],
              "recipe": "Cook and cube chicken. Chop lettuce and tomatoes. Place all ingredients in a tortilla, roll it up and enojoy."
          },
          {
              "id": "15",
              "name": "Hawaiian Haystacks",
              "image_url": "images\\haystacks.jpg", // http://www.chrislovesjulia.com/2012/10/halloween-haystacks-and-egging.html
              "ingredients": ["Rice", "Pineapple", "Chicken", "Chow mein noodles", "coconut shavings", "Cream of chicken soup"],
              "recipe": "Cook Rice. Place cooked rice on a plate and add the rest of the ingredients on top and enjoy."
          },
          {
              "id": "16",
              "name": "Baked Potato",
              "image_url": "images\\baked_potato.jpg", // http://www.recipeshubs.com/loaded-baked-potatoes/25931
              "ingredients": ["Potatoes", "Butter", "Sour Cream", "Bacon bits", "Cheese" , "Green onions"],
              "recipe": "Bake Potato in oven. Slice open, place butter, sour cream, bacon bits, cheese, and green onions on top and enjoy."
          },
          {
              "id": "17",
              "name": "Shrimp Scampi",
              "image_url": "images\\shrimp_scampi.jpg", // http://www.seriouseats.com/2014/09/how-to-make-the-best-shrimp-scampi.html
              "ingredients": ["Jumbo Shrimp", "Butter", "Garlic", "White vermouth", "Lemon zest", "Lemon juice", "Parsley"],
              "recipe": "Melt butter on large hot skillet. Add shrimp and alow them to cook. Add garlic. turn shrimp over. place shrimp in bowl. add vermouth and lemon juice to hot skillet. Pour sauce over shrimp and serve."
          },
          {
              "id": "18",
              "name": "Clam Chowder",
              "image_url": "images\\clam_chowder.jpg", // http://jeffreyseafood.com/products/76571-clam-chowder-fresh-baked-clam-chowder-from-the-special-recipe-from-san-francisco
              "ingredients": ["Clams", "Milk", "Flour", "Diced potatoes", "Garlic", "Butter", "Onion"],
              "recipe": "Melt butter in large pot. Add garlic and onion. Stir until onions are translucent. Whisk in flour and milk until thinkened. Stir in potatoes. Bring to boil. Stir in Clams. Serve."
          },
          {
              "id": "19",
              "name": "Burgers",
              "image_url": "images\\burgers.jpg", // http://miami.eat24hours.com/burgers
              "ingredients": ["Beef Patties", "Buns", "Tomatoes", "Onion", "Cheese", "lettuce"],
              "recipe": "BBQ patties. Place on bun and add other ingredients on top. Enjoy."
          },
          {
              "id": "20",
              "name": "Fish n' Chips",
              "image_url": "images\\fish_n_chips.jpg", // http://www.keyword-suggestions.com/ZmlzaCBhbmQgIGNoaXBz/
              "ingredients": ["Fish Fillets", "Flour", "Oil", "Frozen french fries"],
              "recipe": "Toss fish fillets with flour. Heat oil in pan. Add fish fillets. Cook until browned on both sides. Bake fries. Serve and enjoy."
          },
          {
              "id": "21",
              "name": "Steak",
              "image_url": "images\\steak.jpg", // http://ingredientsnetwork.com/scientists-create-steak-from-vegetables-news037723.html
              "ingredients": ["Steaks",],
              "recipe": "BBQ Steaks. Serve with a side of veggies and enjoy."
          },
          {
              "id": "22",
              "name": "spaghetti",
              "image_url": "images\\spaghetti.jpg", // http://tiger.towson.edu/~awiggi4/recipe.html
              "ingredients": ["Spaghetti noodles", "Ground beef", "Pasta sauce"],
              "recipe": "Cook beef on skillet until browned. Drain the fat. Cook noodles. Combine noodles, meat, and sauce in a bowl. Mix and serve."
          },
          {
              "id": "23",
              "name": "Biscuits and Gravy",
              "image_url": "images\\biscuits_and_gravy.jpg", // http://www.recipeshubs.com/biscuits-and-gravy/37591
              "ingredients": ["Biscuit dough", "Milk", "Ground sausage", "Chicken Bouillon"],
              "recipe": "Bake biscuits. Cook sausage with bouillon in skillet until brown. Take sausage out leaving only the fat. Add milk to the fat and wisk until thick. Add sausage back in. Serve over hot biscuits."
          },
          {
              "id": "24",
              "name": "Beans and Rice",
              "image_url": "images\\beans_and_rice.jpg", // http://www.thebittenword.com/thebittenword/2010/02/cajun-red-beans-and-rice.html
              "ingredients": ["Rice", "Ham hock", "Beans", "Onion", "bell pepper", "chili powder", "Salt"],
              "recipe": "Place all ingredients but the rice in a crock pot. Let it cook for 6-8 hours. Cook rice. Place rice and beans in a bowl or on a plate and serve."
          },
          {
              "id": "25",
              "name": "lasagna",
              "image_url": "images\\lasagna.jpg", // http://www.huffingtonpost.com/2014/10/07/lasagna-recipes-easy-chicken_n_1249660.html
              "ingredients": ["Lasagna noodles", "Ground beef", "Speghetti sauce", "cottage cheese", "Ricotta cheese", "Parmesan cheese", "Mozzarella cheese"],
              "recipe": "Cook noodles. Cook ground beef until brown. Add speghetti sauce. In a bowl combine all cheeses. Layer noodles in baking dish. Spread layer of meat sauce and then a layer of cheese. Continue until all ingredients are used. bake for 45 minutes at 350F."
          },
          {
              "id": "26",
              "name": "Stuffed Bell Peppers",
              "image_url": "images\\stuffed_bell_peppers.jpg", // http://sweetpeaskitchen.com/2010/08/stuffed-bell-peppers/
              "ingredients": ["Mexican rice", "Bell peppers", "Corn", "Black beans", "Cheese", "Sour cream"],
              "recipe": "Cook rice. Cut tops of bell peppers off. Boil bell peppers until softened. In a bowl combine cooked rice, beans and corn. Scoop into bell peppers. Sprinkle cheese on top and bake for 15 minutes at 350F"
          },
          {
              "id": "27",
              "name": "Grilled Cheese",
              "image_url": "images\\grilled_cheese.jpg", // https://www.timeout.com/chicago/restaurants/the-best-grilled-cheese-sandwiches-in-chicago
              "ingredients": ["Bread", "Butter", "Cheese", "Tomato soup"],
              "recipe": "Spread butter on bread and place one slice butter side down on skillet. Place cheese on top and place second slice of bread butter side up on top. flip until both sides are brown. Heat up soup to enjoy dipping your sandwhich in."
          },
          {
              "id": "28",
              "name": "Enchiladas",
              "image_url": "images\\enchiladas.jpg", // http://www.deecuisine.com/2014/07/semi-homemade-enchiladas-with-imusa-mccormick.html
              "ingredients": ["Chicken", "Tortillas", "Sour cream", "Enchilada sauce", "Cheese"],
              "recipe": "Cook Chicken and cut into cubes. On a tortilla spread sour cream add some chicken and roll it up. Place in a baking dish. repeat until chicken is all gone. Pour enchilada sauce over rolled tortillas. Sprinkle cheese. Bake for 15 minutes at 350F."
          },
          {
              "id": "29",
              "name": "Chicken",
              "image_url": "images\\chicken.jpg", // http://www.keyword-suggestions.com/Y2hpY2tlbiBkaW5uZXI/
              "ingredients": ["Chicken"],
              "recipe": "Cook, bake, or BBQ chicken however you feel and enjoy."
          },
          {
              "id": "30",
              "name": "Dine-Out",
              "image_url": "images\\dine_out.jpg", // http://www.keyword-suggestions.com/ZGluZXI/
              "ingredients": ["Wallet"],
              "recipe": "Grab your wallet and enjoy the evening not having to cook tonight."
          },
          {
              "id": "31",
              "name": "Some Meal",
              "image_url": "images\\default.png",
              "ingredients": ["INGREDIENT_1", "INGREDIENT_2", "INGREDIENT_3"],
              "recipe": "These are the instructions..."
          },
          {
              "id": "32",
              "name": "Some Meal",
              "image_url": "images\\default.png",
              "ingredients": ["INGREDIENT_1", "INGREDIENT_2", "INGREDIENT_3"],
              "recipe": "These are the instructions..."
          },
          {
              "id": "33",
              "name": "Some Meal",
              "image_url": "images\\default.png",
              "ingredients": ["INGREDIENT_1", "INGREDIENT_2", "INGREDIENT_3"],
              "recipe": "These are the instructions..."
          },
          {
              "id": "34",
              "name": "Some Meal",
              "image_url": "images\\default.png",
              "ingredients": ["INGREDIENT_1", "INGREDIENT_2", "INGREDIENT_3"],
              "recipe": "These are the instructions..."
          },
          {
              "id": "35",
              "name": "Some Meal",
              "image_url": "images\\default.png",
              "ingredients": ["INGREDIENT_1", "INGREDIENT_2", "INGREDIENT_3"],
              "recipe": "These are the instructions..."
          },
          {
              "id": "36",
              "name": "Some Meal",
              "image_url": "images\\default.png",
              "ingredients": ["INGREDIENT_1", "INGREDIENT_2", "INGREDIENT_3"],
              "recipe": "These are the instructions..."
          },

    ];


});

