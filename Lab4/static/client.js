var users;
var loggedinusers;
let token;
var messages;
// The views to be displayed when the browser window loads each time is determined in this function
window.onload = function(){
  let token = localStorage.getItem("token"); // Gets the token from localstorage to check authenticated or not
  if(token!=null){
    showprofile(); // To show the profile view, tabs, user details, messages
    profile(event, "home");
    getuserinfo();
    postedmessage();
    setupconnection(); // To setup websocket connection
  }
  else{
    let reset = localStorage.getItem("reset"); // Gets the reset value from localstorage to check if password recovery is triggered or not
    if(reset==null){
      try {
        showwelcome();
      }
      catch(err) {
        showresetpass();
      }
    }
    else{
      showresetemail(); 
    }
  }
};
showprofile=function(){ // Shows profile page
  let pv = document.getElementById("profileview");
  document.body.innerHTML = pv.text;
};
showwelcome=function(){ //Shows welcome page
  let wv = document.getElementById("welcomeview");
  document.body.innerHTML = wv.text;
};
showresetemail=function(){// Shows reset link request page
  let rev = document.getElementById("resetemailview");
  document.body.innerHTML = rev.text;
};
showresetpass=function(){ // Shows password reset page
  let rpv = document.getElementById("resetpassview");
  document.body.innerHTML = rpv.text;
};
cancelreset=function(){ // If cancel button is clicked
  localStorage.removeItem("reset");
  showwelcome();
}
setrest=function(){ // After password recovery is triggered
  let reset = "RESET";
  localStorage.setItem("reset", reset);
  location.reload();
}
function allowDrop(ev) { // This function allows text to be dropped into the triggered HTML div
  ev.preventDefault();
}
function drag(ev) { // This functions enables HTML div text dragging
  ev.dataTransfer.setData("text", ev.target.id);
}
function drop(ev) { // Thisfunction enables the text to be dropped to the div
  ev.preventDefault();
  var data = ev.dataTransfer.getData("text");
  ev.target.innerHTML = document.getElementById(data).innerHTML;
}



// This fucntion is used to get the email for the password recovery request link to be send to.
function get_email_for_reset(){
  var reemail=document.getElementById("reemail").value;
  data = { 'email': reemail };
  let xhttp = new XMLHttpRequest(); // Xmlhttp request instance
  xhttp.open("POST", "/reset_password", true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
  xhttp.send(JSON.stringify(data)); //Sending along with the email
  xhttp.onreadystatechange=function(){
    if (xhttp.readyState==4){ 
      if(xhttp.status==200){
        resetpass = JSON.parse(xhttp.responseText).token; //Token received
        localStorage.removeItem("reset"); // Remove password recovery triggering item reset
        document.getElementById("resetemailmessage").innerHTML = "200 Ok! Email sent";
        document.getElementById("resetemailmessage").style.display = "block";
      }
      else if(xhttp.status==401){
        document.getElementById("resetemailmessage").innerHTML = "401 Unauthorized";
        document.getElementById("resetemailmessage").style.display = "block";
      }
      else if(xhttp.status==400){
        document.getElementById("resetemailmessage").innerHTML = "400 Bad Request";
        document.getElementById("resetemailmessage").style.display = "block";
      }
      else{
        document.getElementById("resetemailmessage").innerHTML = xhttp.status; //All other status codes printed
        document.getElementById("resetemailmessage").style.display = "block";
      }
    }
  };
}


// This fucntion enables the user signin, retreives the form values and pass to server after validation
Xpasslength=8;
function signinvalidation(){
  var password=document.getElementById("sipass").value;
  var siemail=document.getElementById("siemail").value;
  if(password.length<Xpasslength){ // Check password length
    document.getElementById("welcomemessage").innerHTML="Password is too short";
    document.getElementById("welcomemessage").style.display = "block";
  }
  else{
    let data = { 'email': siemail, 'password': password }; // To convert to JSON
    let xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/sign_in", true);
    xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    xhttp.send(JSON.stringify(data)); //Send request along with the data from form
    xhttp.onreadystatechange=function(){
      if (xhttp.readyState==4){ 
        if(xhttp.status==201){
          token = JSON.parse(xhttp.responseText).data; //Token received
          localStorage.setItem("token", token); //Store token in localstorage
          syncstorage(); // Get local variables
          loggedinusers[token] = siemail; //Store the token and email locally
          persistloggedinusers(); // Save it in localstorage
          location.reload(); // Reload window todisplay profile view
        }
        else if(xhttp.status==401){
          document.getElementById("welcomemessage").innerHTML = "401 Unauthorized";
          document.getElementById("welcomemessage").style.display = "block";
        }
        else if(xhttp.status==400){
          document.getElementById("welcomemessage").innerHTML = "400 Bad Request";
          document.getElementById("welcomemessage").style.display = "block";
        }
        else{
          document.getElementById("welcomemessage").innerHTML = "404 Not Found";
          document.getElementById("welcomemessage").style.display = "block";
        }
      }
    };
  }
}


// This fucntion enables the user signup, retreives the form values and pass to server after validation
function signupvalidation(){
  var supass=document.getElementById("supass").value;
  var suconf=document.getElementById("suconf").value;
  if(supass!=suconf){ // Check if passwords match
    document.getElementById("welcomemessage").innerHTML="Passwords do not match";
    document.getElementById("welcomemessage").style.display = "block";
  }
  else{
    if(supass.length<Xpasslength){ //Check length
      document.getElementById("welcomemessage").innerHTML="Password is too short";
      document.getElementById("welcomemessage").style.display = "block";
    }
    else{
      var email = document.getElementById("email").value; // All form values are retreived one by one
      var password = supass;
      var confirm = suconf;
      var firstname = document.getElementById("firstname").value;
      var familyname = document.getElementById("familyname").value;
      var gender = document.getElementById("gender").value;
      var city = document.getElementById("city").value;
      var country = document.getElementById("country").value; 
      // Form values organized into JSON format
      data = { 'email': email, 'password': password, 'confirm': confirm, 'firstname': firstname, 'familyname': familyname, 'gender': gender, 'city': city, 'country': country };
      let xhttp = new XMLHttpRequest();
      xhttp.open("POST", "/sign_up", true);
      xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
      xhttp.send(JSON.stringify(data)); // Send along with the JSON data
      xhttp.onreadystatechange=function(){
        if (xhttp.readyState==4){ //Request successful
          if(xhttp.status==201){ // Response successful
            document.getElementById("welcomemessage").innerHTML = "201 Created"; // Messages
            document.getElementById("welcomemessage").style.display = "block";
          }
          else if(xhttp.status==400){
            document.getElementById("welcomemessage").innerHTML = "400 Bad Request";
            document.getElementById("welcomemessage").style.display = "block";
          }
          else if(xhttp.status==406){
            document.getElementById("welcomemessage").innerHTML = "406 Not Acceptable";
            document.getElementById("welcomemessage").style.display = "block";
          }else{
            document.getElementById("welcomemessage").innerHTML = xhttp.status;
            document.getElementById("welcomemessage").style.display = "block";
          }
        }
      };
    }
  }
}

//Function to retrive and display user data to their profile
function getuserinfo(){
  syncstorage();
  token=localStorage.getItem("token");
  email=loggedinusers[token]
  secretkey=JSON.stringify(token); //Secretkey is the token of the user
  data = JSON.stringify(email);
  publickey = data; // Publc key is the email of the user
  data = data.concat("GET"); // Adding url values to the data to make it more secure
  data = data.concat("/get_user_data_by_token");
  secretkey = CryptoJS.enc.Utf8.parse(secretkey);
  data = CryptoJS.enc.Utf8.parse(data);
  var hmacvalue = CryptoJS.HmacSHA256(data, secretkey); //HMAC hashing with SHA256 algorithm
  hmacvalue = hmacvalue.toString(CryptoJS.enc.Hex);
  let message = { 'publickey': email, 'hashed': hmacvalue }; // Publickey and hashedvalue is organized into JSON
  message = JSON.stringify(message);
  let xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/get_user_data_by_token", true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("message", message); // The message is send as Header since the request is GET
  xhttp.send();
  xhttp.onreadystatechange=function(){
    if (xhttp.readyState==4){ 
      if(xhttp.status==200){
        let newdata = JSON.parse(xhttp.responseText).data; // The user data is given back by the server
        document.getElementById("homefirstname").innerHTML=newdata[0]; // Setting the user values to the template
        document.getElementById("homefamilyname").innerHTML=newdata[1];
        document.getElementById("homegender").innerHTML=newdata[2];
        document.getElementById("homecity").innerHTML=newdata[3];
        document.getElementById("homecountry").innerHTML=newdata[4];
        document.getElementById("homeemail").innerHTML=newdata[5];
      }
    }
  };
}

// This function is used to post messages to the user's own wall
function posttomywall(){
  token=localStorage.getItem("token"); // Token retrived from local storage to identify user
  data = JSON.stringify(token);
  syncstorage();
  email=loggedinusers[token];
  var content=document.getElementById("post").value; // Content retrived from page
  content=content.trim();
  if(content==""){ // Check for blank posts
    document.getElementById("homemessage").innerHTML="Blank posts not allowed";
    return false;
  }
  else{
    let secretkey = data; // Token is secretkey
    let publickey = JSON.stringify(email); // Email is publickey
    data = { 'toemail': email, 'message': content };
    data = JSON.stringify(data);
    let pencode = btoa(data); // base64 encoding data to be passed to server
    data = data.concat("POST"); //Adding url data
    data = data.concat("/post_message");
    secretkey = CryptoJS.enc.Utf8.parse(secretkey);
    data = CryptoJS.enc.Utf8.parse(data);
    var hmacvalue = CryptoJS.HmacSHA256(data, secretkey); // Hmac Hashing with SHA265 algorithm
    hmacvalue = hmacvalue.toString(CryptoJS.enc.Hex);
    let message = { 'publickey': publickey, 'hashed': hmacvalue, 'params': pencode };
    let xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/post_message", true);
    xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    xhttp.send(JSON.stringify(message)); //Request sent
    xhttp.onreadystatechange=function(){
      if (xhttp.readyState==4){
        if(xhttp.status==200){ // Response success
          document.getElementById('post').value = '';
  	      document.getElementById("homemessage").innerHTML = "200 Ok";
        }
        else if(xhttp.status==500){
  	      document.getElementById("homemessage").innerHTML = "500 Internal Server Error";
        }
        else if(xhttp.status==400){
  	      document.getElementById("homemessage").innerHTML = "400 Bad Request";
        }
        else{
          document.getElementById("homemessage").innerHTML = "401 Unauthorized";
        }
      }
    };
  }
}

//This function is used to display the user's messages to their wall.
function postedmessage(){
  syncstorage();
  token=localStorage.getItem("token");
  data = JSON.stringify(token);
  email=loggedinusers[token];
  let secretkey = data; // Secretkey token
  let publickey = JSON.stringify(email); // Publickey email
  data = publickey
  data = data.concat("GET"); // Adding url data
  data = data.concat("/get_user_messages_by_token");
  secretkey = CryptoJS.enc.Utf8.parse(secretkey);
  data = CryptoJS.enc.Utf8.parse(data);
  var hmacvalue = CryptoJS.HmacSHA256(data, secretkey); // Hmac hashing with Sha256 algorithm
  hmacvalue = hmacvalue.toString(CryptoJS.enc.Hex);
  let message = { 'publickey': publickey, 'hashed': hmacvalue };
  message = JSON.stringify(message);
  let xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/get_user_messages_by_token", true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("message", message); // Send message as Header
  xhttp.send();
  xhttp.onreadystatechange=function(){
    if (xhttp.readyState==4){
      if(xhttp.status==200){
        let newdata = JSON.parse(xhttp.responseText).data; // Response data are the messages
        messages="<br><h2>Posted messages on wall</h2>"; // Messages adding along with template elements
        for (i=newdata.length-1;i>=0;i--){
          unique = "new"+i; // To get unique id for each message
          messages=messages+"<tr><td>"+newdata[i][1]+" wrote <div id='" + unique +"' class='dnd' draggable='true' ondragstart='drag(event)'>"+newdata[i][0]+"</div></td></tr>";
        }
        document.getElementById("homemessage").innerHTML="";
        document.getElementById("postmessages").innerHTML=messages;
      }
      else if(xhttp.status==400){
        document.getElementById("homemessage").innerHTML="400 Bad Request";
      }
      else if(xhttp.status==401){
        document.getElementById("homemessage").innerHTML="401 Unauthorized";
      }else {
        document.getElementById("homemessage").innerHTML="404 Not Found";
      }
    }
  };
}

// This function is triggered when the user searches for another user in the browse tab
function searchuser(){
  token=localStorage.getItem("token");
  syncstorage();
  myemail=loggedinusers[token];
  var email=document.getElementById("search").value; // Serached user email retrived
  data = JSON.stringify(token);
  edata = JSON.stringify(email);
  let eencode = btoa(edata); // The email is encoded to pass to server
  edata = edata.concat("GET"); // The url value is added to data
  edata = edata.concat("/get_user_data_by_email");
  let secretkey = data; // token is secretkey
  let publickey = JSON.stringify(myemail); //email is publickey
  secretkey = CryptoJS.enc.Utf8.parse(secretkey);
  data = CryptoJS.enc.Utf8.parse(edata);
  var hmacvalue = CryptoJS.HmacSHA256(data, secretkey); //Hmac hashing with sha256
  hmacvalue = hmacvalue.toString(CryptoJS.enc.Hex);
  let message = { 'publickey': publickey, 'hashed': hmacvalue }; //Json data
  message = JSON.stringify(message);
  let xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/get_user_data_by_email", true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("email", eencode); //email and message send as header since get request
  xhttp.setRequestHeader("message", message);
  xhttp.send();
  xhttp.onreadystatechange=function(){
    if (xhttp.readyState==4){
      if(xhttp.status==200){
        let newdata = JSON.parse(xhttp.responseText).data;
        getanotheruserinfo(newdata); // To display the searched user's data to webpage
        postedanothermessage(); // To display the searched user's messages to webpage
      }
      else if(xhttp.status==400){
        document.getElementById("browsemessage").innerHTML="400 Bad Request";
      }
      else if(xhttp.status==401){
        document.getElementById("browsemessage").innerHTML="401 Unauthorized";
      }
      else{
        document.getElementById("browsemessage").innerHTML="404 Not Found";
      }
    }
  };
}

// To display another user's data to webpage. This function does not communicate with the server since data is already passed as an argument to this function.
function getanotheruserinfo(data){
  token=localStorage.getItem("token");
  document.getElementById("infotable").style.display="block";
  document.getElementById("browsefirstname").innerHTML=data[0];
  document.getElementById("browsefamilyname").innerHTML=data[1];
  document.getElementById("browsegender").innerHTML=data[2];
  document.getElementById("browsecity").innerHTML=data[3];
  document.getElementById("browsecountry").innerHTML=data[4];
  document.getElementById("browseemail").innerHTML=data[5];
  document.getElementById("postanotherform").style.display="block";
  document.getElementById("breloadbtn").style.display="block";
  document.getElementById("postanothermessages").style.display="block";
}

// This function is used to post messages to another user's wall from the browse tab.
function posttoanotherwall(){
  token=localStorage.getItem("token"); // To identify the currrent user
  syncstorage();
  myemail=loggedinusers[token];
  data = JSON.stringify(token);
  var email=document.getElementById("search").value; // Searched user's email retrieved
  var content=document.getElementById("anotherpost").value; // Message to be posted retrieved
  content=content.trim();
  if(content==""){ // Check for blank posts
    document.getElementById("browsermessage").innerHTML="Blank posts not allowed";
    return false;
  }
  else{
    let secretkey = data;
    let publickey = JSON.stringify(myemail);
    pdata = { 'toemail': email, 'message': content };
    pdata = JSON.stringify(pdata);
    let pencode = btoa(pdata); // Base64 encode data
    pdata = pdata.concat("POST"); // Adding url data
    pdata = pdata.concat("/post_message");
    secretkey = CryptoJS.enc.Utf8.parse(secretkey);
    data = CryptoJS.enc.Utf8.parse(pdata);
    var hmacvalue = CryptoJS.HmacSHA256(data, secretkey); //Hmac hashing with sha256
    hmacvalue = hmacvalue.toString(CryptoJS.enc.Hex);
    let message = { 'publickey': publickey, 'hashed': hmacvalue, 'params': pencode };
    let xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/post_message", true);
    xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
    xhttp.send(JSON.stringify(message)); // send request with message
    xhttp.onreadystatechange=function(){
      if (xhttp.readyState==4){
        if(xhttp.status==200){
          document.getElementById('anotherpost').value = '';
  	      document.getElementById("browsermessage").innerHTML = "200 Ok";
        }
        else if(xhttp.status==500){
  	      document.getElementById("browsermessage").innerHTML = "500 Internal Server Error";
        }
        else if(xhttp.status==400){
  	      document.getElementById("browsermessage").innerHTML = "400 Bad Request";
        }
        else{
          document.getElementById("browsermessage").innerHTML = "401 Unauthorized";
        }
      }
    };
  }
}

// To retrieve messages of another user.
function postedanothermessage(){
  token=localStorage.getItem("token"); // To identify the current user
  var email=document.getElementById("search").value; // Another user's email
  data = JSON.stringify(token);
  syncstorage();
  let myemail=loggedinusers[token];
  edata = JSON.stringify(email);
  let eencode = btoa(edata); // Encoding data
  edata = edata.concat("GET"); // Add url data
  edata = edata.concat("/get_user_messages_by_email");
  let secretkey = data; // Secret key is token
  let publickey = JSON.stringify(myemail); // Public key is email
  secretkey = CryptoJS.enc.Utf8.parse(secretkey); // Utf8 encode secretkey
  data = CryptoJS.enc.Utf8.parse(edata); // Utf8 encode data
  var hmacvalue = CryptoJS.HmacSHA256(data, secretkey); //Hmac hashing with sha256
  hmacvalue = hmacvalue.toString(CryptoJS.enc.Hex);
  let message = { 'publickey': publickey, 'hashed': hmacvalue };
  message = JSON.stringify(message);
  let xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/get_user_messages_by_email", true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
  xhttp.setRequestHeader("email", eencode); // Send email and data as header
  xhttp.setRequestHeader("message", message);
  xhttp.send();
  xhttp.onreadystatechange=function(){
    if (xhttp.readyState==4){
      if(xhttp.status==200){
        let newdata = JSON.parse(xhttp.responseText).data; //Retreived messages
        messages="<br><h2>Posted messages on wall</h2>";
        for (i=newdata.length-1;i>=0;i--){
          unique = "newbro"+i;
          messages=messages+"<tr><td>"+newdata[i][1]+" wrote <div id='" + unique +"' class='dnd' draggable='true' ondragstart='drag(event)'>"+newdata[i][0]+"</div></td></tr>";
        }
        document.getElementById("browsermessage").innerHTML="";
        document.getElementById("postanothermessages").innerHTML=messages;
      }
      else if(xhttp.status==400){
        document.getElementById("browsermessage").innerHTML="400 Bad Request";
      }
      else if(xhttp.status==401){
        document.getElementById("browsermessage").innerHTML="401 Unauthorized";
      }else {
        document.getElementById("browsermessage").innerHTML="404 Not Found";
      }
    }
  };
}

// This function manages the tabs in the profile page
profile = function(event, tabname){
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i=0;i<tabcontent.length;i++) { // Hide all tabs initially
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i=0;i<tablinks.length;i++) { // Remove active in classname
    tablinks[i].className = tablinks[i].className.replace("active","");
  }
  document.getElementById(tabname).style.display = "block";
  thistab=event.currentTarget.className;
  if (thistab != undefined) { // Set the activated tab as active
    event.currentTarget.className += " active";
  } else { // If no tab is triggered, home tab is active
    var hometab = document.getElementsByClassName("tablinks")[0];
    hometab.className += " active";
  }
};

// This function can change the password of the current user
function changepass(){
  var oldpass=document.getElementById("oldpass").value;
  var newpass=document.getElementById("newpass").value;
  var newconf=document.getElementById("newconf").value;
  token=localStorage.getItem("token"); // Identify user
  data = JSON.stringify(token);
  syncstorage();
  let myemail=loggedinusers[token];
  if(newpass.length<Xpasslength){ // Check password length
    document.getElementById("accountmessage").innerHTML="Password is too short";
    return false;
  }
  else{
    if(newpass!=newconf){ // Check password match
      document.getElementById("accountmessage").innerHTML="Passwords do not match";
      return false;
    }
    else{
      let secretkey = data; // Private key is token and public key is email
      let publickey = JSON.stringify(myemail);
      pdata = { 'oldpassword': oldpass, 'newpassword': newpass };
      pdata = JSON.stringify(pdata);
      let pencode = btoa(pdata); // Encoding data
      pdata = pdata.concat("PUT"); //Adding url values
      pdata = pdata.concat("/change_password");
      secretkey = CryptoJS.enc.Utf8.parse(secretkey);
      data = CryptoJS.enc.Utf8.parse(pdata);
      var hmacvalue = CryptoJS.HmacSHA256(data, secretkey); // Hmac hashing
      hmacvalue = hmacvalue.toString(CryptoJS.enc.Hex);
      let message = { 'publickey': publickey, 'hashed': hmacvalue, 'params': pencode };
      let xhttp = new XMLHttpRequest();
      xhttp.open("PUT", "/change_password", true);
      xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
      xhttp.send(JSON.stringify(message));
      xhttp.onreadystatechange=function(){
        if (xhttp.readyState==4){
          if(xhttp.status==200){
            document.getElementById("accountmessage").innerHTML="200 Ok";
            document.getElementById('oldpass').value = ''; // Removing values from webpage
            document.getElementById('newpass').value = '';
            document.getElementById('newconf').value = '';
          }
          else if(xhttp.status==500){
            document.getElementById("accountmessage").innerHTML="500 Internal Server Error";
          }
          else{
            document.getElementById("accountmessage").innerHTML="401 Unauthorized";
          }
        }
      };
    }
  }
}

//This functon is triggered when the user attempts to sign out of their account
function signout() {
  token=localStorage.getItem("token");
  data = JSON.stringify(token);
  syncstorage();
  let myemail=loggedinusers[token];
  let secretkey = data;
  data = data.concat("DELETE"); //add url data to message
  data = data.concat("/sign_out");
  let publickey = JSON.stringify(myemail);
  secretkey = CryptoJS.enc.Utf8.parse(secretkey);
  data = CryptoJS.enc.Utf8.parse(data);
  var hmacvalue = CryptoJS.HmacSHA256(data, secretkey); //hmac hashing with sha 256
  hmacvalue = hmacvalue.toString(CryptoJS.enc.Hex);
  let message = { 'publickey': publickey, 'hashed': hmacvalue }; // organize to json
  let xhttp = new XMLHttpRequest();
  xhttp.open("DELETE", "/sign_out", true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
  xhttp.send(JSON.stringify(message)); // Sending the request along with the message
  xhttp.onreadystatechange=function(){
    if (xhttp.readyState==4 && xhttp.status==200){
      token=null;
      localStorage.removeItem("token"); // Remove token from localstorage
      delete (loggedinusers[token]); //save changes in the local variable
      persistloggedinusers();
      showwelcome(); // Back to welcome page
      document.getElementById("welcomemessage").innerHTML="Successfully Signed Out!";
    }
  };
}

// This function retrives the localstorage items and saves it as local variables
function syncstorage() {
  if (localStorage.getItem("loggedinusers") === null) {
    loggedinusers = {};
  } else {
    loggedinusers = JSON.parse(localStorage.getItem("loggedinusers"));
  }
}

// This function makes changes to localstorage
function persistloggedinusers() {
  localStorage.setItem("loggedinusers", JSON.stringify(loggedinusers));
}

//This function sets up the websocket connection between server and client
function setupconnection(){
  let connection = new WebSocket('ws://' + location.host + '/echo_socket'); //New connection
  token=localStorage.getItem("token"); // Identify the user signing in
  data = JSON.stringify(token);
  syncstorage();
  let myemail=loggedinusers[token];
  let secretkey = data;
  let encode = btoa(data);// Encoding data
  data = data.concat("ws://"); // Adding url value to data
  data = data.concat("/echo_socket");
  let publickey = JSON.stringify(myemail); //Public key is email and private key is token
  secretkey = CryptoJS.enc.Utf8.parse(secretkey);
  data = CryptoJS.enc.Utf8.parse(data);
  var hmacvalue = CryptoJS.HmacSHA256(data, secretkey); //Hmac hashing
  hmacvalue = hmacvalue.toString(CryptoJS.enc.Hex);
  let message = { 'publickey': publickey, 'hashed': hmacvalue, 'params': encode };
  message = JSON.stringify(message)
  connection.onopen = function() {
    connection.send(message); //Sending message to server
  };
  connection.onerror = function(error) {
    console.log('WebSocket Error: ' + error); //Any error displayed
  };
  connection.onmessage = function(message) {
    data = message.data
    if(data == 'Signout') { //If signout message received
      connection.close(); //Connection closed
      token=null;
      localStorage.removeItem("token"); //Removing token from local storage
      delete (loggedinusers[token]);
      persistloggedinusers();
      showwelcome(); // Back to welcome page
      document.getElementById("welcomemessage").innerHTML="Signing Out! Open in multiple windows";
    } else{
      console.log('Server: ' + data);
    }
  };
}