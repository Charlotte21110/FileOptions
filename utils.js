const path = require('path');

// 验证目录名称是否符合规范
function validateDirectoryName(dirName) {
  // 空目录名视为有效（表示根目录）
  if (!dirName) return true;
  
  // 检查长度
  if (dirName.length > 50) return false;
  
  // 检查每个路径部分
  const parts = dirName.split(path.sep);
  const validChars = /^[a-zA-Z0-9_-]+$/;
  
  return parts.every(part => validChars.test(part));
}

// 计算文件哈希值
async function calculateFileHash(filePath, algorithm = 'md5') {
  const hash = crypto.createHash(algorithm);
  const stream = fs.createReadStream(filePath);
  
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

module.exports = {
  validateDirectoryName,
  calculateFileHash
};