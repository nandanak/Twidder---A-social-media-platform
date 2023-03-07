from flask import Flask, render_template, request, jsonify
import bcrypt
import math
import database_helper
from random import random
from flask import g

app = Flask(__name__)
#app.debug = True

#@app.before_request
#def before_request():
#    database_helper.get_db()
#@app.route('/')
#def index():
#    return render_template("client.html")

@app.teardown_request # (((((NOWW!!!)))))
def after_request(exception):
    database_helper.disconnect_db()


@app.route('/sign_in', methods=['POST'])
def sign_in():
    data = request.get_json()
    email=data['email']
    pswd=data['password']
    userdata=database_helper.get_userdata(email)
    check=database_helper.check_loginfromemail(email)
    if userdata!=None:
        if check!=None:
            token = check
            return jsonify({'data': token}), 200
        else:
            password=pswd.encode('utf-8')
            f=database_helper.get_passfromemail(email)
            userpass=f[0]
            result=bcrypt.checkpw(password,userpass)
            if result==False:
                return "", 401 #jsonify({'success': False, 'message': "Wrong password"})
            else:
                letters = 'abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
                token = ''
                for i in range(0,36):
                    token += letters[math.floor(random() * len(letters))]
                result = database_helper.store_login(token,email)
                return jsonify({'data': token}), 201 #({'success': True, 'message': "Successfully signed in", 'data': token})
    else:
        return "", 401 #jsonify({'success': False, 'message': "User does not exist"})

@app.route('/sign_up', methods=['POST'])
def sign_up():
    data = request.get_json()
    email=data['email']
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
                return "", 201 #jsonify({'success': True, 'message': "Successfully created a new user"})
            else:
                return "", 400 #jsonify({'success': False, 'message': "Passwords do not match"})
        else:
            return "", 406 #jsonify({'success': False, 'message': "Password is too short"})
    else:
        return "", 409 #jsonify({'success': False, 'message': "User already exists"})

@app.route('/sign_out', methods=['POST'])
def sign_out():
    token = request.headers['Authorization']
    result = database_helper.remove_login(token)
    if (result):
        return "", 200 #jsonify({'success': True, 'message': "Successfully signed out"})
    else:
        return "", 401 #jsonify({'success': False, 'message': "You are not signed in"})

@app.route('/change_password', methods=['POST'])
def change_password():
    data = request.get_json()
    token = request.headers['Authorization']
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
                return "", 200 #jsonify({'success': True, 'message': "Password changed"})
            else:
                return "", 500 #jsonify({'success': False, 'message': "Cannot change password. Try again"})
        else:
            return "", 401 #jsonify({'success': False, 'message': "Wrong password"})
    else:
        return "", 401 #jsonify({'success': False, 'message': "You are not logged in"})

@app.route('/get_user_data_by_token', methods=['GET'])
def get_user_data_by_token():
    #token = request.args.get('token')
    token = request.headers['Authorization']
    if token==None:
        return "", 400
    else:
        check = database_helper.check_loginfromtoken(token)
        if check==None:
            return "", 401
        else:
            email=check[0]
            userdata = database_helper.get_userdata(email)
            if userdata!=None:
                return jsonify({'data': userdata}), 200 #({'success': True, 'message': "User data retrieved", 'data': userdata})
            else:
                return "", 400

@app.route('/get_user_data_by_email', methods=['GET'])
def get_user_data_by_email():
    token = request.headers['Authorization']
    email = request.headers['email']
    if token==None or email==None:
        return "", 400
    else:
        check=database_helper.check_loginfromtoken(token)
        if check!=None:
            userdata = database_helper.get_userdata(email)
            if userdata!=None:
                return jsonify({'data': userdata}), 200 #({'success': True, 'message': "User data retrieved", 'data': userdata})
            else:
                return "", 404 #jsonify({'success': False, 'message': "No such user"})
        else:
            return "", 401 #jsonify({'success': False, 'message': "You are not signed in"})

@app.route('/get_user_messages_by_token', methods=['GET'])
def get_user_messages_by_token():
    token = request.headers['Authorization']
    if token==None:
        return "", 400
    else:
        check = database_helper.check_loginfromtoken(token)
        if check==None:
            return "", 401
        else:
            email=check[0]
            messages = database_helper.get_messages(email)
            userexist = database_helper.user_exist(email)
            if userexist:
                return jsonify({'data': messages}), 200 #({'success': True, 'message': "User messages retrieved", 'data': messages})
            else:
                return "", 400

@app.route('/get_user_messages_by_email', methods=['GET'])
def get_user_messages_by_email():
    token = request.headers['Authorization']
    email = request.headers['email']
    if token==None or email==None:
        return "", 400
    else:
        check=database_helper.check_loginfromtoken(token)
        if check!=None:
            messages = database_helper.get_messages(email)
            userexist = database_helper.user_exist(email)
            if userexist:
                return jsonify({'data': messages}), 200 #({'success': True, 'message': "User messages retrieved", 'data': messages})
            else:
                return "", 404 #jsonify({'success': False, 'message': "No such user"})
        else:
            return "", 401 #jsonify({'success': False, 'message': "You are not signed in"})

@app.route('/post_message', methods=['POST'])
def post_message():
    data = request.get_json()
    token = request.headers['Authorization']
    message=data['message']
    toemail=data['toemail']
    userexist = database_helper.user_exist(toemail)
    check = database_helper.check_loginfromtoken(token)
    if check!=None:
        email = database_helper.check_loginfromtoken(token)[0]
        if userexist:
            post = database_helper.add_message(email, message, toemail)
            if post:
                return "", 200 #jsonify({'success': True, 'message': "Message posted"})
            else:
                return "", 500 #jsonify({'success': False, 'message': "Cannot post message. Try again"})
        else:
            return "", 404 #jsonify({'success': False, 'message': "No such user"})
    else:
        return "", 401 #jsonify({'success': False, 'message': "You are not signed in"})

if __name__ == '__main__':
    #database_helper.init_db(app)
    app.debug = True
    app.run()
