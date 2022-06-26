const dotenv = require('dotenv').config(),
    express = require('express'),
    app = express(),
    path = require('path'),
    port = process.env.PORT || 7000,
    config = require('./config/init'),
    pg_connector = require('./app/controllers/pg_connector');

require('./config/express')(express, app, config);


require('./app/routes/twilioRoute')(app);
require('./app/routes/waAPIs')(app);
require('./app/routes/portalAPIs')(app,  pg_connector);
require('./app/routes/apiRoute')(app,  pg_connector);

app.get('*', function (req, res,next) {
	return res.sendFile(path.join(__dirname, 'index.html')); 
});

app.listen(port, () => {
  console.log('App listening on port ',port);
});