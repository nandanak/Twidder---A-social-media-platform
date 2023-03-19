from flask import *
from flask_sock import Sock
import bcrypt
from email_validator import validate_email, EmailNotValidError
import math
import database_helper
from random import random
from flask_mail import Mail, Message
import hashlib
import hmac
import base64
import jwt
from time import time
import urllib.parse

app = Flask(__name__)
sockets = Sock(app)
# Edit these config variables to change sender mail address
app.config['MAIL_SERVER']='sandbox.smtp.mailtrap.io'
app.config['MAIL_PORT'] = 2525
app.config['MAIL_USERNAME'] = '8d4ede00ad9993'
app.config['MAIL_PASSWORD'] = '2841d71d6c7c3d'
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
loggedIn = {}
mail = Mail(app)
verifieduser = "a", "b", "c", "d", "e", "g"


# This function is used to automatically log out the signed in user, if the same user has signed in somewhere else too
@sockets.route('/echo_socket')
def echo_socket(sock):
    while True:
        try:
            message = sock.receive() # Message received from client
            message = str(message)
            mess = message.split(",")
            publickey = mess[0].split("\"")[3]
            hashed = mess[1].split("\"")[3]
            params = mess[2].split("\"")[3]
            if publickey == "" or hashed == "" or params == "":
                print("BAD REQUEST")
            else:
                decoded = base64.b64decode(params) # Decoding the encoded values
                token = str(decoded, "utf-8")
                if token != "":
                    key = database_helper.check_loginfromemail(publickey) # Get the token as secretkey from database
                    if key!=None: 
                        key = key[0] # To get the secret key
                        message = token+"ws://"+"//echo_socket" # Assembling the values to hash
                        hmacvalue = hmac.new(key.encode(), message.encode(), hashlib.sha256).hexdigest() # Hmac hashing with sha256 like client side
                        if hmacvalue == hashed:
                            token = token.strip("\"")
                            email = database_helper.check_loginfromtoken(token) # Get email associated with that token
                            if email!=None: # If email exists in database
                                email = email[0]
                                oldsock = loggedIn.get(email) # Get connection from dictionary by searching with email
                                loggedIn[email] = sock # Set new connection 
                                if oldsock!=None: # If old connection exists
                                    try:
                                        oldsock.send('Signout') # Send signout message to client side
                                        oldtoken = database_helper.check_loginfromemail(email)[0]
                                        result = database_helper.remove_login(oldtoken) # Removing old connection token from database
                                    except:
                                        continue
        except:
            break



@app.route('/', methods=['GET']) # Index page
def root():
    return app.send_static_file("client.html"), 200

@app.teardown_request
def after_request(exception):
    database_helper.disconnect_db()

def get_reset_token(userdata, expires=500): # To create a timed token
        return jwt.encode({ 'reset_password': userdata[5], 'exp': time() + expires }, key='thisisthesecretkeytoemailreset!')

def verify_reset_token(token): # To verify the token's validity and the user connected to the token
        try:
            email = jwt.decode(token, key='thisisthesecretkeytoemailreset!', algorithms=["HS256"])['reset_password'] # Get email from the decoded message
        except Exception as e:
            print(e)
            return
        return database_helper.get_userdata(email) # Get user data of the associated email

        
@app.route('/reset_token/<token>', methods=['GET','POST'])
def reset_token(token): # This function is used to update the password by using the password reset method
    global verifieduser # A global varibale to store the user data after verification of token
    if request.method=="POST":
        password = request.form['repass']
        confirm = request.form['reconf']
        if password == "" or confirm == "": # The password validation
            print('Required fields')
            return redirect(url_for('reset_token')) # Incorrect parameters
        elif password!=confirm:
            print('Passwords do not match')
            return redirect(url_for('reset_token')) # Passwords do not match
        elif len(password)<8:
            print('Password is too short')
            return redirect(url_for('reset_token')) # Short password
        else:
            user = verifieduser
            password=password.encode("utf-8")
            userpass = bcrypt.hashpw(password, bcrypt.gensalt(10)) # Salt and hash the password to store in database
            change = database_helper.change_pass(user[5],userpass)
            print('Successfully changed password')
            return redirect(url_for('root')) # Successfully changed password
    else:
        user=verify_reset_token(token) # Call verification method
        if user is None:
            print('Token Invalid or Expired')
            return redirect(url_for('reset_password')) # Token invalid or expired
        else:
            verifieduser = user
    return app.send_static_file("reset.html") # Display the form to reset password


@app.route('/reset_password', methods=['POST'])
def reset_password(): # This function is used to send the password reset link to the user's email
    data = request.get_json() # Get the data in json
    if 'email' not in data:
        return "", 400 # Incorrect fields in the JSON file
    else:
        email=data['email']
        if email == "":
            return "", 400 # Incorrect parameters
        else:
            email = email.strip("\"")
            try:
                validation = validate_email(email) # Validates the email
                email = validation.email
            except EmailNotValidError as e:
                print(str(e))
                return "", 400 # Incorrect email field
            userdata=database_helper.get_userdata(email) # Retrives user data
            check=database_helper.check_loginfromemail(email) # Chech if user is already signed in
            if userdata!=None: 
                if check==None:
                    token = get_reset_token(userdata) # Created token
                    token = urllib.parse.quote(token) # Url encode token
                    msg = Message() # Creating the message to be sent
                    msg.subject = "Password Reset Request"
                    msg.recipients = [email]
                    msg.sender = 'noreply@testmail.com'
                    msg.html = "<button id='sending' onclick='get_request_page();'>Click Here</button>" # Creating link button
                    msg.body = f''' To reset your password, please click the following link.
                    

                    {url_for('reset_token',token=token,_external=True)}


                    If you are not the one who initiated this password reset request, you can ignore this message.
                    
                    '''
                    mail.send(msg) # Sending message to user
                    return jsonify({'token': token}), 200 # Successfully sent the requested link by email
                else:
                    return "", 409 # Already signed in
            else:
                return "", 404 # User does not exist

@app.route('/sign_in', methods=['POST'])
def sign_in(): # This function is used to sign the user in and create the authentication token
    data = request.get_json() 
    if 'email' not in data or 'password' not in data:
        return "", 400 # Incorrect fields in the JSON file
    else:
        email=data['email'] # Retrieve variables from json 
        pswd=data['password']
        if email == "" or pswd == "":
            return "", 400 # Incorrect parameters
        else:
            try:
                validation = validate_email(email) # Email validation
                email = validation.email
            except EmailNotValidError as e:
                return "", 400 # Incorrect email field    
            userdata=database_helper.get_userdata(email) # Retrive userdata from database
            check=database_helper.check_loginfromemail(email) # Check if user is logged in
            res=database_helper.remove_login_email(email) # COMMENT THIS LINE OUT TO CHECK WEBSOCKET CONNECTION
            if userdata!=None:
                #if check==None: # Remove for websocket connection
                password=pswd.encode('utf-8')
                f=database_helper.get_passfromemail(email) # Get hashed password from database
                userpass=f[0]
                result=bcrypt.checkpw(password,userpass) # Check hashed passwords match
                if result==False:
                    return "", 401 # Wrong password
                else:
                    letters = 'abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
                    token = ''
                    for i in range(0,36):
                        token += letters[math.floor(random() * len(letters))] # To create new token
                    result = database_helper.store_login(token,email)
                    return jsonify({'data': token}), 201 # Successfully signed in, Token created
                #else: #For checking already logged in users. Not needed for lab 3
                    #token = check
                    #return "", 409 # Already signed in
            else:
                return "", 404 # User does not exist

@app.route('/sign_up', methods=['POST'])
def sign_up(): # This fucntion is used for user signup
    data = request.get_json()
    if 'email' not in data or 'password' not in data or 'confirm' not in data or 'firstname' not in data or 'familyname' not in data or 'gender' not in data or 'city' not in data or 'country' not in data:
        return "", 400 # Incorrect fields in the JSON file
    else:
        email=data['email'] # Retrive variables from json
        password=data['password']
        confirm=data['confirm']
        firstname=data['firstname']
        familyname=data['familyname']
        gender=data['gender']
        city=data['city']
        country=data['country']
        if email == "" or password == "" or confirm == "" or firstname == "" or familyname == "" or gender == "" or city == "" or country == "":
            return "", 400 # Incorrect parameters
        else:
            try:
                validation = validate_email(email) # Email validation
                email = validation.email
            except EmailNotValidError as e:
                return "", 400 # Incorrect email field
            userdata=database_helper.get_userdata(email) # Get user's data
            if userdata==None:
                if len(password)>=6:
                    if password==confirm:
                        password=password.encode('utf-8')
                        userpass = bcrypt.hashpw(password, bcrypt.gensalt(10)) # Salting and hashing password
                        result = database_helper.store_user(firstname,familyname,gender,city,country,email,userpass) # Store the data to database
                        return "", 201 # Successfully created a new user
                    else:
                        return "", 400 # Passwords do not match
                else:
                    return "", 406 # Password is too short
            else:
                return "", 409 # User already exists

@app.route('/sign_out', methods=['DELETE'])
def sign_out(): # This function is used to sign out the user
    data = request.get_json()
    if 'publickey' not in data or 'hashed' not in data:
        return "", 400 # Incorrect fields in the JSON file or no token received
    else:
        publickey=data['publickey'] # Retrieve variables from json
        publickey = publickey.strip("\"")
        hashed=data['hashed']
        key = database_helper.check_loginfromemail(publickey) # Get token as secretkey from database
        if key!=None:
            key = "\""+key[0]+"\""
            message = key+"DELETE"+"/sign_out" # Assembling the message to hmac
            hmacvalue = hmac.new(key.encode(), message.encode(), hashlib.sha256).hexdigest() # Hmac hashing with sha 256
            if hmacvalue == hashed:
                token=key
                token = token.strip("\"")
                result = database_helper.remove_login(token) # Remove the token and email from the database
                if result:
                    return "", 200 # Successfully signed out
                else:
                    return "", 401 # Not signed in
            else:
                return "", 401 # Hmac authentication failed
        else:
            return "", 404 # Private key doesn't exist

@app.route('/change_password', methods=['PUT'])
def change_password():
    data = request.get_json()
    if 'publickey' not in data or 'hashed' not in data or 'params' not in data:
        return "", 400 # Incorrect fields in the JSON file or no token received
    else:
        publickey=data['publickey'] # Getting variables from json
        publickey = publickey.strip("\"")
        hashed=data['hashed']
        params=data['params']
        decoded = base64.b64decode(params) # Decode encoded variables
        message = str(decoded, "utf-8")
        mess = message.split(",")
        oldpassword = mess[0].split("\"")[3]
        newpassword = mess[1].split("\"")[3]
        if oldpassword == "" or newpassword == "":
            return "", 400 # Incorrect parameters
        else:
            key = database_helper.check_loginfromemail(publickey) # Get token as secretkey 
            if key!=None:
                key = "\""+key[0]+"\""
                message = message+"PUT"+"/change_password" # Assembling data for hmac
                hmacvalue = hmac.new(key.encode(), message.encode(), hashlib.sha256).hexdigest() # Hmac hashing with sha 256
                token=key
                if hmacvalue == hashed:
                    token = token.strip("\"")
                    check=database_helper.check_loginfromtoken(token) # Retreive email from database to check if user is logged in
                    if check!=None:
                        oldpassword = oldpassword.encode("utf-8")
                        email=check[0]
                        userpass=database_helper.get_passfromemail(email)[0]
                        result=bcrypt.checkpw(oldpassword,userpass) # Check password match
                        if result:
                            newpassword=newpassword.encode("utf-8")
                            userpass = bcrypt.hashpw(newpassword, bcrypt.gensalt(10)) # Salting and hashing the password to store in database
                            change = database_helper.change_pass(email,userpass)
                            if (userpass and change):
                                return "", 200 # Password changed
                            else:
                                return "", 500 # Cannot change password
                        else:
                            return "", 401 # Wrong password 
                    else:
                        return "", 401 # Not logged in
                else:
                    return "", 401 # Hmac authentication failed
            else:
                return "", 404 # Private key doesn't exist

@app.route('/get_user_data_by_token', methods=['GET'])
def get_user_data_by_token(): # This function is used to retrieve user data from the token
    data = request.headers['message'] # Getting data as request header
    mess = data.split(",")
    publickey = mess[0].split("\"")[3]
    hashed = mess[1].split("\"")[3]
    if publickey == "" or hashed == "":
        return "", 400 # Incorrect fields in the JSON file or no token received
    else:
        key = database_helper.check_loginfromemail(publickey) # Get token as secretkey
        if key!=None:
            key = "\""+key[0]+"\""
            message = "\""+publickey+"\""+"GET"+"/get_user_data_by_token" # Assembling data for hmac
            hmacvalue = hmac.new(key.encode(), message.encode(), hashlib.sha256).hexdigest() # Hmac hashing with sha 256
            if hmacvalue == hashed:
                token=key
                token = token.strip("\"")
                check = database_helper.check_loginfromtoken(token) # Retreive email from database to check if user is logged in
                if check==None:
                    return "", 401 # Not logged in
                else:
                    email=check[0]
                    userdata = database_helper.get_userdata(email) # Get user data from email
                    if userdata!=None:
                        return jsonify({'data': userdata}), 200 # User data retrieved
                    else:
                        return "", 404 # No such user
            else:
                return "", 401 # Hmac authentication failed
        else:
            return "", 404 # Private key doesn't exist

@app.route('/get_user_data_by_email', methods=['GET'])
def get_user_data_by_email(): # This function is user to get a user's data from email
    email = request.headers['email'] # Getting email and data as headers
    data = request.headers['message']
    mess = data.split(",")
    publickey = mess[0].split("\"")[4]
    publickey = publickey.strip("\\")
    publickey = publickey.strip("\"")
    hashed = mess[1].split("\"")[3]
    if publickey == "" or hashed == "" or email==None:
        return "", 400 # Incorrect fields in the JSON file or no token or email received
    else:
        decoded = base64.b64decode(email) # Decode encoded variables
        email = str(decoded, "utf-8")
        key = database_helper.check_loginfromemail(publickey) # Get token as secretkey
        if key!=None:
            key = "\""+key[0]+"\""
            message = email+"GET"+"/get_user_data_by_email" # Assembling data for hmac
            hmacvalue = hmac.new(key.encode(), message.encode(), hashlib.sha256).hexdigest() # Hmac hashing with sha 256
            if hmacvalue == hashed:
                token=key
                token = token.strip("\"")
                email = email.strip("\"")
                check=database_helper.check_loginfromtoken(token) # Retreive email from database to check if user is logged in
                if check!=None:
                    userdata = database_helper.get_userdata(email) # Get user data from email
                    if userdata!=None:
                        return jsonify({'data': userdata}), 200 # User data retrieved
                    else:
                        return "", 404 # No such user
                else:
                    return "", 401 # Not signed in
            else:
                return "", 401 # Hmac authentication failed
        else:
            return "", 404 # Private key doesn't exist

@app.route('/get_user_messages_by_token', methods=['GET'])
def get_user_messages_by_token(): # This function is used to get a user's messages by token
    data = request.headers['message'] # Getting data as header
    mess = data.split(",")
    publickey = mess[0].split("\"")[4]
    publickey = publickey.strip("\\")
    hashed = mess[1].split("\"")[3]
    if publickey == "" or hashed == "":
        return "", 400 # Incorrect fields in the JSON file or no token received
    else:
        key = database_helper.check_loginfromemail(publickey) # Get token as secretkey
        if key!=None:
            key = "\""+key[0]+"\""
            message = "\""+publickey+"\""+"GET"+"/get_user_messages_by_token" # Assembling data for hmac
            hmacvalue = hmac.new(key.encode(), message.encode(), hashlib.sha256).hexdigest() # Hmac hashing with sha 256
            if hmacvalue == hashed:
                token=key
                token = token.strip("\"")
                check = database_helper.check_loginfromtoken(token) # Retreive email from database to check if user is logged in
                if check==None:
                    return "", 401 # Not signed in
                else:
                    email=check[0]
                    messages = database_helper.get_messages(email) # Get user messages from email
                    userexist = database_helper.user_exist(email) # Check if the user exists without logging in
                    if userexist:
                        return jsonify({'data': messages}), 200 # User messages retrieved
                    else:
                        return "", 404 # No such user
            else:
                return "", 401 # Hmac authentication failed
        else:
            return "", 404 # Private key doesn't exist

@app.route('/get_user_messages_by_email', methods=['GET'])
def get_user_messages_by_email(): # This function is used to get user's messages from email
    email = request.headers['email'] # Getting email and data as headers
    data = request.headers['message']
    mess = data.split(",")
    publickey = mess[0].split("\"")[4]
    publickey = publickey.strip("\\")
    hashed = mess[1].split("\"")[3]
    if publickey == "" or hashed == "" or email==None:
        return "", 400 # Incorrect fields in the JSON file or no token or email received
    else:
        decoded = base64.b64decode(email)
        email = str(decoded, "utf-8")
        key = database_helper.check_loginfromemail(publickey) # Get token as secretkey
        if key!=None:
            key = "\""+key[0]+"\""
            message = email+"GET"+"/get_user_messages_by_email" # Assembling data for hmac
            hmacvalue = hmac.new(key.encode(), message.encode(), hashlib.sha256).hexdigest() # Hmac hashing with sha 256
            if hmacvalue == hashed:
                token=key
                token = token.strip("\"")
                email = email.strip("\"")
                check=database_helper.check_loginfromtoken(token) # Retreive email from database to check if user is logged in
                if check!=None:
                    messages = database_helper.get_messages(email) # Get user messages from email
                    userexist = database_helper.user_exist(email) # Check if the user exists without logging in
                    if userexist:
                        return jsonify({'data': messages}), 200 # User messages retrieved
                    else:
                        return "", 404 # No such user
                else:
                    return "", 401 # Not signed in
            else:
                return "", 401 # Hmac authentication failed
        else:
            return "", 404 # Private key doesn't exist

@app.route('/post_message', methods=['POST'])
def post_message(): # This function enables a message to be posted to a user's wall
    data = request.get_json()
    if 'publickey' not in data or 'hashed' not in data or 'params' not in data:
        return "", 400 # Incorrect fields in the JSON file or no token received
    else:
        publickey=data['publickey'] # Retrieving variables from json
        hashed=data['hashed']
        params=data['params']
        decoded = base64.b64decode(params) # Decode encoded variables
        result = str(decoded, "utf-8")
        mess = result.split(",")
        toemail = mess[0].split("\"")[3]
        message = mess[1].split("\"")[3]
        if toemail == "" or message == "":
            return "", 400 # Incorrect parameters
        else:
            publickey = publickey.strip("\"")
            key = database_helper.check_loginfromemail(publickey) # Get token as secretkey
            if key!=None:
                key = "\""+key[0]+"\""
                result = result+"POST"+"/post_message" # Assembling data for hmac
                hmacvalue = hmac.new(key.encode(), result.encode(), hashlib.sha256).hexdigest() # Hmac hashing with sha 256
                if hmacvalue == hashed:
                    token=key
                    token = token.strip("\"")
                    userexist = database_helper.user_exist(toemail) # Check if the user exists without logging in
                    check = database_helper.check_loginfromtoken(token) # Retreive email from database to check if user is logged in
                    if check!=None:
                        email = database_helper.check_loginfromtoken(token)[0]
                        if userexist:
                            post = database_helper.add_message(email, message, toemail) # Store message to that user's message database
                            if post:
                                return "", 200 # Message posted
                            else:
                                return "", 500 # Cannot post message
                        else:
                            return "", 404 # No such user
                    else:
                        return "", 401 # Not signed in
                else:
                    return "", 401 # Hmac authentication failed
            else:
                return "", 404 # Private key doesn't exist        

if __name__ == '__main__':
    app.debug = True
    app.run()
