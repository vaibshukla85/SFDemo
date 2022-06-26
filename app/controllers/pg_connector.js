const { Pool } = require('pg');
const connectionString = 'postgres://imrazmxvwnmwfi:8157615bd4df10292442cecb0df7717746aa7ded1ab26e98b1f870493382672e@ec2-107-20-15-85.compute-1.amazonaws.com:5432/d16u1k67dss6q2';

const pool = new Pool({
    connectionString: connectionString,
    ssl: true
});

var pg_connector = {};
pg_connector.getPgClient = pool;

pg_connector.connect = (query) => {
    return new Promise( (resolve, reject) => {
        pool.connect()
        .then(client => {
            client.query(query)
            .then(res => {
                client.release();
                if(res.rows.length > 0) {
                    console.log("User found");
                    return resolve(res.rows);
                } else if(query.name.indexOf('create') > -1) {
                    console.log("Record created!! Operation successful:",query.name);
                    return resolve("RECORD_CREATED");
                } else {
                    console.log("Record not found!!");
                    return resolve(null);
                }
            })
            .catch(e => {
                console.error(e.stack);
                client.release();
                return reject(e);
            });
        }).catch(e => {
            console.log('Releasing clinet becuase of pool not available',e);
            reject(e);
        });

    });
};

pg_connector.executeQuery = (query) => {
    return new Promise( (resolve, reject) => {
        pool.connect()
        .then(client => {
            client.query(query)
            .then(res => {
                client.release();
                if(res.rows.length>0) {
                    return resolve(res.rows);
                } else if(query.name.indexOf('create')>-1) {
                    console.log("Record created!! Operation successful:",query.name);
                    return resolve("RECORD_CREATED");
                } else {
                    console.log("Record not found!!");
                    return resolve("NO_RECORD");
                }
            })
            .catch(e => {
                console.error(e.stack);
                client.release();
                return reject(e);
            });
        }).catch(e => {            
            console.log('Releasing clinet becuase of pool not available',e);
            reject(e);
        });
    });
};


pg_connector.initiateTemplateScriptForContact = (contactIdArr, stageId, processId) => {
    return new Promise((resolve, reject) => {
        pool.connect().then(client => {
			for ( var j = 0; j < contactIdArr.length ; j++ ) {
				var contactId = contactIdArr[j];//some manipulation of someArr[i]
				(function(val){	
					const query = {
						// give the query a unique name
						name: 'enable-template-script-for-contact',
						text: 'UPDATE contact SET iscustregcom = $1, currentstage = $2, currentprocess = $3 WHERE contactid = $4',
						values: [false, stageId, processId, val]
					};
					client.query(query).then(res => {
						resolve(true);
						console.log(res);
					}).catch(e => {
						client.release();
						reject(e);
					});
				})(contactId);
			}
		}).catch(e => {
            reject(e);
        });
    });
}
module.exports = pg_connector;