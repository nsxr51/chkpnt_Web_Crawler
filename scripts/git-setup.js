#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function setupGit() {
    console.log('🔧 Setting up Git for Web Crawler project...\n');
    
    try {
        // Check if Git is installed
        try {
            execSync('git --version', { stdio: 'pipe' });
        } catch (error) {
            console.error('❌ Git is not installed or not in PATH');
            console.log('💡 Please install Git first: https://git-scm.com/download');
            process.exit(1);
        }
        
        // Check if we're in a Git repository
        let isGitRepo = false;
        try {
            execSync('git rev-parse --git-dir', { stdio: 'pipe' });
            isGitRepo = true;
            console.log('📁 Already in a Git repository');
        } catch (error) {
            console.log('📁 Initializing new Git repository...');
            execSync('git init');
            console.log('✅ Git repository initialized');
        }
        
        // Check Git user configuration
        let userName = '';
        let userEmail = '';
        
        try {
            userName = execSync('git config user.name', { encoding: 'utf8' }).trim();
            userEmail = execSync('git config user.email', { encoding: 'utf8' }).trim();
        } catch (error) {
            // User not configured
        }
        
        if (!userName || !userEmail) {
            console.log('\n👤 Git user not configured. Let\\'s set it up:');
            console.log('💡 You can use global config: git config --global user.name "Your Name"');
            console.log('💡 Or set for this project only with the commands below:\n');
            
            console.log('🔧 Recommended Git user setup commands:');
            console.log('git config user.name "Your Full Name"');
            console.log('git config user.email "your.email@example.com"');
            console.log('');
            console.log('Example for this project:');
            console.log('git config user.name "Lior B"');
            console.log('git config user.email "lior.b@example.com"');
            
        } else {
            console.log(`\n👤 Git user configured:`);
            console.log(`   Name: ${userName}`);
            console.log(`   Email: ${userEmail}`);
        }
        
        // Check if .gitignore exists
        const gitignorePath = path.join(process.cwd(), '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            console.log('\n📝 .gitignore file exists');
        } else {
            console.log('\n⚠️  .gitignore file not found');
            console.log('💡 Run: npm run setup to create project files');
        }
        
        // Check repository status
        try {
            const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
            if (status) {
                const lines = status.split('\\n');
                console.log(`\n📊 Repository status: ${lines.length} files with changes`);
                console.log('💡 To commit changes:');
                console.log('   git add .');
                console.log('   git commit -m "Your commit message"');
            } else {
                console.log('\n✅ Working directory is clean');
            }
        } catch (error) {
            console.log('\n📊 No commits yet in repository');
            console.log('💡 To make initial commit:');
            console.log('   git add .');
            console.log('   git commit -m "Initial commit: Web crawler project"');
        }
        
        // Check for remote repositories
        try {
            const remotes = execSync('git remote -v', { encoding: 'utf8' }).trim();
            if (remotes) {
                console.log('\n🌐 Remote repositories:');
                console.log(remotes);
            } else {
                console.log('\n🌐 No remote repositories configured');
                console.log('💡 To add a remote repository:');
                console.log('   git remote add origin https://github.com/username/web-crawler.git');
                console.log('   git push -u origin main');
            }
        } catch (error) {
            console.log('\n🌐 No remote repositories configured');
        }
        
        console.log('\n🎉 Git setup information complete!');
        console.log('\n📚 Common Git commands for this project:');
        console.log('   git add .                    # Stage all changes');
        console.log('   git commit -m "message"      # Commit changes');
        console.log('   git push                     # Push to remote');
        console.log('   git pull                     # Pull from remote');
        console.log('   git status                   # Check status');
        console.log('   git log --oneline            # View commit history');
        
        console.log('\n📁 Project-specific recommendations:');
        console.log('   - Use meaningful commit messages');
        console.log('   - Commit frequently with small, logical changes');
        console.log('   - Don\\'t commit data/ or reports/ directories (already in .gitignore)');
        console.log('   - Test your changes before committing');
        
    } catch (error) {
        console.error(`❌ Git setup failed: ${error.message}`);
        process.exit(1);
    }
}

if (require.main === module) {
    setupGit();
}

module.exports = setupGit;