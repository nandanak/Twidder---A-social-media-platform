from flask import Flask, request, jsonify
import bcrypt
from email_validator import validate_email, EmailNotValidError
import math
import database_helper
from random import random
from flask import g

app = Flask(__name__)

@app.teardown_request
def after_request(exception):
    database_helper.disconnect_db()


@app.route('/sign_in', methods=['POST'])
def sign_in():
    data = request.get_json()
    if 'email' not in data or 'password' not in data:
        return "", 400 # Incorrect fields in the JSON file
    else:
        email=data['email']
        pswd=data['password']
        try:
            validation = validate_email(email)
            email = validation.email
        except EmailNotValidError as e:
            return "", 400 # Incorrect email field
        userdata=database_helper.get_userdata(email)
        check=database_helper.check_loginfromemail(email)
        if userdata!=None:
            if check==None:
                password=pswd.encode('utf-8')
                f=database_helper.get_passfromemail(email)
                userpass=f[0]
                result=bcrypt.checkpw(password,userpass)
                if result==False:
                    return "", 401 # Wrong password
                else:
                    letters = 'abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
                    token = ''
                    for i in range(0,36):
                        token += letters[math.floor(random() * len(letters))]
                    result = database_helper.store_login(token,email)
                    return jsonify({'data': token}), 201 # Successfully signed in, Token created
            else:
                token = check
                return "", 409 # Already signed in
        else:
            return "", 404 # User does not exist

@app.route('/sign_up', methods=['POST'])
def sign_up():
    data = request.get_json()
    if 'email' not in data or 'firstname' not in data or 'familyname' not in data or 'gender' not in data or 'city' not in data or 'country' not in data or 'password' not in data or 'confirm' not in data:
        return "", 400 # Incorrect fields in the JSON file
    else:
        email=data['email']
        try:
            validation = validate_email(email)
            email = validation.email
        except EmailNotValidError as e:
            return "", 400 # Incorrect email field
        userdata=database_helper.get_userdata(email)
        if userdata==None:
            firstname = data['firstname']
            familyname = data['familyname']
            gender = data['gender']
            city = data['city']
            country = data['country']
            password = data['password']
            confirm = data['confirm']
            if len(password)>=6:
                if password==confirm:
                    password=password.encode('utf-8')
                    userpass = bcrypt.hashpw(password, bcrypt.gensalt(10))
                    result = database_helper.store_user(firstname,familyname,gender,city,country,email,userpass)
                    return "", 201 # Successfully created a new user
                else:
                    return "", 400 # Passwords do not match
            else:
                return "", 406 # Password is too short
        else:
            return "", 409 # User already exists

@app.route('/sign_out', methods=['DELETE'])
def sign_out():
    token = request.headers['Authorization']
    if token==None:
        return "", 400 # No token received
    else:
        result = database_helper.remove_login(token)
        if (result):
            return "", 200 # Successfully signed out
        else:
            return "", 401 # Not signed in

@app.route('/change_password', methods=['PUT'])
def change_password():
    data = request.get_json()
    token = request.headers['Authorization']
    if 'oldpassword' not in data or 'newpassword' not in data or token==None:
        return "", 400 # Incorrect fields in the JSON file or no token received
    else:
        oldpassword = data['oldpassword']
        newpassword = data['newpassword']
        check=database_helper.check_loginfromtoken(token)
        if check!=None:
            oldpassword = oldpassword.encode("utf-8")
            email=check[0]
            userpass=database_helper.get_passfromemail(email)[0]
            result=bcrypt.checkpw(oldpassword,userpass)
            if (result):
                newpassword=newpassword.encode("utf-8")
                userpass = bcrypt.hashpw(newpassword, bcrypt.gensalt(10))
                change = database_helper.change_pass(email,userpass)
                if (userpass and change):
                    return "", 200 # Password changed
                else:
                    return "", 500 # Cannot change password
            else:
                return "", 401 # Wrong password 
        else:
            return "", 401 # Not logged in

@app.route('/get_user_data_by_token', methods=['GET'])
def get_user_data_by_token():
    token = request.headers['Authorization']
    if token==None:
        return "", 400 # No token received
    else:
        check = database_helper.check_loginfromtoken(token)
        if check==None:
            return "", 401 # Not logged in
        else:
            email=check[0]
            userdata = database_helper.get_userdata(email)
            if userdata!=None:
                return jsonify({'data': userdata}), 200 # User data retrieved
            else:
                return "", 404 # No such user

@app.route('/get_user_data_by_email', methods=['GET'])
def get_user_data_by_email():
    token = request.headers['Authorization']
    email = request.headers['email']
    if token==None or email==None:
        return "", 400 # No token or email received
    else:
        check=database_helper.check_loginfromtoken(token)
        if check!=None:
            userdata = database_helper.get_userdata(email)
            if userdata!=None:
                return jsonify({'data': userdata}), 200 # User data retrieved
            else:
                return "", 404 # No such user
        else:
            return "", 401 # Not signed in

@app.route('/get_user_messages_by_token', methods=['GET'])
def get_user_messages_by_token():
    token = request.headers['Authorization']
    if token==None:
        return "", 400 # No token received
    else:
        check = database_helper.check_loginfromtoken(token)
        if check==None:
            return "", 401 # Not signed in
        else:
            email=check[0]
            messages = database_helper.get_messages(email)
            userexist = database_helper.user_exist(email)
            if userexist:
                return jsonify({'data': messages}), 200 # User messages retrieved
            else:
                return "", 404 # No such user

@app.route('/get_user_messages_by_email', methods=['GET'])
def get_user_messages_by_email():
    token = request.headers['Authorization']
    email = request.headers['email']
    if token==None or email==None:
        return "", 400 # No token or email received
    else:
        check=database_helper.check_loginfromtoken(token)
        if check!=None:
            messages = database_helper.get_messages(email)
            userexist = database_helper.user_exist(email)
            if userexist:
                return jsonify({'data': messages}), 200 # User messages retrieved
            else:
                return "", 404 # No such user
        else:
            return "", 401 # Not signed in

@app.route('/post_message', methods=['POST'])
def post_message():
    data = request.get_json()
    token = request.headers['Authorization']
    if 'toemail' not in data or 'message' not in data or token==None:
        return "", 400 # Incorrect fields in the JSON file or no token received
    else:
        message=data['message']
        toemail=data['toemail']
        userexist = database_helper.user_exist(toemail)
        check = database_helper.check_loginfromtoken(token)
        if check!=None:
            email = database_helper.check_loginfromtoken(token)[0]
            if userexist:
                post = database_helper.add_message(email, message, toemail)
                if post:
                    return "", 200 # Message posted
                else:
                    return "", 500 # Cannot post message
            else:
                return "", 404 # No such user
        else:
            return "", 401 # Not signed in

if __name__ == '__main__':
    app.debug = True
    app.run()
