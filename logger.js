const winston = require('winston');
const path = require('path');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ 
      filename: path.join(__dirname, 'logs', 'file-ops.log'),
      maxsize: 1024 * 1024 * 5 // 5MB
    })
  ]
});

// 确保日志目录存在
const fs = require('fs').promises;
fs.mkdir(path.join(__dirname, 'logs'), { recursive: true })
  .catch(err => console.error('Failed to create logs directory:', err));

module.exports = logger;