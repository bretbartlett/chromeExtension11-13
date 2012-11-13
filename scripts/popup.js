// Copyright (c) 2012 Kitchology. All rights reserved.

// Show correct menu depending on whether the user is logged in.

var storage = chrome.storage.local; //Uses Chrome local storage
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
    storage.get('user', function(items) {
      if(!items.user ) {    
        $('div#logindialog').dialog('open');
      }      
      else {
        showLoggedInMenu();
      }       
    
    });    
    
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
		var oauth_header = 'OAuth oauth_consumer_key="'+oauth_token+'",oauth_signature="'+oauth_sig+'",oauth_signature_method="HMAC-SHA1",oauth_timestamp="'+OAuth.timestamp()+'",oauth_nonce="'+OAuth.nonce(8)+'"'; 
		
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
/*
     	xhr = new XMLHttpRequest();
     	//create timestamp and nonce
     	var timeStamp = OAuth.timestamp();
     	var nonce = OAuth.nonce(8);
     
     //	var a_access_token = null;
     //	var a_mac_key = null;     		
     		// needs to be fixed
		var currentTab3 = function(){
									chrome.tabs.getSelected(null, function(tab) {
			  						var thisTab = tab.openerTabId;
									});
							return thisTab
						}
						
		// gets the access_token from local storage				
		storage.get('access_token', function(items) {
      			if(!items.access_token) {    
        			$('div#logindialog').dialog('open');
      			}      
     			 else {
        			a_access_token = items.access_token;
      				}       
    	});	
    				
		//gets the mac_key from local storage
		storage.get('mac_key', function(items) {
      			if(!items.mac_key) {    
        			$('div#logindialog').dialog('open');
      			}      
     			 else {
        			a_mac_key = items.mac_key;
      				}       
    	});		    	
		
		oauth_sig = makeSignedRequest(a_mac_key, a_access_token,"https://web.kitchology.com/api/v1/users/recipes/secure");	
		alert("signature is "+ a_mac_key);
		alert("url is " + currentTab3);
		
		var oauth_header = 'OAuth oauth_consumer_key="'+a_access_token+'",oauth_signature="'+a_mac_key+'=",oauth_signature_method="HMAC-SHA1",oauth_timestamp="'+timeStamp+'",oauth_nonce="'+nonce+'"'; 		
		var saveParams = "url=" + currentTab3 + "&notify_family=false";//that false should be determined by checkbox
		var testParams = "url=http://allrecipes.com/recipe/avocado-tomato-and-mango-salsa/detail.aspx&notify_family=false";
		
		$.ajax({
         url: 'https://web.kitchology.com/api/v1/users/recipes/secure',
  		 type: 'GET',
   		 datatype: 'json',
   		 data: testParams,
   		 success: function() { alert("Success"); },
   	 	 error: function() { alert('Failed!'); },
    	 beforeSend: setHeaders
    	});
    	
      function setHeaders(xhr) {
		 xhr.setRequestHeader('Authorization', oauth_header);								
		 xhr.setRequestHeader('Origin', currentTab3);
		}     	
      		
		
		*/
      
        $('div#loggedinmenu').css('display','none'); //Hide the menu
        $('#recipes').dataTable( {
         "bProcessing": true,
         "bDestroy": true,
         "bRetrieve":true,
   		 "sAjaxSource": "https://web.kitchology.com/api/v1/users/recipes",
         "aoColumns": [
            { "sTitle": "Name" },
            { "sTitle": "Description" },
            { "sTitle": "URL" }
        ]
        });
        $('div#recipetable').css('display','inline');
      }
    );
    
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
        storage.clear();
        userLoggedIn = null;
        $('div#loggedinmenu').css('display','none');
        $('div#logindialog').dialog('open');             
      }
    );
});
