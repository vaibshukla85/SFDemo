const crypto = require('crypto');

var utility = {
	encryptCipher: function(key, secreteCode) {
		try{
			var cipher = crypto.createCipher('aes192', secreteCode)
			var encryptedVal = cipher.update(key, 'utf8', 'hex');
			encryptedVal += cipher.final('hex');
			return encryptedVal;
		}catch(err){
			console.log(err);
			return;
		}
	},
	decryptCipher: function(key, secreteCode) {
		try{
			var decipher = crypto.createDecipher('aes192', secreteCode)
			var decryptedVal = decipher.update(key, 'hex', 'utf8');
			decryptedVal += decipher.final('utf8');
			return decryptedVal;
		}catch(err){
			console.log(err);
			return;
		}
	},
	randomString: function(){
		return Math.random().toString(36).slice(-15);
	}
};

module.exports = utility