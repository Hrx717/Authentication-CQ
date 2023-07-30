const express = require("express");
const fs = require('fs');
var session = require('express-session')
const hbs = require('hbs');

const app = express();
const PORT = process.env.PORT || 7000;

app.use(session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: true,
}))

app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.set('view engine', 'hbs');
app.set('views', __dirname + '/templates/views');
hbs.registerPartials(__dirname + '/templates/partials');

//read userData file
let readUsersFile;
fs.readFile("./userData.txt", 'utf-8', (err, data) => {
    if(err) {console.log(err)}
    else {readUsersFile = JSON.parse(data);}
});

function saveUserToFile(content) {
    fs.writeFile('./userData.txt',content, (err,content) => {
        if(err) {console.log(err)}
        else{console.log('user added succesfully')}
    });
}

app.get("/", (req,res) => {
    if(!req.session.isLoggedIn) {
        res.redirect('/auth/login');
        return;
    }
    res.render('Home', {username: req.session.username});
});

app.get("/auth/login", (req,res) => {
    res.render('Login');
});

app.get("/auth/signup", (req,res) => {
    res.render('Signup');
});

app.get("/auth/logout", (req,res) => {
    req.session.isLoggedIn = false;
    req.session.username = undefined;
    res.redirect("/auth/login");
});

app.get("/auth/data", (req,res) => {
    if(!req.session.isLoggedIn) {
        res.redirect('/auth/login');
        return;
    }
    res.render('Data', {Data: readUsersFile});
});

// post routes
app.post("/auth/signup", (req,res) => {
    let emailPresnt = false;
    let passwordMatch = false;
    if(req.body.password !== req.body.cPassword) {
        res.render('Signup', {err: "Passwords didn't match*"});
        passwordMatch = true;
    }
    else {
        readUsersFile.forEach(element => {
            if(element.email === req.body.email) {
                res.render('Signup', {err: "Email already exist*"});
                emailPresnt = true;
            }
        });
    }

    if(!emailPresnt && !passwordMatch) {
        readUsersFile.push(req.body);
        saveUserToFile(JSON.stringify(readUsersFile));
        req.session.isLoggedIn = true;
        req.session.username = req.body.firstName;
        res.redirect('/');
    }
});

app.post("/auth/login", (req,res) => {
    let userExist = false;
    readUsersFile.forEach(element => {
        if(element.email === req.body.email && element.password === req.body.password) {
            req.session.isLoggedIn = true;
            req.session.username = element.firstName;
            userExist = true;
            res.redirect('/');
        }
    });
    if(!userExist)  {
        res.render('Login', {err : 'Invalid email or password'});
    }
});

app.listen(PORT, () => {
    console.log(`running at ${PORT}`);
});