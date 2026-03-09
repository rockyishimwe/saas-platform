const winston = require('winston');
const path = require('path');


const fs = require('fs');
const logsDir = path.join(__dirname,'../../logs');
if(!fs.existsSync(logsDir)){
    fs.mkdirSync(logsDir,{recursive:true});
}

const logFormat = winston.format.combine(
    winston.format.timestamp({format:'YYYY-MM-DD HH:mm:ss'}),
    winston.format.errors({stack:true}),
    winston.format.json()
);


const logger = winston.createLogger({
    level:process.env.LOG_LEVEL || 'info',
    format:logFormat,
    defaultMeta:{service:'saas-backend'},
    transports:[
        new winston.transports.File({
            filename:path.join(logsDir,'error.log'),
            level:'error'
        }),
        new winston.transports.File({
            filename:path.join(logsDir,'combined.log')
        })
    ]
});
if(process.env.NODE_ENV !== 'production'){
    logger.add(new winston.transports.Console({
        format:winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}
module.exports = logger;