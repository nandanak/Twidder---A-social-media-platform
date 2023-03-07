from flask import Flask, current_app, g
import sqlite3
import click
from flask.cli import with_appcontext

DATABASE = 'database.db'



#def init_db():
#    db = get_db()
#    with server.open_resource('schema.sql') as f:
#        db.executescript(f.read().decode('utf8'))

#    init_db();
def get_db():
    db = getattr(g, 'db', None)
    if db is None:
        db = g.db = sqlite3.connect(DATABASE)
    return db

#'''@app.teardown_appcontext
#def close_connection():
#    db = getattr(g, '_database', None)
#    if db is not None:
#        db.close()'''

#def init_db(app):
#    with app.app_context():
#        db = get_db()
#        with app.open_resource('schema.sql', mode='r') as f:
#            db.cursor().executescript(f.read())
#        db.commit()


#def query_db(query, args=(), one=False):
#    cur = get_db().execute(query, args)
#    rv = cur.fetchall()
#    cur.close()
#    get_db().commit()
#    return (rv[0] if rv else None) if one else rv

def disconnect_db():
    db = getattr(g, 'db', None)
    if db is not None:
        g.db.close()
        g.db = None

def get_userdata(email):
    cursor = get_db().execute("select firstname, familyname, gender, city, country, email from users where email = ?;", [email])
    result = cursor.fetchone()
    cursor.close()
#    result = query_db('select firstname, familyname, gender, city, country, email from users where email = ?', [email], one=True)
    return result

def get_passfromemail(email):
    cursor = get_db().execute("select password from users where email = ?;", [email])
    passwd = cursor.fetchone()
    cursor.close()
    #passwd = query_db('select password from users where email = ?', [email], one=True)
    return passwd

def store_login(token, email):
    try:
        get_db().execute("insert into loggedInUsers values (?,?);", [token, email])
        get_db().commit()
        return True
    except:
        return False
    #result = query_db('insert into loggedInUsers values (?,?)', [token,email])
    #get_db().commit()
    #if result==None:
    #    return False
    #else:
    #    return True

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
    #result = query_db('insert into users values (?,?,?,?,?,?,?)', [firstname,familyname,gender,city,country,email,password])
    ##get_db().commit()
    #if result==None:
    #    return False
    #else:
    #    return True

def remove_login(token):
    cursor = get_db().execute("select email from loggedInUsers where token = ?", [token])
    result = cursor.fetchone()
    cursor.close()
    #result = query_db('select email from loggedInUsers where token = ?', [token], one=True)
    if result==None:
        return False
    else:
        try:
            res = get_db().execute("delete from loggedInUsers where token = ?", [token])
            get_db().commit()
            #print(loggedInUsers)
            return True
        except:
            return False
        #res = query_db('delete from loggedInUsers where token = ?', [token])
        #get_db().commit()
        #return True

def change_pass(email,password):
    try:
        get_db().execute("update users set password = ? where email = ?", [password,email])
        get_db().commit()
        return True
    except:
        return False
    #result = query_db('update users set password = ? where email = ?', [password,email])
    #get_db().commit()
    #if result==None:
    #    return False
    #else:
    #    return True

def get_messages(email):
    cursor = get_db().execute("select message,fromuser from messages where touser = ?", [email])
    messages = cursor.fetchall()
    cursor.close()
    #messages = query_db('select message,fromuser from messages where touser = ?', [email], one=False)
    return messages

def user_exist(email):
    cursor = get_db().execute("select email from users where email = ?", [email])
    result = cursor.fetchone()
    cursor.close()
    #result = query_db('select email from users where email = ?', [email], one=True)
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
    #result = query_db('insert into messages(fromuser, message, touser) values (?,?,?)', [email,message,toemail])
    #get_db().commit()
    #if result==None:
    #    return False
    #else:
    #    return True
