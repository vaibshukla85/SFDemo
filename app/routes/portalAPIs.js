const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const jwtSecreteKey = "qBY4P_kJ3meoMQ8ZljdMW6vBAMB4lj8FwHzU";
const whatsappCnt = require('../controllers/whatsAppController');
var request = require('request');
var sqlFormat = require('pg-format');

module.exports = function(app, pg_connector) {
	app.post('/api/loginAuth', (req,res) => {
        console.log(req.body);
        const query = {
            // give the query a unique name
            name: 'api-authenticate-user',
            text: 'SELECT userid,username,isadmin FROM crmusers WHERE username=$1 AND userpassword=$2',
            values: []
        }
        if(req.body.username!==undefined && req.body.pass!==undefined) {
            query.values = [req.body.username, req.body.pass];
            pg_connector.connect(query).then(response => {
				console.log(response);
				if(response && response.length){
					console.log(response[0]);
					var user = response[0];
					res.send({
						valid: true,
						data: user,
						token: jwt.sign({userID: user.id, userPass: user.password}, jwtSecreteKey, {expiresIn: '2h'})
					});
				}else{
					res.send({
						valid: false,
						data: {}
					});
				}                
            })
            .catch(err => {
                res.send(err);
            });
        }
    });
    app.get('/api/getHomeAllConCounts', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const currentActiveContactsQueryNew = {
            // give the query a unique name
            name: 'api-fetch-recent-contacts-count',
            text: 'SELECT COUNT(ContactId) AS "TotalContacts" FROM CONTACT',
            values: []
        };
        var getHomeAllConCounts = function(currentActiveContactsQueryNew){
            const result = {
                currentActiveContactsCount: 0
            };
            return new Promise( (resolve, reject) => {
                try{
                    pg_connector.connect(currentActiveContactsQueryNew).then(response => {
                        if(response && typeof response === "object"){
                            console.log(response);
                            result.currentActiveContactsCount = response[0].TotalContacts;
                        }
                        resolve(result);
                    }).catch(err => {
                        console.log("currentActiveContactsQueryNew",err);
                        reject(err);
                    });
                }catch(err){
                    console.log("try catch",err);
                    reject(err);
                }                
            });
        };
        getHomeAllConCounts(currentActiveContactsQueryNew).then(function(resp){
            res.status('200').send(JSON.stringify(resp));
        }).catch(function(err){
            res.status('400').send(err);
        });
    });
    app.get('/api/getHomeNewConCounts', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const newContactsOfWeekQuery = {
            // give the query a unique name
            name: 'api-fetch-new-contacts-of-week-count',
            text: 'SELECT COUNT(ContactId) AS "NewContacts" FROM CONTACT WHERE CreatedDate > (NOW() - interval \'168 hour\')',
            values: []
        };
        var getHomeNewConCounts = function(newContactsOfWeekQuery){
            const result = {
                newContactsOfWeekCount: 0
            };
            return new Promise( (resolve, reject) => {
                try{
                    pg_connector.connect(newContactsOfWeekQuery).then(response => {
                        if(response && typeof response === "object"){
                            console.log(response);
                            result.newContactsOfWeekCount = response[0].NewContacts;
                        }
                        resolve(result);
                    }).catch(err => {
                        console.log("newContactsOfWeekQuery",err);
                        reject(err);
                    });
                }catch(err){
                    console.log("try catch",err);
                    reject(err);
                }                
            });
        };
        getHomeNewConCounts(newContactsOfWeekQuery).then(function(resp){
            res.status('200').send(JSON.stringify(resp));
        }).catch(function(err){
            res.status('400').send(err);
        });
    });
    app.get('/api/getHomeRecentConCounts', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const currentActiveContactsQuery = {
            // give the query a unique name
            name: 'api-fetch-current_active_contacts-count',
            text: 'SELECT COUNT(Distinct(ContactId)) "ActiveContacts" FROM public.inboundrequest WHERE created_at > (NOW() - interval \'24 hour\')',
            values: []
        };
        var getHomeRecentConCounts = function(currentActiveContactsQuery){
            const result = {
                recentConversationCount: 0
            };
            return new Promise( (resolve, reject) => {
                try{
                    pg_connector.connect(currentActiveContactsQuery).then(response => {
                        if(response && typeof response === "object"){
                            console.log(response);
                            result.recentConversationCount = response[0].ActiveContacts;
                        }
                        resolve(result);
                    }).catch(err => {
                        console.log("currentActiveContactsQuery",err);
                        reject(err);
                    });
                }catch(err){
                    console.log("try catch",err);
                    reject(err);
                }                
            });
        };
        getHomeRecentConCounts(currentActiveContactsQuery).then(function(resp){
            res.status('200').send(JSON.stringify(resp));
        }).catch(function(err){
            res.status('400').send(err);
        });
    });
    app.get('/api/getHomeRequestSummary', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const getHomeRequestSummaryQuery = {
            // give the query a unique name
            name: 'api-fetch-Request-Summary',
            text: 'SELECT requestType AS "id", requestType AS "name", COUNT(requestId) as "value" FROM warequests GROUP BY requestType',
            values: []
        };
        var getHomeRequestSummary = function(getHomeRequestSummaryQuery){
            return new Promise( (resolve, reject) => {
                try{
                    pg_connector.connect(getHomeRequestSummaryQuery).then(response => {
                        if(response && typeof response === "object"){
                            console.log(response);
                            resolve(response);
                        }else{
                            reject('error occurred.');
                        }
                    }).catch(err => {
                        console.log("getHomeRequestSummaryQuery",err);
                        reject(err);
                    });
                }catch(err){
                    console.log("try catch",err);
                    reject(err);
                }                
            });
        };
        getHomeRequestSummary(getHomeRequestSummaryQuery).then(function(resp){
            res.status('200').send(JSON.stringify(resp));
        }).catch(function(err){
            res.status('400').send(err);
        });
    });
	app.get('/api/accounts', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-accounts',
            text: 'SELECT accountid,accountname,contactnumber,contactperson FROM account',
            values: []
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Account Not Found");
        });
    });
	app.post('/api/account/new', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-save-account',
            text: 'INSERT INTO account(accountname, address, accountstate, pincode, contactperson, contactnumber) \
                     VALUES($1, $2, $3, $4, $5, $6)',
            values: [req.body.accountname, req.body.address, req.body.accountstate, req.body.pincode, req.body.contactperson, req.body.contactnumber]
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Account Not Found");
        });
    });
	app.get('/api/account/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-account-byid',
            text: 'SELECT accountid,accountname,address,accountstate,pincode,contactperson,contactnumber FROM account where accountid = $1',
            values: [req.params.id]
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Account Not Found");
        });
    });
	app.post('/api/account/update', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-update-account',
            text: 'UPDATE account SET accountname= $1, address=$2, accountstate=$3, pincode=$4, contactperson=$5, contactnumber=$6 WHERE accountid = $7',
            values: [req.body.accountname, req.body.address, req.body.accountstate, req.body.pincode, req.body.contactperson, req.body.contactnumber, req.body.accountid]
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
			console.log(err);
			res.status('400').send("Error in saving opportunity");
        });
    });
	app.get('/api/getAccountContacts/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-account-contacts',
            text: 'SELECT contactid,contacttype,registermobileno AS "Mobile Number",contactname AS "Name",email AS "Email",\
                    dob AS "Date of Birth" FROM contact \
                    WHERE accountid = $1',
            values: [req.params.id]
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Account Not Found");
        });
    });
    app.get('/api/contacts', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-contacts',
            text: 'SELECT contactid,contacttype,registermobileno AS "Mobile Number",contactname AS "Name",email AS "Email",\
            dob AS "Date of Birth" FROM contact',
            values: []
        };
        pg_connector.connect(query).then(response => {
            res.status('200').send(JSON.stringify(response));
        }).catch(err => {
            console.log(err);
            res.status('400').send(err);
        });
    });
	app.post('/api/contact/exists', expressJwt({secret: jwtSecreteKey}), (req,res) => { 
        const query = {
            // give the query a unique name
            name: 'api-is-contact-exists',
            text: 'SELECT contactid FROM contact WHERE registermobileno = $1',
            values: [req.body.mobilenum]
        };
        
        pg_connector.connect(query)
        .then(response => {
			var allowNumber = !response;
            res.status('200').send(JSON.stringify(allowNumber));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Error in checking contact");
        });
    });
	app.post('/api/contact/new', expressJwt({secret: jwtSecreteKey}), (req,res) => { 
		const datasource = 'PORTAL';
        var isConsent = 'NULL';
        if(req.body.consent == 'YES'){
            isConsent = true;
        }else{
            isConsent = false;
        }
        const query = {
            // give the query a unique name
            name: 'api-save-contact',
            text: 'INSERT INTO contact (accountid, contactname, email, dob, registermobileno, contacttype, datasource, isconsent)\
					VALUES($1, $2, $3, $4, $5, $6, $7, $8)',
            values: [req.body.accountid, req.body.contactname, req.body.email, req.body.dob, req.body.registermobileno, req.body.contacttype, datasource, isConsent]
        };
        
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Incorrect Contact id");
        });
    });	

    app.get('/api/contact/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {    
        const query = {
            // give the query a unique name
            name: 'api-fetch-contact-details',
            text: 'SELECT contactid, accountname, contactname, email, dob, registermobileno, contacttype, datasource, isconsent  \
                    FROM contact c INNER JOIN Account a ON c.accountid = a.accountid \
                    WHERE c.contactid = $1',
            values: [req.params.id]
        };
        
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Incorrect Contact id");
        });
    });
	
	app.post('/api/contact/update', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-update-contact',
            text: 'UPDATE contact SET firstname = $1, dob = $2, email = $3, fssainumber = $4, duedate = $5, contacttype = $6 WHERE contactid = $7',
            values: [req.body.name, req.body.dob, req.body.email, req.body.fssainumber, req.body.dueDate, req.body.contacttype, req.body.contactid]
        };
        
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
			console.log(err);
			res.status('400').send("Error in saving opportunity");
        });
    });

	app.get('/api/scripts', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-scripts',
            text: 'SELECT * FROM process',
            values: []
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("No Process Found");
        });
    });
	
	app.get('/api/script/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-stage-table-data-loan-origination',
            /*text: 'SELECT s.executionseq as "Sr. No.", s.description as "Reply", \
                    s.short_description as "Short reply", s.expected_input as "Expected Input", \
                    v.errormessage as "Error Message" FROM stage as s \
                    INNER JOIN validators as v on s.validatorid = v.validatorid \
                    WHERE currprocess = $1 \
                    ORDER BY s.executionseq',*/
			text: 'SELECT s.executionseq as "Sr. No.", s.description as "Reply", \
                    s.short_description as "Short reply", s.expected_input as "Expected Input", \
                    v.errormessage as "Error Message" FROM stage as s \
                    LEFT OUTER JOIN validators as v on s.validatorid = v.validatorid \
                    WHERE currprocess = $1 \
                    ORDER BY s.executionseq',
            values: [req.params.id]
        };
        
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Error in fetching the stages record");
        });
    });
	
	app.get('/api/communicates', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-communicate',
            text: 'SELECT id, innerQuery.count AS "Communicated With Total Contacts", sms_body AS "Text Message", medianame as "Attachment", created_at as "Communicated At", mediaurl FROM (\
				SELECT count(contactid), communicateid\
				FROM communicatecontactmapping\
				GROUP BY communicateid\
			) AS innerQuery, communicate\
			WHERE communicate.id = innerQuery.communicateid',
            values: []
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("No Process Found");
        });
    });
	
	app.get('/api/communicate/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-communicate-details',
            text: 'SELECT c.id, c.sms_body, c.mediaurl, c.medianame, c.created_at, a.name as accountname from communicate as c, account as a WHERE c.id = $1 AND c.accountid = a.accountid',
            values: [req.params.id]
        };
        
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Error in fetching the stages record");
        });
    });
    
    app.get('/api/integrations', expressJwt({secret: jwtSecreteKey}), (req,res) => {    
        const query = {
            // give the query a unique name
            name: 'api-fetch-integrations',
            text: 'SELECT id, apiname, apiurl, authparams, apimethod, apireqjson, statuscode, statusmessage, extIdField, extText \
                    FROM integrationconfig ',
            values: []
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Incorrect Contact id");
        });
    });
    app.post('/api/integration/new', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        debugger
        var configId;
        const query = {
            // give the query a unique name
            name: 'api-create-integration',
            text: 'INSERT INTO integrationconfig(apiname, apiurl, authparams, apimethod, apireqjson, statuscode, statusmessage, extIdField, extText) \
                     VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            values: [req.body.apiname, req.body.apiurl, req.body.authparams, req.body.apimethod, req.body.apireqjson, req.body.statuscode, req.body.statusmessage, req.body.extIdField, req.body.extText]
        };
        const query1 = {
            // give the query a unique name
            name: 'get-new-integration',
            text: 'SELECT id FROM integrationconfig WHERE apiname = $1',
            values: [req.body.apiname]
        };
        pg_connector.connect(query)
        .then(response => {
            debugger
            pg_connector.connect(query1)
            .then(response => {
                configId = response[0].id;
                var apiData = req.body.data;
                let dataToInsert = [];
                var objApiResp = [];
                for(var i = 0; i<apiData.length; i++){
                    objApiResp = [];
                    objApiResp.push(configId);
                    objApiResp.push(apiData[i]['respid']);
                    objApiResp.push(apiData[i]['resptext']);
                    objApiResp.push(apiData[i]['respjson']);
                    dataToInsert.push(objApiResp);
                }
                debugger
                let sqlQuery = sqlFormat('INSERT INTO intresponses (inteconfigid, respid, resptext, respjson) VALUES %L', dataToInsert);
                debugger
                const query3 = {
                    // give the query a unique name
                    name: 'save-api-respData',
                    text: sqlQuery,
                    values: []
                };
                pg_connector.connect(query3)
                .then(response => {
                    debugger
                    res.status('200').send(JSON.stringify(response));
                })
                .catch(err => {
                    console.log(err);
                    res.status('400').send("Integration Not created");
                });
            })
            .catch(err => {
                console.log(err);
                res.status('400').send("Integration Not created");
            });
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Integration Not created");
        });

    });
    app.get('/api/integration/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {    
        const query = {
            // give the query a unique name
            name: 'api-fetch-a-integration-record',
            text: 'SELECT id, apiname, apiurl, authparams, apimethod, apireqjson, statuscode, statusmessage, extIdField, extText \
                    FROM integrationconfig \
                    WHERE id = $1',
            values: [req.params.id]
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Incorrect record id");
        });
    });
	app.post('/api/integration/update', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-update-integration',
            text: 'UPDATE integrationconfig SET apiname= $1, apiurl=$2, authparams=$3, apimethod=$4, apireqjson=$5, statuscode=$6, statusmessage=$7, extIdField=$8, extText=$9 WHERE id = $10',
            values: [req.body.apiname, req.body.apiurl, req.body.authparams, req.body.apimethod, req.body.apireqjson, req.body.statuscode, req.body.statusmessage, req.body.extIdField, req.body.extText, req.body.id]
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
			console.log(err);
			res.status('400').send("Error in saving integration config");
        });
    });
    app.post('/api/integration/apiCall', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        console.log(req);
        const query = {
            // give the query a unique name
            name: 'api-test-communicate',
            text: 'SELECT sms_body FROM inboundrequest WHERE ibrid = 1381',
            values: []
        };
        pg_connector.connect(query)
        .then(response => { 
            debugger
            whatsappCnt.sendWaMessage(response[0].sms_body , '919619583618');

            var reqParam = req.body;
            var respBody = {
                apiname: reqParam.apiname,
                apiurl: reqParam.apiurl,
                authparams: reqParam.authparams,
                apimethod: reqParam.apimethod,
                apireqjson: reqParam.apireqjson,
                extIdField: reqParam.extIdField,
                extText: reqParam.extText,
                statuscode: reqParam.statuscode,
                statusmessage: reqParam.statusmessage,
                data:[]
            };
            var respData = [];
            var extId, extText, tempBody;
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
            extId = reqParam.extIdField;
            extText = reqParam.extText;
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
            request(options, function (error, response) {
                console.log('error==> ' +error);
                if(response.statusCode != 200){
                    respBody.statuscode = response.statusCode;
                    respBody.statusmessage = response.statusMessage;
                    res.statusCode = response.statusCode;
                    res.statusmessage = response.statusMessage;
                    res.send("Unable to access the API.");
                    return;
                }
                tempBody = JSON.parse(response.body);
                for(var i=0; i < tempBody.length; i++){
                    respObj = {
                        'respid':'',
                        'resptext':'',
                        'respjson':''
                    };
                    respObj.respid = tempBody[i][extId];
                    respObj.resptext = tempBody[i][extText];
                    respObj.respjson = tempBody[i];
                    respData.push(respObj);
                }
                respBody.data = respData;
                respBody.statuscode = response.statusCode;
                respBody.statusmessage = response.statusMessage;
                res.contentType('application/json');
                res.statusCode = response.statusCode;
                res.statusmessage = response.statusMessage;
                res.send(respBody);
            });

            //res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("No Process Found");
        });
    });

};