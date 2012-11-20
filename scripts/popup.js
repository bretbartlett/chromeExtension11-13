// Copyright (c) 2012 Kitchology. All rights reserved.

// Show correct menu depending on whether the user is logged in.

var userLoggedIn = null;  //Variable to store the logged in user name
var oauth_sig = null; //empty variable to put the oauth signature
var currentTab = null;

var getCurrentTab = function (callback) {
   		 chrome.tabs.query({
   		   windowId: chrome.windows.WINDOW_ID_CURRENT,
   		   active: true
  		  }, function(tabs) {
  		    callback(tabs[0]);
  		  	});
  		  }
  
getCurrentTab(function(tab) {
		currentTab = tab.url;
      });
      
function signature(httpMethod, URL, timeStamp, nonce, oauth_consumer_key, oauth_token) {
    var accessor = { consumerSecret: null
                   , tokenSecret   : null};      
    var message = { method: httpMethod    //whether it is get or post
                  , action: URL			//what url trying to send too
                  , parameters: ["oauth_signature_method", "HMAC-SHA1",
                  				 "oauth_nonce", nonce,
	 							 "oauth_timestamp", timeStamp,
	 							 "oauth_token", oauth_token,
	 							 "oauth_consumer_key", oauth_consumer_key,
								 "oauth_version", 1.0]
                  };
                   
    OAuth.SignatureMethod.sign(message, accessor);
 	OAuth.SignatureMethod.normalizeParameters(message.parameters);
	OAuth.SignatureMethod.getBaseString(message);
	var sig = OAuth.getParameter(message.parameters, "oauth_signature");

    return sig;
}
	
	
$(document).ready(
  function() {
    //$('p').text('jQuery Successfully loaded.');
    
    $('div#logindialog').dialog( { //Hide login dialog unless user is not logged in
      autoOpen: false
    });
    
    $('div#savedialog').dialog( { //Hide save dialog unless user selects save
      autoOpen: false
    });
    
    $('div#settingsdialog').dialog( { //Hide settings dialog unless user selects settings
      autoOpen: false
    });
    
    /*  Checks to see if a user is stored in the Chrome storage.  If so, then it shows the logged in menu.  If not, then it shows the login dialog box. */
      if( $.Storage.get("user") == null ) {    
        $('div#logindialog').dialog('open');
      }      
      else {
        showLoggedInMenu();
      }       
     
    
    /*  Function to show the menu */            
    function showLoggedInMenu() {
      $('div#loggedinmenu').css('display','inline');
      $('#menu').menu();
    }  


    
    /* Function to bring user to Kitchology.com   */
    $('#menugotoKitch').click(
    	function(){
 		chrome.tabs.create({ 'url' : 'kitchology.html'});
    });
    
    
    /*  Upon selection of "Login" button, this function confirms that correct name and password have been entered and logs in the user. */
    $('#userlogin').click(
      function() {  
            //stores the input into these variables
        userLoggedIn = $('input[name="userName"]').val();
        var userPassword = $('input[name="password"]').val();
		xhr = new XMLHttpRequest();
		
		var loginParams = "grant_type=password&username=" + userLoggedIn + "&password=" + userPassword;
    	
		$.ajax({
        url: 'https://web.kitchology.com/api/v1/users/login',
    	type: 'POST',
    	datatype: 'json',
    	data: loginParams,
    	success: function(data) { 
    			$.Storage.set('oauth_token',data.access_token);   	
     			$.Storage.set('oauth_consumer_key',data.mac_key);     	
     			$.Storage.set('user',userLoggedIn);         	
                $('div#logindialog').dialog('close');              
                showLoggedInMenu();
         	}, 
         	
    	error: function() { alert('Failed!'); },
    	beforeSend: setHeader
		});
       function setHeader(xhr) {
			 xhr.setRequestHeader('Origin', currentTab);
		}		
      });
    
    /*  Function to save recipe when the Save Recipe menu item is selected */
    $('#menusaverecipes').click(
      function() {
      
        $('div#loggedinmenu').css('display','none');
        $('div#savedialog').dialog('open');              
      }
    );    
    //////////////////////////////////////////////////////////////////////////////////////
       /* Function to bring back to the main menu after saving recipe  */
    $('#saverecipe').click(
      function() {
      
      var sharerecipebox = "false";
        //function to see if checkbox is checked      
        	if($('#sharerecipe').prop("checked")){
      			sharerecipebox = "true";
      		}

		var saveParams = "user_id=test&url=" + currentTab + "&notify_family="+ sharerecipebox;//that false should be determined by checkbox
		var testParams = "url=http://allrecipes.com/recipe/avocado-tomato-and-mango-salsa/detail.aspx&notify_family=false";
     	
     	xhr2 = new XMLHttpRequest();		
		var oauth_sig = signature('GET','https://web.kitchology.com/api/v1/users/recipes/secure',OAuth.timestamp(),OAuth.nonce(8),$.Storage.get('oauth_consumer_key'), $.Storage.get('oauth_token')); 
		var oauth_header = 'OAuth oauth_consumer_key="'+$.Storage.get('oauth_token')+'",oauth_signature="'+oauth_sig+'",oauth_signature_method="HMAC-SHA1",oauth_timestamp="'+OAuth.timestamp()+'",oauth_nonce="'+OAuth.nonce(8)+'"'; 
		
		$.ajax({
         url: 'https://web.kitchology.com/api/v1/users/recipes/secure',
  		 type: 'GET',
   		 datatype: 'json',
   		 data: saveParams,
   		 success: function(data) { alert(data); },
   	 	 error: function() { alert('Failed!'); },
    	 beforeSend: setHeaders
    	});
    	
      function setHeaders(xhr2) {
		 xhr2.setRequestHeader('Authorization', oauth_header);								
		 xhr2.setRequestHeader('Origin', currentTab);
		}     	
      		
      		
        $('div#savedialog').dialog('close');
        showLoggedInMenu();
      }
        
    );
    /////////////////////////////////////////////////////////////////////////
    
        /* Function to bring back to main menu after canceling saving recipe */
     $('#cancel').click(
      function() {
        $('div#savedialog').dialog('close');
        showLoggedInMenu();
      }
    );   
    
    
    /*  Function to show settings when the Settings menu item is selected */
    $('#menusettings').click(
      function() {
        $('div#loggedinmenu').css('display','none');
        $('div#settingsdialog').dialog('open');              
      }
    ); 
    
    
         /* Function for when settings are saved (right now just back to menu) */
     $('#savesettings').click(
      function() {
      //function to see if checkbox is checked      
        if($('#setting1').prop("checked")){
      		//alert("settings saved");
      		}
        $('div#settingsdialog').dialog('close');
        showLoggedInMenu();
      }
    );   
       
    
    /* Function to bring back to main menu after canceling settings */
     $('#cancel2').click(
      function() {
        $('div#settingsdialog').dialog('close');
        showLoggedInMenu();
      }
    );   
    
    
    /*  Function to show recipes of the user when the Show Recipes menu item is selected */    
    $('#menushowrecipes').click(
      function() {        

		var getRec = null;
     	
     	xhr2 = new XMLHttpRequest();		
		var oauth_sig = signature('GET','https://web.kitchology.com/api/v1/users/recipes/secure',OAuth.timestamp(),OAuth.nonce(8),$.Storage.get('oauth_consumer_key'), $.Storage.get('oauth_token')); 
		var oauth_header = 'OAuth oauth_consumer_key="'+$.Storage.get('oauth_token')+'",oauth_signature="'+oauth_sig+'",oauth_signature_method="HMAC-SHA1",oauth_timestamp="'+OAuth.timestamp()+'",oauth_nonce="'+OAuth.nonce(8)+'"'; 
		
		//create an empty json object to fill up
		var recipeArrayAJAX = [ 
								{   recipe_id:"",
									name:"",
									description:"",
									preparation_time:"",
									cooking_time:"",
									servings:"",
									url_source:"",
									recipe_img_url:"",
									weighting:"",
									difficulty_rating:"",
									taste_rating:"",
									recipe_steps: 
											[ {	step_number:"", 
												step_description:"",
												duration_official:"",
												duration_average:"",
												timed_duration:"",
												step_img_url:""}],
									recipe_ingredients:
											[ { ingredient_description:"",
												uom_description:"",
												amount:"",
												ingredient_img_url:""}]
								   }
								];
		$.ajax({
         url: 'https://web.kitchology.com/api/v1/users/recipes/secure',
  		 type: 'GET',
   		 datatype: 'json',
   		 data: getRec,
   		 success: function(json) { 
   		 	var x = 0;
   		 	var y = 0;
   		 		while (x < json.length ) { //call this the filler while
   		 			json[x].recipe_id = recipeArrayAJAX[x].recipe_id;
   		 			json[x].name = recipeArrayAJAX[x].name;
   		 			json[x].description = recipeArrayAJAX[x].description;
   		 			json[x].preparation_time = recipeArrayAJAX[x].preparation_time;
   		 			json[x].cooking_time = recipeArrayAJAX[x].cooking_time;
   		 			json[x].servings = recipeArrayAJAX[x].servings;
   		 			json[x].url_source = recipeArrayAJAX[x].url_source;
   		 			json[x].recipe_img_url = recipeArrayAJAX[x].recipe_img_url;
   		 			json[x].weighting = recipeArrayAJAX[x].weighting;
   		 			json[x].difficulty_rating = recipeArrayAJAX[x].difficulty_rating;
   		 			json[x].taste_rating = recipeArrayAJAX[x].taste_rating;
   		 				
   		 				while(y<json[x].recipe_steps.length){
   		 					json[x].recipe_steps[y].step_number = recipeArrayAJAX[x].recipe_steps[y].step_number;
   		 					json[x].recipe_steps[y].step_description = recipeArrayAJAX[x].recipe_steps[y].step_description;
							json[x].recipe_steps[y].duration_official = recipeArrayAJAX[x].recipe_steps[y].duration_official;
							json[x].recipe_steps[y].duration_average = recipeArrayAJAX[x].recipe_steps[y].duration_average;
							json[x].recipe_steps[y].timed_duration = recipeArrayAJAX[x].recipe_steps[y].timed_duration;
							json[x].recipe_steps[y].step_img_url = recipeArrayAJAX[x].recipe_steps[y].step_img_url;
   		 				y = y+1;
   		 				}//end of recipe steps while
   		 				
   		 				y=0;
   		 				while(y<json[x].recipe_ingredients.length){   		 				
   		 					json[x].recipe_ingredients[y].ingredient_description = recipeArrayAJAX[x].recipe_ingredients[y].ingredient_description;
   		 					json[x].recipe_ingredients[y].uom_description = recipeArrayAJAX[x].recipe_ingredients[y].uom_description;
   		 					json[x].recipe_ingredients[y].amount = recipeArrayAJAX[x].recipe_ingredients[y].amount;
   		 					json[x].recipe_ingredients[y].ingredient_img_url = recipeArrayAJAX[x].recipe_ingredients[y].ingredient_img_url;
   		 					y = y+1;
   		 				}//end of ingredients while
   		 		y=0;		
   		 		x=x+1;
   		 		}//end of entire filler while
   		 	
   		 	},
   	 	 error: function() { alert('Failed!'); },
    	 beforeSend: setHeaders
    	});
    	
      function setHeaders(xhr2) {
		 xhr2.setRequestHeader('Authorization', oauth_header);								
		 xhr2.setRequestHeader('Origin', currentTab);
		}    
      		
      		 
      		 
   var recipeArray = [    
   		{   recipe_id:"1001",
			name:'Split Pea Soup',
			description:'Heat and serve',
			preparation_time:'300',
			cooking_time:'360',
			servings:'4',
			url_source:'www.allrecipes.com/split_pea_soup.aspx',
			weighting:'100',
			difficulty_rating:'3.5',
			taste_rating:'4.2'
		},
				
  		{	recipe_id:"1002",
			name:'Apple Pie',
			description:'Heat and serve',
			preparation_time:'400',
			cooking_time:'460',
			servings:'8',
			url_source:'www.allrecipes.com/apple_pie.aspx',
			weighting:'104',
			difficulty_rating:'2.5',
			taste_rating:'6.2'
		}
				];			
				
	//create the aaData set string			
	var num = 0;		
	var aaDATAStringCreate = ""
	while (num < recipeArray.length ) {
		aaDATAStringCreate = aaDATAStringCreate + '["' + recipeArray[num].name + '","' + recipeArray[num].description + '","' + recipeArray[num].url_source + '"],' ;
		num = num+1;
	}			
	var aaDATAString = aaDATAStringCreate.substring(0, aaDATAStringCreate.length - 1);
	alert(aaDATAString);
	
					
        $('div#loggedinmenu').css('display','none'); //Hide the menu
        $('#recipes').dataTable( {
         "bProcessing": true,
         "bDestroy": true,
         "bRetrieve":true,
   		 "aaData": [
            /* Sample data set */
            [ "Split Pea Soup", "Great soup", "www.allrecipes.com" ],
            [ "Oven-Fried Chicken", "Tasty chicken", "www.allrecipes.com" ],
            [ "Cheesy Risotto and Chicken", "Cheesy chicken", "www.foodnetwork.com" ],
            [ "Chicken Salad Pita", "Tasty chicken", "www.foodnetwork.com" ],
            [ "Tangy Barbecue Chicken", "Cheesy chicken", "www.foodnetwork.com" ],
            [ "Peppercorn Chicken with Spinach", "Tasty chicken", "www.allrecipes.com" ],
            [ "Stuffed Chicken Breast", "Cheesy chicken", "www.foodnetwork.com" ],
            [ "Giada's Chicken Parm", "Tasty chicken", "www.foodnetwork.com" ],
            [ "Sunny's Chicken With Peanut Sauce", "Tasty chicken", "www.allrecipes.com" ],
            [ "Chicken Vindaloo", "Cheesy chicken", "www.foodnetwork.com" ],
            [ "Chicken Sausages", "Tasty chicken", "www.foodnetwork.com" ],
            [ "Lemon Pasta With Chicken", "Cheesy chicken", "www.foodnetwork.com" ],
            [ "Grilled Chicken", "Tasty chicken", "www.allrecipes.com" ],
            [ "Emerils Chicken Parm", "Cheesy chicken", "www.foodnetwork.com" ],
            [ "Turducken", "Tasty chicken", "www.foodnetwork.com" ],
            [ "Chicken Salad Sandwich", "Cheesy chicken", "www.foodnetwork.com" ]
            
        ],
         "aoColumns": [
            { "sTitle": "Name" },
            { "sTitle": "Description" },
            { "sTitle": "URL" }
        ]
        });
        $('div#recipetable').css('display','inline');
      
      });
    
    	/* Function to bring back to main menu from recipe table */
     $('#tablecancel').click(
      function() {
        $('div#recipetable').css('display','none');
       // $('div#recipes').css('display','none');
        $('div#loggedinmenu').css('display','inline');
      
      }
    );   
    
    /*  Function to logout the user when the Logout menu item is selected */
    $('#menulogout').click(  
      function() {
        $.Storage.remove("user")
        $.Storage.remove("oauth_token")
        $.Storage.remove("oauth_consumer_key")
        userLoggedIn = null;
        $('div#loggedinmenu').css('display','none');
        $('div#logindialog').dialog('open');             
      }
    );
});
