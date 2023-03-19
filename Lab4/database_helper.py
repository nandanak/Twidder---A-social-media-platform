from flask import Flask, current_app, g
import sqlite3
import click
from flask.cli import with_appcontext

DATABASE = 'database.db'

def get_db():
    db = getattr(g, 'db', None)
    if db is None:
        db = g.db = sqlite3.connect(DATABASE)
    return db

def disconnect_db():
    db = getattr(g, 'db', None)
    if db is not None:
        g.db.close()
        g.db = None

def get_userdata(email): # To get user's details
    cursor = get_db().execute("select firstname, familyname, gender, city, country, email from users where email = ?;", [email])
    result = cursor.fetchone()
    cursor.close()
    return result

def get_passfromemail(email): # To get user's password from email
    cursor = get_db().execute("select password from users where email = ?;", [email])
    passwd = cursor.fetchone()
    cursor.close()
    return passwd

def store_login(token, email): # To save login token of a user
    try:
        get_db().execute("insert into loggedInUsers values (?,?);", [token, email])
        get_db().commit()
        return True
    except:
        return False

def check_loginfromemail(email): # To check if a user has logged in from their email
    cursor = get_db().execute("select token from loggedInUsers where email = ?", [email])
    result = cursor.fetchone()
    cursor.close()
    return result

def check_loginfromtoken(token): # To check if a user has logged in from their token
    cursor = get_db().execute("select email from loggedInUsers where token = ?", [token])
    result = cursor.fetchone()
    cursor.close()
    return result

def store_user(firstname,familyname,gender,city,country,email,password): # To save user data to database
    try:
        get_db().execute("insert into users values (?,?,?,?,?,?,?)", [firstname,familyname,gender,city,country,email,password])
        get_db().commit()
        print("okay")
        return True
    except:
        return False

def remove_login(token): # To remove log in data with token
    cursor = get_db().execute("select email from loggedInUsers where token = ?", [token])
    result = cursor.fetchone()
    cursor.close()
    if result==None:
        return False
    else:
        try:
            res = get_db().execute("delete from loggedInUsers where token = ?", [token])
            get_db().commit()
            return True
        except:
            return False

def remove_login_email(email): # To remove log in data with email
    cursor = get_db().execute("select token from loggedInUsers where email = ?", [email])
    result = cursor.fetchone()
    cursor.close()
    if result==None:
        return False
    else:
        try:
            res = get_db().execute("delete from loggedInUsers where email = ?", [email])
            get_db().commit()
            return True
        except:
            return False

def change_pass(email,password): # To update the new password in database
    try:
        get_db().execute("update users set password = ? where email = ?", [password,email])
        get_db().commit()
        return True
    except:
        return False

def get_messages(email): # To retrieve a user's messages
    cursor = get_db().execute("select message,fromuser from messages where touser = ?", [email])
    messages = cursor.fetchall()
    cursor.close()
    return messages

def user_exist(email): # To check if a user exists in database
    cursor = get_db().execute("select email from users where email = ?", [email])
    result = cursor.fetchone()
    cursor.close()
    if result==None:
        return False
    else:
        return True

def add_message(email,message,toemail): # To add a message to the message table of a user
    try:
        get_db().execute("insert into messages(fromuser, message, touser) values (?,?,?)", [email,message,toemail])
        get_db().commit()
        return True
    except:
        return False
