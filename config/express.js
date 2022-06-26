var bodyParser = require('body-parser'),
	helmet = require('helmet'),
    session = require('express-session'),
    cookieParser = require('cookie-parser');

module.exports = function(express, app, config) {	
	
	app.use(helmet());
	app.use(express.static(config.rootPath+ '/public/whatsapp', { maxAge: 86400000 }));
    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: true }))
    // parse application/json
    app.use(bodyParser.json())
    app.use(bodyParser.text({ type: 'text/html' }))
    app.use(bodyParser.text({ type: 'text/plain' }))
    // for the express cookie management
    app.use(cookieParser());
	app.use(function(req, res, next) {
		if(req.path && req.path.indexOf("/api/") !== -1){
			res.header("Access-Control-Allow-Origin", "*");
			res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
		}
		next();
	});
}
