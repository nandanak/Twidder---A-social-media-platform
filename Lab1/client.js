window.onload = function(){
  if(localStorage.getItem("token")!=null){
    showprofile();
  }
  else{
    showwelcome();
  }
};
showprofile=function(){
  var pv = document.getElementById("profileview");
  document.body.innerHTML = pv.text;
  profile(event, "home");
  getuserinfo();
  postedmessage();
};
showwelcome=function(){
  var wv = document.getElementById("welcomeview");
  document.body.innerHTML = wv.text;
};

Xpasslength=8;
signinvalidation = function(){ /* To sign in */
  var sipass=document.getElementById("sipass").value;
  var siemail=document.getElementById("siemail").value;
  if(sipass.length<Xpasslength){
    document.getElementById("welcomemessage").innerHTML="Password is too short";
    return false;
  }
  var reply=serverstub.signIn(siemail,sipass);
  if(reply.success==true){
    localStorage.setItem("token",reply.data);
    /*showprofile();*/
    location.reload();
  }
  else{
    document.getElementById("welcomemessage").innerHTML=reply.message;
    return false;
  }
};
signupvalidation = function(){ /* To sign up */
  var supass=document.getElementById("supass").value;
  var suconf=document.getElementById("suconf").value;
  if(supass!=suconf){
    document.getElementById("welcomemessage").innerHTML="Passwords do not match";
    return false;
  }
  if(supass.length<Xpasslength){
    document.getElementById("welcomemessage").innerHTML="Password is too short";
    return false;
  }
  var dataObject = {
  "email":document.getElementById("email").value,
  "password":document.getElementById("supass").value,
  "firstname":document.getElementById("firstname").value,
  "familyname":document.getElementById("familyname").value,
  "gender":document.getElementById("gender").value,
  "city":document.getElementById("city").value,
  "country":document.getElementById("country").value
  };

  var reply=serverstub.signUp(dataObject);
  document.getElementById("welcomemessage").innerHTML=reply.message;
  return false;
};

getuserinfo=function(){ /* To get a user's details */
  var token=localStorage.getItem("token");
  var reply=serverstub.getUserDataByToken(token);
  var data=reply.data;
  document.getElementById("homefirstname").innerHTML=data.firstname;
  document.getElementById("homefamilyname").innerHTML=data.familyname;
  document.getElementById("homegender").innerHTML=data.gender;
  document.getElementById("homecity").innerHTML=data.city;
  document.getElementById("homecountry").innerHTML=data.country;
  document.getElementById("homeemail").innerHTML=data.email;
};

posttomywall=function(){ /* To post to own wall */
  var token=localStorage.getItem("token");
  var data=serverstub.getUserDataByToken(token).data;
  var email=data.email;
  var content=document.getElementById("post").value;
  content=content.trim();
  if(content==""){
    document.getElementById("homemessage").innerHTML="Blank posts not allowed";
    return false;
  }
  else{
    var reply=serverstub.postMessage(token,content,email);
    if (reply.success=true){
      document.getElementById('post').value = '';
      document.getElementById("homemessage").innerHTML=reply.message;
      return false;
    }
    else{
      document.getElementById("homemessage").innerHTML=reply.message;
      return false;
    }
  }
};

postedmessage=function(){ /* To get the posted messages in own wall */
  var token=localStorage.getItem("token");
  var reply=serverstub.getUserMessagesByToken(token);
  if(reply.success==true){
    messages="<br><h2>Posted messages on wall</h2>";
    for (i=0;i<reply.data.length;i++){
      messages=messages+"<tr><td>"+reply.data[i].writer+" wrote &quot;"+reply.data[i].content+"&quot;</td></tr>";
    }
    document.getElementById("homemessage").innerHTML="";
    document.getElementById("postmessages").innerHTML=messages;
  }
};

searchuser=function(){ /* To search for a user in the system */
  var token=localStorage.getItem("token");
  var email=document.getElementById("search").value;
  var reply=serverstub.getUserDataByEmail(token,email);
  if(reply.success==false){
    document.getElementById("browsemessage").innerHTML=reply.message;
    return false;
  }
  else{
    document.getElementById("browsemessage").innerHTML="User found";
    getanotheruserinfo(reply,email);
    postedanothermessage();
    return false;
  }
};

getanotheruserinfo=function(reply,email){ /* To get another user's details */
  var token=localStorage.getItem("token");
  var data=reply.data;
  document.getElementById("infotable").style.display="block";
  document.getElementById("browsefirstname").innerHTML=data.firstname;
  document.getElementById("browsefamilyname").innerHTML=data.familyname;
  document.getElementById("browsegender").innerHTML=data.gender;
  document.getElementById("browsecity").innerHTML=data.city;
  document.getElementById("browsecountry").innerHTML=data.country;
  document.getElementById("browseemail").innerHTML=data.email;
  document.getElementById("postanotherform").style.display="block";
  document.getElementById("breloadbtn").style.display="block";
  document.getElementById("postanothermessages").style.display="block";
};

posttoanotherwall=function(){ /* To post to another user's wall */
  var token=localStorage.getItem("token");
  var email=document.getElementById("search").value;
  var content=document.getElementById("anotherpost").value;
  content=content.trim();
  if(content==""){
    document.getElementById("browsermessage").innerHTML="Blank posts not allowed";
    return false;
  }
  else{
    var reply=serverstub.postMessage(token,content,email);
    if (reply.success=true){
      document.getElementById('anotherpost').value = '';
      document.getElementById("browsermessage").innerHTML=reply.message;
      return false;
    }
    else{
      document.getElementById("browsermessage").innerHTML=reply.message;
      return false;
    }
  }
};

postedanothermessage=function(){ /* To get the posted messages in another user's wall */
  var token=localStorage.getItem("token");
  var email=document.getElementById("search").value;
  var replymsgs=serverstub.getUserMessagesByEmail(token,email);
  if(replymsgs.success==true){
    messages="<br><h2>Posted messages on wall</h2>";
    for (i=0;i<replymsgs.data.length;i++){
      messages=messages+"<tr><td>"+replymsgs.data[i].writer+" wrote &quot;"+replymsgs.data[i].content+"&quot;</td></tr>";
    }
    document.getElementById("browsermessage").innerHTML="";
    document.getElementById("postanothermessages").innerHTML=messages;
  }
};

profile = function(event, tabname){ /* To maintain the tab content of the profile view */
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
  thistab=event.currentTarget.className;
  if (thistab != undefined) {
    event.currentTarget.className += " active";
  } else {
    var hometab = document.getElementsByClassName("tablinks")[0];
    hometab.className += " active";
  }
};

changepass = function(){ /* To change user password */
  var oldpass=document.getElementById("oldpass").value;
  var newpass=document.getElementById("newpass").value;
  var newconf=document.getElementById("newconf").value;
  var token=localStorage.getItem("token");
  if(newpass.length<Xpasslength){
    document.getElementById("accountmessage").innerHTML="Password is too short";
    return false;
  }
  if(newpass!=newconf){
    document.getElementById("accountmessage").innerHTML="Passwords do not match";
    return false;
  }
  var reply=serverstub.changePassword(token,oldpass,newpass);
  if(reply.success==true){
    document.getElementById('oldpass').value = '';
    document.getElementById('newpass').value = '';
    document.getElementById('newconf').value = '';
    document.getElementById("accountmessage").innerHTML=reply.message;
    return false;
  }
  else{
    document.getElementById("accountmessage").innerHTML=reply.message;
    return false;
  }
};

signout = function() { /* To sign out */
  var token = localStorage.getItem("token");
  var reply = serverstub.signOut(token);
  if (reply.success == true){
    localStorage.removeItem("token");
    showwelcome();
    document.getElementById("welcomemessage").innerHTML=reply.message;
  }
};
