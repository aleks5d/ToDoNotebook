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
let jsonencodedParser = bodyParser.json();
let uri = 'mongodb+srv://' + Info.dblogin + ':' + Info.dbpassword + '@cluster0.bihyb.mongodb.net/TODO?retryWrites=true&w=majority';
let mongoClient = new MongoClient(uri,  {useNewUrlParser: true, useUnifiedTopology: true});
let dbClient;
let hasher = new Hasher.SHA512();

// middleware

app.use(cookieParser());

app.use('/notes.html', (req, res, next) => {
	if (!req.cookies || !req.cookies.jwt) {
		res.redirect('/authorization.html');
		return;
	} 
	jwt.verify(req.cookies.jwt, Info.jwt_secret, (err, data) => {
		if (err) {
			res.clearCookie('jwt');
			res.clearCookie('authRes');
			res.redirect('/authorization.html');
		} else {
			console.log('login by: ' + data.login);
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

app.post('/signin', urlencodedParser, (req, res) => {
	res.clearCookie('jwt');
	res.cookie('authMethod', 'in');
	if (!req.body || !req.body.login || !req.body.password) {
		res.cookie('authRes', 'er');
		return res.redirect('/authorization.html');
	}
	let hash = hasher.hex(req.body.password);
	req.app.locals.users.findOne({login: req.body.login}, (err, user) => {
		if (err) {
			console.error(err);
			res.cookie('authRes', 'er');
		} else if (user != null && user.passwordHash == hash) {
			res.clearCookie('authRes');
			res.clearCookie('authMethod');
			let token = jwt.sign({login: req.body.login}, Info.jwt_secret, {expiresIn: '1d'});
			res.cookie('jwt', token);
			return res.redirect('/notes.html');
		} else {
			res.cookie('authRes', 'wp');
		}
		res.redirect('/authorization.html');
	});
});

app.post('/signup', urlencodedParser, (req, res) => {
	res.clearCookie('jwt');
	res.cookie('authMethod', 'up');
	if (!req.body || !req.body.login || !req.body.password) {
		res.cookie('authRes', 'er');
		return res.redirect('/authorization.html');
	}
	let hash = hasher.hex(req.body.password);
	req.app.locals.users.findOne({login: req.body.login}, (err, user) => {
		if (err) {
			console.log(err);
			res.cookie('authRes', 'er');
		} else if (user == null) {
			req.app.locals.users.insertOne({
				login: req.body.login, 
				passwordHash: hash,
				count: 1,
				idMax: 0
			});
			req.app.locals.notes.insertOne({
				login: req.body.login, 
				id: 0, 
				title: 'Привет! Я заметка',
				content: 'Привет! Я текст заметки!'});
			res.clearCookie('authRes');
			res.clearCookie('authMethod');
			let token = jwt.sign({login: req.body.login}, Info.jwt_secret, {expiresIn: '1d'});
			res.cookie('jwt', token);
			return res.redirect('/notes.html');
		} else {
			res.cookie('authRes', 'ue');
		}
		res.redirect('/authorization.html');
	});
});

app.post('/notes', jsonencodedParser, (req, res) => {
	if (!req.cookies || !req.cookies.jwt) {
		return res.send({status: 'wl'});
	}
	jwt.verify(req.cookies.jwt, Info.jwt_secret, (err, data) => {
		if (err) {
			return res.send({status: 'wl'});
		} 
		req.app.locals.notes.find({login: data.login}).toArray((err, resNotes) => {
			if (err) {
				return res.send({status: 'er'});
			}
			res.send({status: 'ok', login: data.login, data: resNotes});
		});
	});
});

app.post('/newNote', jsonencodedParser, (req, res) => {
	if (!req.cookies || !req.cookies.jwt) {
		return res.send({status: 'wl'});
	}
	if (!req.body || !req.body.title || !req.body.content) {
		return res.send({status: 'er'});
	}
	jwt.verify(req.cookies.jwt, Info.jwt_secret, (err, data) => {
		if (err) {
			return res.send({status: 'wl'});
		}
		req.app.locals.users.findOne({login: data.login}, (err, user) => {
			if (err || !user) {
				return res.send({status: 'er'});
			}
			if (user.count == Info.MaxCount) {
				return res.send({status: 'ne'});
			}
			req.app.locals.users.findOneAndUpdate({login: user.login}, {$set: {count: user.count+1, idMax: user.idMax + 1}});
			req.app.locals.notes.insertOne({login: user.login, id: user.idMax + 1, title: req.body.title, content: req.body.content});
			return res.send({status: 'ok', id: user.idMax + 1});
		})
	})
});

app.post('/delNote', jsonencodedParser, (req, res) => {
	if (!req.cookies || !req.cookies.jwt) {
		return res.send({status: 'wl'});
	}
	if (!req.body || !req.body.id) {
		return res.send({status: 'br'});
	}
	jwt.verify(req.cookies.jwt, Info.jwt_secret, (err, data) => {
		if (err) {
			return res.send({status: 'wl'});
		}
		req.app.locals.users.findOne({login: data.login}, (err, user) => {
			if (err || !user) {
				return res.send({status: 'er'});
			}
			req.app.locals.users.findOneAndUpdate({login: user.login}, {$set: {count: user.count-1}});
			req.app.locals.notes.deleteOne({login: data.login, id: parseInt(req.body.id)});
			return res.send({status: 'ok'});
		});
	});
});

process.on("SIGINT", () => {
	dbClient.close();
	process.exit();
});


