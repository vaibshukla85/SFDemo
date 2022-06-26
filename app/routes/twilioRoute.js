const whatsappCnt = require('../controllers/whatsAppController');

var pollMessageInterval = null;
const messageTypes = {
    ChatRequestSuccess: "One moment please. We are connecting you with our service expert.",
    ChatRequestFail:"The chat request was not successful.",
    AgentDisconnect: "The agent has been disconnected from the chat.",
    ChatEnded: "The chat has ended. Please reply 'Yes' if we were able to solve your query and 'No' otherwise. If you have more queries just send *startchat* again.",
    ChatEstablished: "will be helping you.",
    ChatMessage: "Empty"
};

const stopPollingDataFromServer = function(){
    console.log("Polling stopped.....");
    clearInterval(pollMessageInterval);
}
/*{
	"SmsMessageSid":"SMe1d25646f4517ab015c5f5c41d034a4e",
"NumMedia":"0",
"SmsSid":"SMe1d25646f4517ab015c5f5c41d034a4e",
"SmsStatus":"received",
"Body":"Hi",
"To":"whatsapp:+14155238886",
"NumSegments":"1",
"MessageSid":"SMe1d25646f4517ab015c5f5c41d034a4e",
"AccountSid":"ACaab0b076f7137f119a9b0ec439d7348b",
"From":"whatsapp:+919619583618",
"ApiVersion":"2010-04-01"
}
strMsgId.trim(), strMsgStatus.trim(), strMsgBody.trim(), strMsgTo.trim(), strAccountSid.trim(), strMsgFrom.trim()
*/
module.exports = function(app) {
    app.post('/twilio/callback', (req,res) => {
		const msgId = req.body.SmsSid;
        const msgStatus = req.body.SmsStatus;
        const msgBody = req.body.Body;
        var msgTo = req.body.To;
        var msgFrom = req.body.From;
		const msgAccountSid = req.body.AccountSid;
		const msgMediaContentType = req.body.MediaContentType0;
		const MediaUrl = req.body.MediaUrl0;
		console.log(JSON.stringify(req.body));
		msgFrom = msgFrom.replace("whatsapp:", "");
		msgTo = msgTo.replace("whatsapp:", "");
		whatsappCnt.getAccountInfo(msgId, msgStatus, msgBody, msgTo, msgFrom, msgAccountSid, msgMediaContentType, MediaUrl)
        .then(customerData => {
            console.log('customerData===>',customerData);
            if(customerData === undefined || customerData === null) {
                console.log('unable to find the customer.');
            }else if(customerData !== 'NO_RECORD' && customerData.length>0){
                var messageData = customerData[0];
				//var strMsgData = customerData[0].msgresp;
				whatsappCnt.sendMessage(messageData)
				.then(success => {
					console.log(success);
					whatsappCnt.logSentMsg(strTempData[3],success.sid, success.status, success.from, success.to, success.body, strTempData[4])
					.then(success => {
						console.log(success);
					})
					.catch(err => {
						console.log(err);
					});
				}, 
				rej =>{
					console.log('Rejected===>'+rej);
				})
				.catch(err => {
						console.log(err);
					});
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
    
    app.post('/twilio/status', (req,res) => {
        const msgId = req.body.SmsSid;
        const msgStatus = req.body.SmsStatus;
        const msgBody = req.body.Body;
        const msgTo = req.body.To;
        const msgFrom = req.body.From;
        console.log(JSON.stringify(req.body));
    });
};