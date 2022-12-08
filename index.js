// var express = require('express');
const express = require("express");
var path = require('path'); 
require("dotenv").config()
var app = express();
var server = require('http').Server(app);
var bodyParser = require('body-parser');
var io = require('socket.io')(server);;
//Twitter
var Twitter = require('twitter');
var request = require("request");
//MySQL
var mysql = require('mysql');
var connect =  mysql.createPool({
	host : 'localhost',
	user : 'root',
	password: '',
	database: 'my_db'
});

// server.listen(3000);
app.listen(process.env.PORT, () => {
	console.log(`Server running on port ${process.env.PORT}`)
  })
//Twitter Credentials
var client = new Twitter({
	consumer_key: process.env.API_KEY,
	consumer_secret: process.env.API_SECRET_KEY,
	access_token_key: process.env.ACCESS_TOKEN,
	access_token_secret: process.env.ACCESS_TOKEN_SECRET_KEY
});

//Default Route
app.get('/',function(req,res){
	res.set({
		'Access-Control-Allow-Origin' : '*'
	});
	return res.redirect('/public/index.html');
});

// console.log("Server listening at : 3000");
app.use('/public', express.static(__dirname + '/public'));
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
	extended: true
}));

io.on('connection', function (socket) {
  
	socket.emit('welcome', { data: 'welcome' });
	socket.on('keyword' , function(data){
		console.log(data);
		var keyword = data.keyword;
		var stream = client.stream('statuses/filter', {track: keyword});
		stream.on('data', function(event) {
			var tweet = event.text;
			var user = event.user.name;
			
			var insert_R = 'INSERT INTO tweet_repo(keyword,user,tweet) VALUE(?,?,?)';
			//establishing connection
			connect.getConnection(function(err, connection){				
			  //Inserting a record into details
				connection.query(insert_R,[keyword,user,tweet], function(err,res){
					if(err) throw err;
					else {
							var content = {
								keyword : keyword,
								user : user,
								tweet : tweet
							}
							console.log("Keyword is ::>> " + keyword);
							console.log("Tweeted by ::>>" + event.user.name);
							console.log("Tweet is ::>>" + event.text );
							console.log('Details added successfully');
							socket.emit('livetweets' , { data : content })

					}
				});
				//releasing connection
				socket.on('stop' , function(data){
					connection.release();
				});
				
			});
			
		});

		stream.on('error', function(error) {
			throw error;
		});	  
	});
});
