DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS loggedInUsers;
DROP TABLE IF EXISTS messages;

CREATE TABLE users (
       firstname VARCHAR(50) NOT NULL,
       familyname VARCHAR(50) NOT NULL,
       gender VARCHAR(6) NOT NULL,
       city VARCHAR(50) NOT NULL,
       country VARCHAR(50) NOT NULL,
       email VARCHAR(50) PRIMARY KEY,
       password VARCHAR(100) NOT NULL);

CREATE TABLE loggedInUsers (
       token VARCHAR(100) PRIMARY KEY,
       email VARCHAR(50) NOT NULL,
       FOREIGN KEY (email) REFERENCES users(email));

CREATE TABLE messages (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       fromuser VARCHAR(50) NOT NULL,
       message TEXT NOT NULL,
       touser VARCHAR(50) NOT NULL,
       FOREIGN KEY (touser) REFERENCES users(email),
       FOREIGN KEY (fromuser) REFERENCES users(email));
