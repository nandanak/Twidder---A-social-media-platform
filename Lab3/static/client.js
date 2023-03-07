var users;
var loggedinusers;
let token;
var messages;
var a=0;
window.onload = function(){
  if(localStorage.getItem("token")!=null){
    showprofile();
  }
  else{
    showwelcome();
  }
};
showprofile=function(){
  let pv = document.getElementById("profileview");
  document.body.innerHTML = pv.text;
  profile(event, "home");
  getuserinfo();
  postedmessage();
};
showwelcome=function(){
  let wv = document.getElementById("welcomeview");
  document.body.innerHTML = wv.text;
};
gettoken=function(){
  token = localStorage.getItem("token");
  return token;
}

Xpasslength=8;
function signinvalidation(){
  var password=document.getElementById("sipass").value;
  var siemail=document.getElementById("siemail").value;
  if(password.length<Xpasslength){
    document.getElementById("welcomemessage").innerHTML="Password is too short";
    document.getElementById("welcomemessage").style.display = "block";
  }
  data = { 'email': siemail, 'password': password };
  let xhttp = new XMLHttpRequest();
  xhttp.open("POST", "/sign_in", true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
  xhttp.send(JSON.stringify(data));
  xhttp.onreadystatechange=function(){
	  if (xhttp.readyState==4){ 
      if(xhttp.status==200 || xhttp.status==201){
        token = JSON.parse(xhttp.responseText).data;
        localStorage.setItem("token", token);
        syncstorage();
        loggedinusers[token] = siemail;
        persistloggedinusers();
        showprofile();
      }
      else if(xhttp.status==401){
        document.getElementById("welcomemessage").innerHTML = "401 Unauthorized";
        document.getElementById("welcomemessage").style.display = "block";
      }
      else{
        document.getElementById("welcomemessage").innerHTML = "User does not exist";
        document.getElementById("welcomemessage").style.display = "block";
      }
	  }
	}
}

function signupvalidation(){
  var supass=document.getElementById("supass").value;
  var suconf=document.getElementById("suconf").value;
  if(supass!=suconf){
    document.getElementById("welcomemessage").innerHTML="Passwords do not match";
    document.getElementById("welcomemessage").style.display = "block";
  }
  if(supass.length<Xpasslength){
    document.getElementById("welcomemessage").innerHTML="Password is too short";
    document.getElementById("welcomemessage").style.display = "block";
  }
  var email = document.getElementById("email").value;
  var password = supass;
  var confirm = suconf;
  var firstname = document.getElementById("firstname").value;
  var familyname = document.getElementById("familyname").value;
  var gender = document.getElementById("gender").value;
  var city = document.getElementById("city").value;
  var country = document.getElementById("country").value;
  data = { 'email': email, 'password': password, 'confirm': confirm, 'firstname': firstname, 'familyname': familyname, 'gender': gender, 'city': city, 'country': country }
  let xhttp = new XMLHttpRequest();
  xhttp.open("POST", "/sign_up", true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8");
  xhttp.send(JSON.stringify(data));
  xhttp.onreadystatechange=function(){
  	if (xhttp.readyState==4){
      if(xhttp.status==201){
        document.getElementById("welcomemessage").innerHTML = "201 Created";
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
        document.getElementById("welcomemessage").innerHTML = "409 Conflict";
        document.getElementById("welcomemessage").style.display = "block";
      }
    }
  }
}

function getuserinfo(){
  syncstorage();
  let xhttp = new XMLHttpRequest();
  token=localStorage.getItem("token");
  xhttp.open("GET", "/get_user_data_by_token", true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8")
  xhttp.setRequestHeader("Authorization", token)
  xhttp.send();
  xhttp.onreadystatechange=function(){
    if (xhttp.readyState==4){ 
      if(xhttp.status==200){
        let data = JSON.parse(xhttp.responseText).data;
        document.getElementById("homefirstname").innerHTML=data[0];
        document.getElementById("homefamilyname").innerHTML=data[1];
        document.getElementById("homegender").innerHTML=data[2];
        document.getElementById("homecity").innerHTML=data[3];
        document.getElementById("homecountry").innerHTML=data[4];
        document.getElementById("homeemail").innerHTML=data[5];
      }
    }
  }
}

function posttomywall(){
  token=localStorage.getItem("token");
  syncstorage();
  email=loggedinusers[token];
  var content=document.getElementById("post").value;
  content=content.trim();
  if(content==""){
    document.getElementById("homemessage").innerHTML="Blank posts not allowed";
    return false;
  }
  else{
    data = { 'email': email, 'message': content };
    let xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/post_message", true);
    xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8")
    xhttp.setRequestHeader("Authorization", token)
    xhttp.send(JSON.stringify(data));
    xhttp.onreadystatechange=function(){
      if (xhttp.readyState==4){
        if(xhttp.status==200){
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
    }
  }
}

function postedmessage(){
  let xhttp = new XMLHttpRequest();
  token=localStorage.getItem("token");
  xhttp.open("GET", "/get_user_messages_by_token", true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8")
  xhttp.setRequestHeader("Authorization", token)
  xhttp.send();
  xhttp.onreadystatechange=function(){
    if (xhttp.readyState==4){
      if(xhttp.status==200){
        let data = JSON.parse(xhttp.responseText).data;
        messages="<br><h2>Posted messages on wall</h2>";
        for (i=0;i<data.length;i++){
          messages=messages+"<tr><td>"+data[i][1]+" wrote &quot;"+data[i][0]+"&quot;</td></tr>";
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
  }
}

function searchuser(){
  token=localStorage.getItem("token");
  var email=document.getElementById("search").value;
  let xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/get_user_data_by_email/"+email, true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8")
  xhttp.setRequestHeader("Authorization", token)
  xhttp.send();
  xhttp.onreadystatechange=function(){
    if (xhttp.readyState==4){
      if(xhttp.status==200){
        let data = JSON.parse(xhttp.responseText).data;
        getanotheruserinfo(data);
        postedanothermessage();
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
  }
}

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

function posttoanotherwall(){
  token=localStorage.getItem("token");
  var email=document.getElementById("search").value;
  var content=document.getElementById("anotherpost").value;
  content=content.trim();
  if(content==""){
    document.getElementById("browsermessage").innerHTML="Blank posts not allowed";
    return false;
  }
  else{
    data = { 'email': email, 'message': content };
    let xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/post_message", true);
    xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8")
    xhttp.setRequestHeader("Authorization", token)
    xhttp.send(JSON.stringify(data));
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
    }
  }
}

function postedanothermessage(){
  token=localStorage.getItem("token");
  var email=document.getElementById("search").value;
  let xhttp = new XMLHttpRequest();
  xhttp.open("GET", "/get_user_messages_by_email/"+email, true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8")
  xhttp.setRequestHeader("Authorization", token)
  xhttp.send();
  xhttp.onreadystatechange=function(){
    if (xhttp.readyState==4){
      if(xhttp.status==200){
        let data = JSON.parse(xhttp.responseText).data;
        messages="<br><h2>Posted messages on wall</h2>";
        for (i=0;i<data.length;i++){
          messages=messages+"<tr><td>"+data[i][1]+" wrote &quot;"+data[i][0]+"&quot;</td></tr>";
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
  }
}

profile = function(evt, tabname){
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tabcontent");
  for (i=0;i<tabcontent.length;i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tablinks");
  for (i=0;i<tablinks.length;i++) {
    tablinks[i].className = tablinks[i].className.replace("active","");
  }
  document.getElementById(tabname).style.display = "block";
  thistab=evt.currentTarget.className;
  if (thistab != undefined) {
    evt.currentTarget.className += " active";
  } else {
    var hometab = document.getElementsByClassName("tablinks")[0];
    hometab.className += " active";
  }
};

function changepass(){
  var oldpass=document.getElementById("oldpass").value;
  var newpass=document.getElementById("newpass").value;
  var newconf=document.getElementById("newconf").value;
  token=localStorage.getItem("token");
  if(newpass.length<Xpasslength){
    document.getElementById("accountmessage").innerHTML="Password is too short";
    return false;
  }
  if(newpass!=newconf){
    document.getElementById("accountmessage").innerHTML="Passwords do not match";
    return false;
  }
  data = { 'oldpassword': oldpass, 'newpassword': newpass };
  let xhttp = new XMLHttpRequest();
  xhttp.open("POST", "/change_password", true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8")
  xhttp.setRequestHeader("Authorization", token)
  xhttp.send(JSON.stringify(data));
  xhttp.onreadystatechange=function(){
    if (xhttp.readyState==4){
      if(xhttp.status==200){
        document.getElementById("accountmessage").innerHTML="200 Ok";
        document.getElementById('oldpass').value = '';
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
  }
}

function signout() {
  token=localStorage.getItem("token");
  let xhttp = new XMLHttpRequest();
  xhttp.open("POST", "/sign_out", true);
  xhttp.setRequestHeader("Content-type", "application/json;charset=UTF-8")
  xhttp.setRequestHeader("Authorization", token)
  xhttp.send();
  xhttp.onreadystatechange=function(){
    if (xhttp.readyState==4 && xhttp.status==200){
      token=null;
      localStorage.removeItem("token");
      showwelcome();
      document.getElementById("welcomemessage").innerHTML="Successfully Signed out";
    }
  }
}

function syncstorage() {
  if(localStorage.getItem("users") === null) {
    users = {};
  } else {
    users = JSON.parse(localStorage.getItem("users"));
  }
  if (localStorage.getItem("loggedinusers") === null) {
    loggedinusers = {};
  } else {
    loggedinusers = JSON.parse(localStorage.getItem("loggedinusers"));
  }
}
function persistusers() {
  localStorage.setItem("users", JSON.stringify(users));
}
function persistloggedinusers() {
  localStorage.setItem("loggedinusers", JSON.stringify(loggedinusers));
}

function setupsession(){
  let connection = new WebSocket('ws://${window.location.hostname}:${window.location.port}/echo_socket');
  // Sent token to server
  token=localStorage.getItem("token");
  connection.onopen = function() {
    connection.send(token);
  };
  connection.onerror = function(error) {
    console.log('WebSocket Error' + error);
  };
  connection.onmessage = function(message) {
    if(message.data == "signout"){
      signout();
    } else{
      console.log('Server: ' + message.data);
    }
  };
}
