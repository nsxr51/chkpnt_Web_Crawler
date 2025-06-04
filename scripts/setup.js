#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function setupProject() {
    console.log('🚀 Setting up Web Crawler project...');
    
    const directories = [
        'data',
        'reports',
        'logs',
        'temp'
    ];
    
    // Create directories
    for (const dir of directories) {
        const dirPath = path.join(__dirname, '..', dir);
        await fs.ensureDir(dirPath);
        console.log(`✓ Created directory: ${dir}/`);
    }
    
    // Create .gitignore if it doesn't exist
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    if (!await fs.pathExists(gitignorePath)) {
        const gitignoreContent = `# Dependencies
node_modules/

# Data files
data/
reports/
logs/
temp/

# Environment files
.env
.env.local

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Coverage
coverage/

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`;
        await fs.writeFile(gitignorePath, gitignoreContent);
        console.log('✓ Created .gitignore');
    }
    
    // Check Node.js version
    const nodeVersion = process.version;
    console.log(`📦 Node.js version: ${nodeVersion}`);
    
    if (parseInt(nodeVersion.slice(1)) < 14) {
        console.warn('⚠️  Node.js 14+ recommended for best performance');
    }
    
    console.log('\n🎉 Project setup complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: npm start [URL]');
    console.log('3. Run: npm run analyze');
    console.log('\nExample: npm start https://example.com');
}

if (require.main === module) {
    setupProject().catch(console.error);
}

module.exports = setupProject;