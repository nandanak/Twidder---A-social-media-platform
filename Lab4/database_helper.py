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

def get_userdata(email):
    cursor = get_db().execute("select firstname, familyname, gender, city, country, email from users where email = ?;", [email])
    result = cursor.fetchone()
    cursor.close()
    return result

def get_passfromemail(email):
    cursor = get_db().execute("select password from users where email = ?;", [email])
    passwd = cursor.fetchone()
    cursor.close()
    return passwd

def store_login(token, email):
    try:
        get_db().execute("insert into loggedInUsers values (?,?);", [token, email])
        get_db().commit()
        return True
    except:
        return False

def check_loginfromemail(email):
    cursor = get_db().execute("select token from loggedInUsers where email = ?", [email])
    result = cursor.fetchone()
    cursor.close()
    return result

def check_loginfromtoken(token):
    cursor = get_db().execute("select email from loggedInUsers where token = ?", [token])
    result = cursor.fetchone()
    cursor.close()
    return result

def store_user(firstname,familyname,gender,city,country,email,password):
    try:
        get_db().execute("insert into users values (?,?,?,?,?,?,?)", [firstname,familyname,gender,city,country,email,password])
        get_db().commit()
        print("okay")
        return True
    except:
        return False

def remove_login(token):
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

def change_pass(email,password):
    try:
        get_db().execute("update users set password = ? where email = ?", [password,email])
        get_db().commit()
        return True
    except:
        return False

def get_messages(email):
    cursor = get_db().execute("select message,fromuser from messages where touser = ?", [email])
    messages = cursor.fetchall()
    cursor.close()
    return messages

def user_exist(email):
    cursor = get_db().execute("select email from users where email = ?", [email])
    result = cursor.fetchone()
    cursor.close()
    if result==None:
        return False
    else:
        return True

def add_message(email,message,toemail):
    try:
        get_db().execute("insert into messages(fromuser, message, touser) values (?,?,?)", [email,message,toemail])
        get_db().commit()
        return True
    except:
        return False