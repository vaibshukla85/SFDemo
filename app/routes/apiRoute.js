const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const jwtSecreteKey = "qBY4P_kJ3meoMQ8ZljdMW6vBAMB4lj8FwHzU";
const whatsappCnt = require('../controllers/whatsAppController');

module.exports = function(app, pg_connector) {    
	app.post('/api/initiateTemplateScriptForContact', expressJwt({secret: jwtSecreteKey}), (req,res) => {    
		pg_connector.initiateTemplateScriptForContact(req.body.contactIdArr, req.body.stageid, req.body.processid)
		.then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Incorrect Contact id");
        });
    });

    app.get('/api/getcontactconversation/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-inbound-outbound-request',
            text: 'SELECT * FROM (SELECT sms_status as "SMS Status", sms_from as "SMS From", sms_body as "SMS Body", created_at, msgmediaurl FROM InboundRequest AS InReq WHERE InReq.contactId = $1 UNION SELECT sms_status as "SMS Status", sms_from as "SMS From", sms_body as "SMS Body", created_at, msgmediaurl FROM Outbound_request as outReq WHERE outReq.contactId = $2) AS temp ORDER BY temp.created_at ASC',
            values: [req.params.id,req.params.id]
        };
    
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Inbound Outbound Request Not Found");
        });
    });

    app.get('/api/getcontactDocuments/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-contact-documents',
            text: 'SELECT DOC.requestid AS "Request Id", DOC.doctype AS "Document Type", DOC.docname AS "Document Name", DOC.doclink AS "Link"  FROM documents Doc INNER JOIN CONTACT C ON Doc.CreatedById = c.ContactId WHERE DOC.UPLOADEDBY = \'PATIENT\' AND Doc.CreatedById = $1',
            values: [req.params.id]
        };
    
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Inbound Outbound Request Not Found");
        });
    });

    app.get('/api/getcontactDoctorDocs/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-contact-doctor-documents',
            text: 'SELECT C.FirstName AS "Doctor Name", DOC.requestid AS "Request Id", DOC.doctype AS "Document Type", DOC.docname AS "Document Name", DOC.doclink AS "Link" FROM documents Doc INNER JOIN CONTACT C ON Doc.CreatedById = c.ContactId WHERE DOC.UPLOADEDBY = \'DOCTOR\' AND Doc.contactid = $1',
            values: [req.params.id]
        };
    
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Inbound Outbound Request Not Found");
        });
    });
	app.get('/api/getProcessWithStartStage', expressJwt({secret: jwtSecreteKey}), (req,res) => { 
        const query = {
            // give the query a unique name
            name: 'api-fetch-process-with-stage-details',
            text: 'SELECT p.processid, p.description, p.procstartstage, s.description as "StageDescription"\
					FROM process as p, stage as s\
					WHERE p.procstartstage = s.stageid ORDER BY p.processid ASC',
            values: []
        };
        
        pg_connector.connect(query)
        .then(response => {
			res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Error in checking contact");
        });
    });
	app.get('/api/currentActiveContacts', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-current_active_contacts',
            text: 'SELECT c.contactid as "Contact Id", c.firstname as "Name", p.description as "Current Process", s.description as "Current Stage" from contact as c, process as p, stage as s where s.stageid = c.currentstage AND p.processid = c.currentprocess',
            values: []
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send(err);
        });
    });

	app.get('/api/newContactsOfWeek', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-new-contacts-of-week',
            text: 'WITH ContactsOfWeek AS \
                    ( \
                        SELECT count(contactid) as "count", contactid \
                        FROM inboundrequest \
                        WHERE created_at > (current_date - interval \'7 days\') AND contactid NOT IN \
                        ( \
                            SELECT contactid \
                            FROM inboundrequest \
                            WHERE created_at < (current_date - interval \'7 days\') \
                        ) \
                        GROUP BY contactid \
                    ) Select c.contactid, c.firstname as "Name", \
                    c.regmobno as "Registered Mobile Number", c.dob as "Date Of Birth", \
                    c.email as "Email" \
                    FROM contact as c where c.contactid IN \
                    (Select contactid from ContactsOfWeek)',
            values: []
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send(err);
        });
    });
    
    app.get('/api/maxResponseTimeTookByConversation', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-max-time-step',
            text: 'SELECT  p.processid, s.executionseq, oreq.contactid, p.description, \
                    oreq.sms_body, s.short_description, oreq.response_time \
                    FROM outbound_request as oreq, stage as s, process as p \
                    WHERE oreq.stageid = s.stageid AND s.currprocess = p.processid \
                    AND oreq.response_time IS NOT NULL AND oreq.contactid IN \
                    (SELECT contactid from loanapplication \
                    WHERE status = \'Disbursed\') \
                    ORDER BY p.processid ASC, s.executionseq ASC',
            values: []
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send(err);
        });
    });
	
	app.get('/api/recentActiveContacts', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-recent-contacts',
            text: 'WITH recentActiveContact AS \
                ( \
                    SELECT count(ir.contactid), ir.contactid \
                    FROM inboundrequest AS ir, loanapplication as lp \
                    WHERE ir.created_at > (NOW() - interval \'1 hour\') \
                    GROUP BY ir.contactid \
                ) Select c.contactid, c.firstname as "Name", \
                c.regmobno as "Registered Mobile Number", c.dob as "Date Of Birth", \
                c.email as "Email" \
                FROM contact as c where c.contactid IN \
                (Select contactid from recentActiveContact)',
            values: []
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send(err);
        });
    });
	app.get('/api/getHomeCounts', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const recentConversationQuery = {
            // give the query a unique name
            name: 'api-fetch-recent-contacts-count',
            text: 'SELECT COUNT(ContactId) AS "TotalContacts" FROM CONTACT',
            values: []
        };
        const newContactsOfWeekQuery = {
            // give the query a unique name
            name: 'api-fetch-new-contacts-of-week-count',
            text: 'SELECT COUNT(ContactId) AS "NewContacts" FROM CONTACT WHERE CreatedDate > (NOW() - interval \'168 hour\')',
            values: []
        };
        const currentActiveContactsQueryNew = {
            // give the query a unique name
            name: 'api-fetch-current_active_contacts-count',
            text: 'SELECT COUNT(Distinct(ContactId)) "ActiveContacts" FROM public.inboundrequest	WHERE created_at > (NOW() - interval \'24 hour\')',
            values: []
        };

        var getHomeCounts = function(recentConversationQuery, newContactsOfWeekQuery, currentActiveContactsQueryNew){
            const result = {
                currentActiveContactsCount: 0,
                newContactsOfWeekCount: 0,
                recentConversationCount: 0
            };
    
            return new Promise( (resolve, reject) => {
                try{
                    pg_connector.connect(currentActiveContactsQueryNew).then(response => {
                        if(response && typeof response === "object"){
                            console.log(response);
                            result.currentActiveContactsCount = response[0].ActiveContacts;
                        }            
                        pg_connector.connect(newContactsOfWeekQuery).then(response_1 => {
                            if(response_1 && typeof response_1 === "object"){
                                result.newContactsOfWeekCount = response_1[0].NewContacts;
                            }             
                            pg_connector.connect(recentConversationQuery).then(response_2 => {
                                if(response_2 && typeof response_2 === "object"){
                                    result.recentConversationCount = response_2[0].TotalContacts;
                                }                                
                                resolve(result);        
                            }).catch(err => {
                                console.log("recentConversationQuery",err);
                                reject(err);
                            });            
                        }).catch(err => {
                            console.log("newContactsOfWeekQuery",err);
                            reject(err);
                        });
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

        getHomeCounts(recentConversationQuery, newContactsOfWeekQuery, currentActiveContactsQueryNew)
        .then(function(resp){
            res.status('200').send(JSON.stringify(resp));
        }).catch(function(err){
            res.status('400').send(err);
        });
        
    });
	
	
	app.get('/api/getContactLoanApplications/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-loan-applications-for-contact',
            text: 'SELECT loanaccnumber as "Opportunity Number", loantype as \
                    "Type", subtype as "Sub Type", status as "Status", pan as "PAN",\
                    proftype as "Profession Type", curraddress as "Address",\
                    city as "City", state as "State", zipcode as "Pincode" FROM\
                    loanapplication WHERE contactid = $1',
            values: [req.params.id]
        };
        
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            if(err === "Record not found") {
                res.status('200').send(JSON.stringify([{
                    "Opportunity Number":"",
					"Type":"",
					"Sub Type":"",
                    "Status":"",
                    "Pan":"",
                    "Profession Type":"",
                    "Address":"",
                    "City":"",
                    "State":"",
                    "Pincode":""
                }]))
            }
            else {
                res.status('400').send("Error in fetching related loan applications");
            }
        });
    });
    
    app.get('/api/loanApplications', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-all-loan-applications',
            text: 'SELECT loanid, loanaccnumber, loantype as \
                    "Type", subtype as "Sub Type", status as "Status", pan as "PAN",\
                    proftype as "Profession Type", curraddress as "Address",\
                    city as "City", state as "State", zipcode as "Pincode" FROM\
                    loanapplication ORDER BY loanid desc',
            values: []
        };
        
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            if(err === "Record not found") {
                res.status('200').send(JSON.stringify([{
                    "Opportunity Number":"",
					"Type":"",
					"Sub Type":"",
                    "Status":"",
                    "Pan":"",
                    "Profession Type":"",
                    "Address":"",
                    "City":"",
                    "State":"",
                    "Pincode":""
                }]))
            }
            else {
                res.status('400').send("Error in fetching related loan applications");
            }
        });
    });
	
	app.get('/api/opportunity/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-get-opportunity',
            text: 'SELECT la.loanaccnumber, la.loanamount, la.status, la.loantype, la.curraddress, la.city, la.state, la.zipcode, la.proftype, la.pan, la.loanamtsant, la.subtype, a.name as "accountname" FROM loanApplication AS la, account as a WHERE la.loanid = $1 AND la.accountid = a.accountid',
            values: [req.params.id]
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
	
	app.get('/api/opportunityContacts/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-opportunity-contacts',
            text: 'SELECT c.contactid, c.firstname as "Name", c.regmobno as \
            "Registered Mobile Number", c.dob as "Date Of Birth", c.email as "Email",\
			c.FSSAINumber AS "FSSAI Number", TO_CHAR(c.dueDate :: DATE, \'Mon dd, yyyy\') as "Due Date"\
            FROM contact AS c, loanapplication AS la WHERE la.loanid = $1 AND la.contactid = c.contactid',
            values: [req.params.id]
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
	
	app.post('/api/opportunity/new', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-save-opportunity',
            text: 'INSERT INTO loanapplication(accountid, contactid, loanamount, status, loantype, subtype, curraddress, city, state, zipcode, proftype, pan, loanamtsant)\
					VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
            values: [req.body.accountid, req.body.contactid, req.body.loanamount, req.body.status, req.body.loantype, req.body.subtype, req.body.curraddress, req.body.city, req.body.state, req.body.zipcode, req.body.proftype, req.body.pan, (req.body.loanamount * 1.25)]
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
	
	app.post('/api/opportunity/update', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-update-opportunity',
            text: 'UPDATE loanapplication set loanamount = $1, status = $2, loantype = $3, subtype = $4, curraddress = $5, city = $6, state = $7, zipcode = $8, proftype = $9, pan = $10, loanamtsant = $11 WHERE loanid = $12',
            values: [req.body.loanAmount, req.body.status, req.body.loanType, req.body.subType, req.body.currentAddress, req.body.city, req.body.state, req.body.zipcode, req.body.profType, req.body.pan, req.body.loanAmountSanctioned, req.body.loanid]
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
	app.get('/api/getContactCommunicates/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {  
        const query = {
            // give the query a unique name
            name: 'api-fetch-contact-communicates',
			text: 'SELECT * FROM (SELECT sms_body, sms_status, created_at FROM communicate WHERE id IN\
					(SELECT communicateid FROM communicatecontactmapping WHERE contactid = $1) \
					) AS innerQuery\
					ORDER BY innerQuery.created_at DESC',		
            values: [req.params.id]
        };
        pg_connector.connect(query)
        .then(response => {
			if(response){
				res.status('200').send(JSON.stringify(response));				
			}else{
				res.status('200').send(response);	
			}
        })
        .catch(err => {
            console.log(err);
            res.status('400').send("Incorrect Contact id");
        });
    });
	
	app.get('/api/getCommunicateContacts/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-communicate-contacts',
            text: 'SELECT c.contactid, c.firstname as "Name", c.regmobno as \
            "Registered Mobile Number", c.dob as "Date Of Birth", c.email as "Email",\
			FSSAINumber AS "FSSAI Number", TO_CHAR(dueDate :: DATE, \'Mon dd, yyyy\') as "Due Date"\
            FROM contact as c, communicatecontactmapping as ccm WHERE c.contactid=ccm.contactid AND ccm.communicateid = $1',
            values: [req.params.id]
        };
        
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            if(err === "Record not found") {
                res.status('200').send(JSON.stringify([{
                    "Contact Id":"",
                    "Name":"",
                    "Registered Mobile Number":"",
                    "Date Of Birth":"",
                    "Email":""
                }]))
            } else {
                res.status('400').send("Contacts Not Found");
            }
        });
    });
	
	app.post('/api/twilio/sendMessage', expressJwt({secret: jwtSecreteKey}), (req, res)=>{
		
		if(req.body.msgBody && req.body.contactData){
			var contactArr = req.body.contactData;
			var msgBody = req.body.msgBody;
			var mediaurl = req.body.isFileUpload ? "https://homepages.cae.wisc.edu/~ece533/images/pool.png" : null;
			var communicateId = null;
			if(typeof(contactArr) === "object" && contactArr.length){
				try{					
					communicateCnt.createCommunicate(msgBody, mediaurl).then((result)=>{
						console.log(result);
						if(result && result.length){
							communicateId = result[0].id;
							if(communicateId){
								Promise.all(contactArr.map(function(contactStr){
									var contactArr = contactStr.split("@");
									var contactObj = {
										id: contactArr[0],
										name: contactArr[1],
										msgTo: contactArr[2],
										FSSAINumber: contactArr[3],
										dueDate: contactArr[4]
									};
									return new Promise((resolve, reject) =>{
										msgBody = msgBody.replace("{{contactName}}", contactObj.name);
										msgBody = msgBody.replace("{{FSSAINumber}}", contactObj.FSSAINumber);
										msgBody = msgBody.replace("{{expiryDate}}", contactObj.dueDate);
										whatsappCnt.sendMessage(msgBody, contactObj.msgTo, mediaurl).then((success) => {
											console.log("communicateId ", communicateId);
											communicateCnt.mapContactWithCommunicate(communicateId, contactObj.id)
												.then((result)=>{
													resolve(success);
												})
												.catch((err)=>{
													reject(err);
												});
										},(rej) =>{
											reject(rej);
										}).catch((err) => {
											reject(err);
										});
									});
								})).then((finalResult)=>{
									res.send({
										success: true,
										data: finalResult
									});
								}, (err)=>{
									res.send(err);
								});
							}else{
								reject({
									success: false,
									message:"communicate id not been generated..."
								});
							}						
						}else{
							reject(result)
						}											
					})
					.catch((err)=>{
						reject(err);
					});						
				}catch(err){
					res.send(err);
				};						
			}
		}else{
			res.send({
				error: true,
				message: "Please provide valid message body and contact number"				
			});
		}				
	});
    
    app.get('/api/getHealthcareRequests/:id', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-health-request-for-contact',
            text: 'SELECT requestid AS "Request#", requesttype AS "Request Type", department As "Department", doctorname AS "Doctor Name",\
                   appointment AS "Date", appointmenttime AS "Time Slot", patientname AS "Patient Name", city AS "City", emailid AS "e-Mail",\
                   isrequestcomplete AS "Status" \
                   FROM healthcarerequests where contactid = $1',
            values: [req.params.id]
        };
        
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            if(err === "Record not found") {
                res.status('200').send(JSON.stringify([{
                    "Request#":"",
                    "Request Type" : "",
                    "Department" : "",
                    "Doctor Name" : "",
                    "Date" : "",
                    "Time Slot" : "", 
                    "Patient Name" : "",
                    "City" : "",
                    "e-Mail" : "",
                    "Status" : ""
                }]))
            }
            else {
                res.status('400').send("Error in fetching related data.");
            }
        });
    });

    app.get('/api/processwiseContacts', expressJwt({secret: jwtSecreteKey}), (req,res) => {
        const query = {
            // give the query a unique name
            name: 'api-fetch-current_process_contacts',
            text: 'SELECT COUNT(c.contactid) as "Contact Count", p.description as "Current Process" from contact as c, process as p where p.processid = c.currentprocess GROUP By p.description',
            values: []
        };
        pg_connector.connect(query)
        .then(response => {
            res.status('200').send(JSON.stringify(response));
        })
        .catch(err => {
            console.log(err);
            res.status('400').send(err);
        });
    });
	
};