const waCnt = require('../controllers/whatsAppController');
var request = require('request');

module.exports = function(app) {
	app.post('/wa/callback', (req,res) => {
		console.log(JSON.stringify(req.body) + ' changes made @23122020');
		
		var contact, ProfJson, custName, contactNum, objMsg, msgFrom, msgBodyJson, msgBody, msgId; 
		var messages = req.body.messages;
		var contacts = req.body.contacts;

		if(messages == null || messages == undefined || messages.length <= 0){
			res.status('200').send("Customer not found @msg not supported");
			return;
		}
		if(contacts != null && contacts != undefined && contacts.length > 0){
			contact = contacts[0];
			ProfJson = contact.profile;
			custName = ProfJson.name;
			contactNum = contact.wa_id;
		}
		console.log(' custName => '+custName + ' contactNum => ' + contactNum);
		objMsg = messages[0];
		msgFrom = objMsg.from;
		msgId = objMsg.id;
		msgBodyJson = objMsg.text;
		if(msgBodyJson == null || msgBodyJson == undefined){
			res.status('200').send("Customer Not found @msg type not supported");
			return;
		}
		msgBody = msgBodyJson.body;
		console.log(JSON.stringify(msgBody) + ' ==> msgBody ' + msgFrom + ' ==> msgFrom ');
		
		waCnt.getRespMsg(msgId, msgBody, msgFrom, contactNum)
        .then(customerData => {
            console.log('customerData===>',customerData);
            if(customerData === undefined || customerData === null) {
                console.log('unable to find the customer.');
            }else if(customerData !== 'NO_RECORD' && customerData.length>0){
                console.log('Customer found in Database');
                var strTempData = customerData[0];
                console.log('## strTempData');
				//if(strTempData[0]==='NewAccount'){
					waCnt.sendWaMessage(strTempData.msgresp, strTempData.msgfrom)
					.then(success => {
						//console.log('success===>'+JSON.stringify(success.body));
						var sucResp = JSON.parse(success.body);
						if(sucResp !== null && sucResp !== '' && sucResp.code === 200){
							var iContactId = strTempData.icontactid, inextqueid = strTempData.inextqueid, iprocessid = strTempData.iprocessid,
							msgTo = strTempData.msgfrom, msgresp = strTempData.msgresp, msgStatus = sucResp.status,
							messageid = sucResp.messageid;
							waCnt.logSentMsg(iContactId, messageid, msgStatus, msgTo, msgresp, inextqueid, iprocessid)
							.then(success => {
								console.log(success);
							})
							.catch(err => {
								console.log(err);
							});
						}
					}, 
					rej =>{
						console.log('Rejected===>'+rej);
					})
					.catch(err => {
						console.log(err);
					});
				//}
            }else{
                console.log('Customer not found in Database');
            }
        }, onRej => {
            console.log(onRej);
        })
        .catch(err => {
            console.log(err);
		});
		
        res.status('200').send("Customer found");
	});
	app.post('/wa/msgsatus', (req,res) => {
/*
		const msgId = req.body.SmsSid;
		const msgStatus = req.body.SmsStatus;
		const msgBody = req.body.Body;
		const msgTo = req.body.To;
		const msgFrom = req.body.From;
		const msgAccountSid = req.body.AccountSid;
		const msgMediaContentType = req.body.MediaContentType0;
		const MediaUrl = req.body.MediaUrl0;
*/
		console.log(JSON.stringify(req.body) + ' changes made @23122020');
		res.status('200').send("Customer found");
	});
	app.get('/getDoctors', (req,res) => {
		var data = [{
					"id" : 1,
					"name": "Aniket Sao",
					"departmentId": 20
					},
					{
					"id" : 2,
					"name": "Rahul Roy",
					"departmentId": 22
					},
					{
					"id" : 3,
					"name": "Manish Kumar",
					"departmentId": 21
					},
					{
					"id" : 4,
					"name": "Vyom Das",
					"departmentId": 24
					},
					{
					"id" : 5,
					"name": "Prakash Narayan",
					"departmentId": 25
					}];
		console.log(JSON.stringify(req.body) + ' changes made @29102020');
		res.contentType('application/json');
		res.status('200').send(JSON.stringify(data));
	});
	app.get('/getDoctors', (req,res) => {
		var file = path.join(__dirname, 'file.pdf');
		res.download(file, function (err) {
			if (err) {
				console.log("Error");
				console.log(err);
			} else {
				console.log("Success");
			}
		});
	});

	app.post('/apiCall', (req,res) => {
		console.log(req);
		debugger
		var reqParam = req.body;
		var reqBodyParam = {};
		var reqHeaderParam = {}; 
		var options = {
			'method': '',
			'url': '',
			'headers': {},
			'body': {},
		};
		var respObj = {
			'respid':'',
			'resptext':'',
			'respjson':''
		};
		var respBody = [];
		var extId, extText, tempBody;
		extId = req.extIdField;
		extText = req.extText;
		if(reqParam.authparams != '' && reqParam.authparams.length >= 0){
			reqHeaderParam = reqParam.authparams;
		}
		if(reqParam.apireqjson != '' && reqParam.apireqjson.length >= 0){
			reqBodyParam = reqParam.apireqjson;
		}
		options.url = reqParam.apiurl;
		options.method = reqParam.apimethod;
		options.headers = reqHeaderParam;
		options.body = reqBodyParam;
		console.log('options==> ' +JSON.stringify(options));
		request(options, function (error, response) {
			debugger
			console.log('error==> ' +error);
			console.log('response==> ' +JSON.stringify(response));
			if(response.statusCode != 200){
				res.status('400').send("Unable to access the API.");
			}
			tempBody = response.body;
			for(var i=0; i < tempBody.length; i++){
				respObj = {
					'respid':'',
					'resptext':'',
					'respjson':''
				};
				respObj.respid = tempBody[i][extId];
				respBody.push(respObj);
			}
			console.log(JSON.stringify(respBody));

			res.contentType('application/json');
			res.status('200').send(response.body);
		});
	});
};