const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const MongoClient = require('mongodb').MongoClient;
const Info = require('./secretInfo.json');
const jwt = require('jsonwebtoken');
const Hasher = require('jshashes');
const port = 80;

let app = express();
let urlencodedParser = bodyParser.urlencoded({extended: false});
let uri = 'mongodb+srv://' + Info.dblogin + ':' + Info.dbpassword + '@cluster0.bihyb.mongodb.net/TODO?retryWrites=true&w=majority';
let mongoClient = new MongoClient(uri,  {useNewUrlParser: true, useUnifiedTopology: true});
let dbClient;
let hasher = new Hasher.SHA512();

// middleware

app.use(cookieParser());
app.use(urlencodedParser);

app.use('/notes.html', (req, res, next) => {
	if (!req.cookie || !req.cookie.jwt) {
		res.redirect('/authorization.html');
		return;
	} 
	jwt.verify(req.cookie.jwt, Info.jwt_secret, (err, data) => {
		if (err) {
			res.clearCookie('jwt');
			res.clearCookie('authRes');
			res.redirect('/authorization.html');
		} else {
			console.log('login by ' + data.login);
			next();
		}
	});
	
});

app.use(express.static(__dirname + '/public'));

// connect

mongoClient.connect((err, client) => {
	if (err) return console.log(err);
	dbClient = client;

	app.locals.notes = client.db("notesdb").collection("notes");
	app.locals.users = client.db("notesdb").collection("users");
	app.listen(port, () => {
		console.log("app started");
	});
});

// queries

app.post('/signin', (req, res) => {
	res.clearCookie('jwt');
	if (req.body && req.body.login && req.body.password) {
		let hash = hasher.hex(req.body.password);
		req.app.locals.users.findOne({login: req.body.login}, (err, user) => {
			if (err) {
				console.error(err);
				res.cookie('authRes', 'er');
			} else if (user != null && user.passwordHash == hash) {
				res.clearCookie('authRes');
				let token = jwt.sign({login: req.body.login}, Info.jwt_secret, {expiresIn: '1d'});
				res.cookie('jwt', token);
				return res.redirect('/notes.html');
			} else {
				res.cookie('authRes', 'wp');
			}
			res.redirect('/authorization.html');
		});
	}
});

app.post('/signup', (req, res) => {
	res.clearCookie('jwt');
	if (req.body && req.body.login && req.body.password) {
		let hash = hasher.hex(req.body.password);
		req.app.locals.users.findOne({login: req.body.login}, (err, user) => {
			if (err) {
				console.log(err);
				res.cookie('authRes', 'er');
			} else if (user == null) {
				req.app.locals.users.insertOne({login: req.body.login, passwordHash: hash});
				res.clearCookie('authRes');
				let token = jwt.sign({login: req.body.login}, Info.jwt_secret, {expiresIn: '1d'});
				res.cookie('jwt', token);
				return res.redirect('/notes.html');
			} else {
				res.cookie('authRes', 'ue');
			}
			res.redirect('/authorization.html');
		});
	}
});

app.post('/notes', (req, res) => {
	if (!req.cookie || !req.cookie.jwt) {
		return res.send({status: 'wl'});
	}
	jwt.verify(req.cookie.jwt, Info.jwt_secret, (err, data) => {
		if (err) {
			return res.send({status: 'wl'});
		} 
		req.app.locals.notes.find({login: data.login}).toArray((err, resNotes) => {
			if (err) {
				return res.send({status: 'er'});
			}
			res.send({login: data.login, data: resNotes});
		});
	});
});

app.post('/newNote', (req, res) => {
	if (!req.cookie || !req.cookie.jwt) {
		return res.send({status: 'wl'});
	}
	if (!req.body || !req.body.title || !req.body.content || !req.body.id) {
		return res.send({status: 'br'});
	}
	jwt.verify(req.cookie.jwt, Info.jwt_secret, (err, data) => {
		if (err) {
			return res.send({status: 'wl'});
		}
		req.app.locals.notes.findOne({login: data.login, id: req.body.id}, (err, note) => {
			if (err) {
				return res.send({status: 'er'});
			}
			if (note) {
				return res.send({status: 'ne'});
			}
			req.app.locals.notes.insertOne({login: data.login, id: req.body.id, title: req.body.title, content: req.body.content});
			return res.send({status: 'ok'});
		})
	})
});

app.post('/delNote', (req, res) => {
	if (!req.cookie || !req.cookie.jwt) {
		return res.send({status: 'wl'});
	}
	if (!req.body || !req.body.id) {
		return res.send({status: 'br'});
	}
	jwt.verify(req.cookie.jwt, Info.jwt_secret, (err, data) => {
		if (err) {
			return res.send({status: 'wl'});
		}
		req.app.locals.notes.deleteOne({login: data.login, id: req.body.id});
		return res.send({status: 'ok'});
	})
});

process.on("SIGINT", () => {
	dbClient.close();
	process.exit();
});


