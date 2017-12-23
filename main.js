'use strict';
  
// Initialize Firebase
var config = {
	apiKey: "",
	authDomain: "",
	databaseURL: ""
};

/**
 * initApp handles setting up UI event listeners and registering Firebase auth listeners:
 *  - firebase.auth().onAuthStateChanged: This listener is called when the user is signed in or
 *    out, and that is where we update the UI.
 */
function initApp() {

  firebase.initializeApp(config);

  // Listening for auth state changes.
  // [START authstatelistener]
  firebase.auth().onAuthStateChanged(function(user) {
	// [START_EXCLUDE silent]
	//document.getElementById('quickstart-verify-email').disabled = true;
	// [END_EXCLUDE]
	if (user) {
	  // User is signed in.
	  var displayName = user.displayName;
	  var email = user.email;
	  var emailVerified = user.emailVerified;
	  var photoURL = user.photoURL;
	  var isAnonymous = user.isAnonymous;
	  var uid = user.uid;
	  var providerData = user.providerData;
	  // [START_EXCLUDE]
	  document.getElementById('quickstart-sign-in-status').textContent = 'Signed in';
	  document.getElementById('quickstart-sign-in').textContent = 'Sign out';
	  document.getElementById('quickstart-account-details').textContent = JSON.stringify(user, null, '  ');
	  //if (!emailVerified) {
		//document.getElementById('quickstart-verify-email').disabled = false;
	  //}
	  
	  //document.getElementById('quickstart-sign-up').style.display = "none";
	  //document.getElementById('quickstart-verify-email').style.display = "none";
	  //document.getElementById('quickstart-password-reset').style.display = "none";
	  document.getElementById('email-password').style.display = "none";
	  
	  initDatabase();
	  //getRecords();
	  	  
	  document.getElementById('map-container').style.display = "block";
	  
	  // [END_EXCLUDE]
	} else {
	  // User is signed out.
	  // [START_EXCLUDE]
	  document.getElementById('quickstart-sign-in-status').textContent = 'Signed out';
	  document.getElementById('quickstart-sign-in').textContent = 'Sign in';
	  document.getElementById('quickstart-account-details').textContent = 'null';
	  document.getElementById('records-details').textContent = 'null';
	  
	  //document.getElementById('quickstart-sign-up').style.display = "inline";
	  //document.getElementById('quickstart-verify-email').style.display = "inline";
	  //document.getElementById('quickstart-password-reset').style.display = "inline	  
	  document.getElementById('email-password').style.display = "block";
	  document.getElementById('map-container').style.display = "none";
	  // [END_EXCLUDE]
	}
	// [START_EXCLUDE silent]
	document.getElementById('quickstart-sign-in').disabled = false;
	document.getElementById('auth-container').style.display = "block";
	// [END_EXCLUDE]
  });
  // [END authstatelistener]

  document.getElementById('quickstart-sign-in').addEventListener('click', toggleSignIn, false);
  //document.getElementById('quickstart-sign-up').addEventListener('click', handleSignUp, false);
  //document.getElementById('quickstart-verify-email').addEventListener('click', sendEmailVerification, false);
  //document.getElementById('quickstart-password-reset').addEventListener('click', sendPasswordReset, false);
  
  document.getElementById('show-log').addEventListener('click', showLog, false);  
  document.getElementById('myposition').addEventListener('click', getMyPosition, false);
  document.getElementById('date-today').addEventListener('click', function(){ getRecords(null, new Date()); }, false);
  document.getElementById('date-yesterday').addEventListener('click', function(){ 
	var date = new Date();
	date.setDate(date.getDate() - 1);
	getRecords(null, date); 
  }, false);
  document.getElementById('date-before-yesterday').addEventListener('click', function(){ 
	var date = new Date();
	date.setDate(date.getDate() - 2);
	getRecords(null, date); 
  }, false);
  
  var datePicker = new mdDateTimePicker.default({ type: 'date' });
  document.getElementById('date-other').addEventListener('click', function(){ 	
	datePicker.toggle();
	datePicker.trigger = this;
  }, false);  
  document.getElementById('date-other').addEventListener('onOk', function() { getRecords(null, datePicker.time.toDate()); });
  
  document.getElementById('time-very-last').addEventListener('click', function(){ getRecords(null, null, 50); }, false);
  document.getElementById('time-last').addEventListener('click', function(){ getRecords(null, null, 100); }, false);
  document.getElementById('time-long').addEventListener('click', function(){ getRecords(null, null, 1000); }, false);
  document.getElementById('time-very-long').addEventListener('click', function(){ getRecords(null, null, 10000); }, false);
  document.getElementById('time-all').addEventListener('click', function(){ getRecords(null, null, 1000000); }, false);
    
  document.getElementById('show-graph').addEventListener('click', function(){ this.style.display = "none"; drawChart(); }, false);
  
  document.getElementById('device-form').addEventListener('submit', function(e){ e.preventDefault(); setConfigDevice(e); }, false);
  
  google.charts.load('current', {'packages':['corechart']});
}

function showLog() {
	document.getElementById('user-details-container').style.display = "block";
	document.getElementById('show-log').style.display = "none";
}