var users;
var loggedinusers;
var message;
var usertoken=null;
var a=0;
window.onload = function(){
  if(a/*gettoken()==null*/){
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