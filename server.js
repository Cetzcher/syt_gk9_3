var express = require('express'),
  app = express(),
  port = process.env.PORT || 3030;

var mongoose = require('mongoose');

//Set up default mongoose connection
var mongoDB = 'mongodb://127.0.0.1/my_database';
mongoose.connect(mongoDB, {
  useMongoClient: true
});

//Get the default connection
var db = mongoose.connection;

var bodyParser  = require('body-parser');
var config      = require('./config/database'); // get db config file
var User        = require('./app/models/user'); // get the mongoose model
 
// get our request parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs'); // setup ejs as rendering engine for dynamic content.
app.set('views', __dirname + "/app/views");



/*
	DEFINE CORE REST FUNCTIONS HERE
	IN PRODUCTION, THIS SHOULD BE WITHIN IT'S
	OWN DEDICATED FILE, FOR THE SAKE OF SIMPLICITY
	THIS WILL BE IMPLENTED HERE.

	since mongoose is asnyc direct return values cannot be accessed,
	use callback(reslut) whereas result is a object simmilar to:
	{success: bool, error: errors_if_any }

*/


function create_user(username, mail, password, callback)
{
	// note: password hashing is done in the user scheme
	if(!username || !mail || !password) 
		return callback({success: false, error: "incomplete form"});
	// attempt to create user
	
	var newUser = new User({
      name: username,
      password: password,
      email_addr: mail
    });

	newUser.save(function(err){
		var is_err = err ? false : true;
		return callback({success: is_err, error: "user already exists"});
	});
}

function delete_user(username, callback)
{
	User.findOne(
		{name: username},
		function(err) {
			if(err)
				return callback({success: false, error: err, msg: "user not deleted / doesnt exist"});
		}).remove(function(err) {
			return callback({success: err ? false : true, error: err, msg: err ? "user not deleted" : "user deleted"});
		});
	
}

function update_user(username, new_data)
{
	// todo update
}

function show_user(username, password, callback)
{
	User.findOne(
		{ name: username },
		function(err, user) {
			if(err || !user)
				return callback({success: false, error: 'Authentication failed. password or username is incorrect' });
      		// check if password matches
      		user.comparePassword(password, function (err, isMatch) {
      				callback({success: (isMatch && !err), error: "Authentication failed. password or username is incorrect", mail: user.email_addr});
      			});
    		});
}


// setup post response for the static signup
app.post('/signup', function(req, res) {
	
	var body = req.body;
	create_user(body.username, body.mail, body.pw,
		function(result){
			if(result.success)
				return res.render("show_user", {user: body.username, mail: body.mail});
			res.render("error", {error: result.error});
		});
});

app.post("/login", function(req, res){
	return show_user(req.body.username, req.body.pw, function(result){
			if(result.success)
				return res.render("show_user", {user: req.body.username, mail: result.mail});
			res.render("error", {error: result.error});
		});
});

app.post("/delete_user", function(req, res){
	return delete_user(req.body.username, function(result){
			res.sendFile(__dirname + "/public/login/index.html"); 
		});
});

app.post("/update_user", function(req, res){
	return res.json({error: "not implemented"});
});


// USE THE ROUTES BELOW FOR TESTING

app.post("/api/signup", function (req, res){
	create_user(req.body.username, req.body.mail, req.body.pw,
	 	function(result) {
			return res.json(result);
	});
});

app.post("/api/login", function (req, res) {
	show_user(req.body.username, req.body.pw, 
		function(result){
			return res.json(result);
		});
});


app.post("/api/delete_user", function (req, res) {
	return delete_user(req.body.username, 
		function(result){
			return res.json(result); 
		});
});



 app.listen(port);
console.log('There will be dragons: http://localhost:' + port);
console.log("views @: " + __dirname + "/app/views");