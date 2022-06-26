const pg_connector = require('./pg_connector');
const twilio = require('twilio');
var request = require('request');

var whatsAppController = {};
const apiUri = 'https://pinbot.ai/wamessage/v1/send';
//const apiKey = '2f5a50c2-af1f-4800-a3d4-0e6699566659';
const apiKey = 'f0ede417-0ae7-4791-9df8-563a42679b72';
//Get Message from Database
whatsAppController.getRespMsg = function (strMsgId, strMsgBody, strMsgFrom, strWAid){
    var fromMobNo = strMsgFrom;
    return new Promise((resolve, reject) => {
        if(fromMobNo!== undefined && fromMobNo != null && fromMobNo.trim() !== '') {
            var query = {
                name: 'fetch-waMessage',
                text: 'SELECT * FROM getmessage($1,$2,$3,$4,$5,$6)',
                values: [strMsgId.trim(), 'RECIVED', strMsgBody.trim(), '917126789100', strMsgFrom.trim(), strWAid.trim()]
            };
            pg_connector.executeQuery(query)
            .then(response => {
                console.log('response from DB==>'+response);
                resolve(response);
            }, rej => {
                console.log(rej);
                reject(rej);
            }).catch(err => {
                reject(err);
            });
        } else {
            reject('No Value: ', fromMobNo);
        }
    });
}
//Send message to the contact
whatsAppController.sendWaMessage = function (msgStr, strMsgTo){
    return new Promise((resolve, reject) => {
        console.log('Message 2 Customer==>'+msgStr);
        console.log('Customer Mobile No==>'+strMsgTo);
        var options = {
            'method': 'POST',
            'url': apiUri,
            'headers': {
              'Content-Type': 'application/json',
              'apikey': apiKey
            },
            body: JSON.stringify({"to":strMsgTo,"type":"text","message":{"text":msgStr}})
          };
        request(options, function (error, response) {
            if (error){
                reject(error);
            } 
            resolve(response);
        });
    });
}

//Below is the old implementations
whatsAppController.getAccountInfo = function (strMsgId, strMsgStatus, strMsgBody, strMsgTo, strMsgFrom, strAccountSid, strMediaContentType, strMediaUrl){
    return new Promise((resolve, reject) => {
        var query = {
            name: 'fetch-Account',
            text: 'SELECT * FROM getMessage($1,$2,$3,$4,$5,$6)',
            values: [strMsgId.trim(), strMsgStatus.trim(), strMsgBody.trim(), strMsgTo.trim(), strAccountSid.trim(), strMsgFrom.trim()]
        };
        pg_connector.executeQuery(query)
        .then(response => {
            resolve(response);
        }, rej => {
            console.log(rej);
            reject(rej);
        }).catch(err => {
            reject(err);
        });
    });
}
//whatsAppController.sendMessage = function (msgStr, strMsgTo, mediaUrl){
whatsAppController.sendMessage = function (messageData){
        return new Promise((resolve, reject) => {
//        var accountSid = 'AC20358e170c8d1560245aff22b277c7a5'; // Your Account SID from www.twilio.com/
//        var authToken = '7f4bde4c8441499cdd03e3e4c52f3a10';   // Your Auth Token from www.twilio.com/
        var accountSid = 'ACaab0b076f7137f119a9b0ec439d7348b'; // Your Account SID from www.twilio.com/
        var authToken = '3b43e9a83b01dc321f687b7c667458cc';   // Your Auth Token from www.twilio.com/
        console.log("Inside the twilio app");
        debugger
        //console.log('strMsgTo b4====>'+strMsgTo);
        var client = new twilio(accountSid, authToken);
        var strMsgTo = 'whatsapp:'+messageData.msgfrom;
        var msgStr = messageData.msgresp;
        console.log('strMsgTo====>'+strMsgTo);
        console.log('msgStr====>'+msgStr);
        try {
            msgStr = decodeURIComponent(msgStr);
        } catch(ex) {
            console.log('Decode uri Component failed, or not required!',ex);
            console.log(msgStr);
        }
		var msgData = {
			body: msgStr,
            to: strMsgTo,  // Text this number
            from: 'whatsapp:+14155238886' // From a valid Twilio number
		};

        if(messageData.hasattachement){
			msgData["mediaUrl"] = messageData.attachmenturl;
        }

        client.messages.create(msgData)
        .then(message => {
            console.log(message.sid);
            resolve(message);
        })
        .catch(err => {
            console.log('Error occurred==>'+err);
			reject(err);
        });
    });
}
whatsAppController.getContact = function (strMsgFrom){
	strMsgFrom = strMsgFrom.replace("whatsapp:","");
    return new Promise((resolve, reject) => {
        var query = {
            name: 'get-contactid-from-mobileno',
            text: 'SELECT * FROM contact WHERE regmobno = $1',
            values: [strMsgFrom]
        };
        pg_connector.executeQuery(query)
        .then(message => {
			message = (message == 'NO_RECORD') ? [] : message;
            resolve(message);
        })
        .catch(err => {
            console.log(err);
        });
    });
}

whatsAppController.outBoundStatusUpdate = function (strMsgId, strMsgStatus){
    return new Promise((resolve, reject) => {
        var query = {
            name: 'Update-outbound',
            text: 'Update outbound_request set sms_status = $1 WHERE sms_sid = $2 ',
            values: [strMsgStatus.trim(), strMsgId.trim()]
        };
        pg_connector.executeQuery(query)
        .then(message => {
            resolve(message);
        })
        .catch(err => {
            console.log(err);
        });
    });
}
module.exports = whatsAppController;