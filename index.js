const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { validateDirectoryName, calculateFileHash } = require('./utils');
const logger = require('./logger');

const app = express();
const PORT = 3000;
const BASE_DIR = path.join(__dirname, 'demo');

// 确保demo目录存在
async function ensureDemoDir() {
  try {
    await fs.mkdir(BASE_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create demo directory:', err);
  }
}

// 中间件
app.use(express.json());

// 路由
app.get('/list', async (req, res) => {
  try {
    logger.info(`Listing files in directory: ${BASE_DIR}`);
    const files = await fs.readdir(BASE_DIR, { withFileTypes: true });
    const fileList = await Promise.all(
      files
        .filter(dirent => dirent.isFile() && !dirent.name.startsWith('.'))
        .map(async dirent => {
          try {
            const filePath = path.join(BASE_DIR, dirent.name);
            console.log(`Reading file stats for: ${filePath}`);
            console.log(`Current working directory: ${process.cwd()}`);
            console.log(`BASE_DIR: ${BASE_DIR}`);
            console.log(`Full path: ${path.resolve(filePath)}`);
            
            console.log(`\n--- DEBUGGING FILE STATS ---`);
            console.log(`BASE_DIR: ${BASE_DIR}`);
            console.log(`Current working directory: ${process.cwd()}`);
            
            try {
              const stats = await fs.stat(filePath);
              console.log(`File stats for ${dirent.name}:`, stats);
              console.log(`File size in bytes: ${stats.size}`);
              
              const sizeInKB = stats.size / 1024;
              console.log(`Calculated size in KB: ${sizeInKB}`);
              
              const ext = path.extname(dirent.name).slice(1) || 'unknown';
              const size = sizeInKB < 0.01 ? 0.01 : parseFloat(sizeInKB.toFixed(2));
              
              return {
                name: dirent.name,
                size: size,
                unit: 'KB',
                format: ext
              };
            } catch (err) {
              console.error(`Error processing file ${dirent.name}:`, err);
              return {
                name: dirent.name,
                size: 0,
                unit: 'KB',
                format: 'error',
                error: err.message
              };
            }
        })
    );
    
    res.json(fileList);
  } catch (err) {
    console.error('Error listing files:', err);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

app.post('/copy', async (req, res) => {
  const { source, destination } = req.body;
  
  if (!source || !destination) {
    return res.status(400).json({ error: 'Source and destination are required' });
  }

  try {
    const sourcePath = path.join(BASE_DIR, source);
    const destPath = path.join(BASE_DIR, destination);
    const destDir = path.dirname(destPath);

    // 验证目标目录名称
    const dirName = path.dirname(destination);
    if (!validateDirectoryName(dirName)) {
      return res.status(400).json({ error: 'Invalid directory name' });
    }

    // 确保目标目录存在
    await fs.mkdir(destDir, { recursive: true });

    await fs.copyFile(sourcePath, destPath);
    res.json({ message: 'File copied successfully' });
  } catch (err) {
    console.error('Error copying file:', err);
    res.status(500).json({ error: 'Failed to copy file' });
  }
});

app.post('/move', async (req, res) => {
  const { source, destination } = req.body;
  
  if (!source || !destination) {
    return res.status(400).json({ error: 'Source and destination are required' });
  }

  try {
    const sourcePath = path.join(BASE_DIR, source);
    const destPath = path.join(BASE_DIR, destination);
    const destDir = path.dirname(destPath);

    // 验证目标目录名称
    const dirName = path.dirname(destination);
    if (!validateDirectoryName(dirName)) {
      return res.status(400).json({ error: 'Invalid directory name' });
    }

    // 确保目标目录存在
    await fs.mkdir(destDir, { recursive: true });

    await fs.rename(sourcePath, destPath);
    res.json({ message: 'File moved successfully' });
  } catch (err) {
    console.error('Error moving file:', err);
    res.status(500).json({ error: 'Failed to move file' });
  }
});

// 错误处理
// 批量复制文件
app.post('/batch-copy', async (req, res) => {
  const { operations } = req.body;
  
  if (!Array.isArray(operations)) {
    return res.status(400).json({ error: 'Operations must be an array' });
  }

  try {
    const results = await Promise.all(
      operations.map(async ({ source, destination }) => {
        try {
          const sourcePath = path.join(BASE_DIR, source);
          const destPath = path.join(BASE_DIR, destination);
          const destDir = path.dirname(destPath);

          // 验证目标目录名称
          const dirName = path.dirname(destination);
          if (!validateDirectoryName(dirName)) {
            throw new Error('Invalid directory name');
          }

          // 确保目标目录存在
          await fs.mkdir(destDir, { recursive: true });

          await fs.copyFile(sourcePath, destPath);
          logger.info(`Batch copied file from ${sourcePath} to ${destPath}`);
          return { source, destination, status: 'success' };
        } catch (err) {
          logger.error(`Batch copy failed for ${source}: ${err.message}`);
          return { source, destination, status: 'failed', error: err.message };
        }
      })
    );

    res.json({ results });
  } catch (err) {
    logger.error(`Batch copy error: ${err.message}`);
    res.status(500).json({ error: 'Batch operation failed' });
  }
});

// 批量移动文件
app.post('/batch-move', async (req, res) => {
  const { operations } = req.body;
  
  if (!Array.isArray(operations)) {
    return res.status(400).json({ error: 'Operations must be an array' });
  }

  try {
    const results = await Promise.all(
      operations.map(async ({ source, destination }) => {
        try {
          const sourcePath = path.join(BASE_DIR, source);
          const destPath = path.join(BASE_DIR, destination);
          const destDir = path.dirname(destPath);

          // 验证目标目录名称
          const dirName = path.dirname(destination);
          if (!validateDirectoryName(dirName)) {
            throw new Error('Invalid directory name');
          }

          // 确保目标目录存在
          await fs.mkdir(destDir, { recursive: true });

          await fs.rename(sourcePath, destPath);
          logger.info(`Batch moved file from ${sourcePath} to ${destPath}`);
          return { source, destination, status: 'success' };
        } catch (err) {
          logger.error(`Batch move failed for ${source}: ${err.message}`);
          return { source, destination, status: 'failed', error: err.message };
        }
      })
    );

    res.json({ results });
  } catch (err) {
    logger.error(`Batch move error: ${err.message}`);
    res.status(500).json({ error: 'Batch operation failed' });
  }
});

// 文件校验接口
app.get('/verify', async (req, res) => {
  const { filePath, algorithm = 'md5', expectedHash } = req.query;
  
  if (!filePath || !expectedHash) {
    return res.status(400).json({ 
      error: 'filePath and expectedHash are required' 
    });
  }

  try {
    const fullPath = path.join(BASE_DIR, filePath);
    const actualHash = await calculateFileHash(fullPath, algorithm);
    
    logger.info(`File verification for ${filePath}: ${algorithm}`);
    
    res.json({
      filePath,
      algorithm,
      expectedHash,
      actualHash,
      match: actualHash === expectedHash
    });
  } catch (err) {
    logger.error(`File verification failed for ${filePath}: ${err.message}`);
    res.status(500).json({ 
      error: 'File verification failed',
      details: err.message 
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 启动服务器
ensureDemoDir().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});