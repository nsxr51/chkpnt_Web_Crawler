#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function ask(question) {
    return new Promise((resolve) => {
        rl.question(question, resolve);
    });
}

async function fixGitPush() {
    console.log('🔧 Git Push Troubleshooter\n');
    
    try {
        // Check current status
        console.log('📊 Current Git Status:');
        try {
            const status = execSync('git status --porcelain', { encoding: 'utf8' });
            const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
            console.log(`   Current branch: ${branch}`);
            
            try {
                const remotes = execSync('git remote -v', { encoding: 'utf8' });
                console.log('   Remote repositories:');
                console.log('   ' + remotes.replace(/\n/g, '\n   '));
            } catch (e) {
                console.log('   ❌ No remote repositories configured');
            }
        } catch (error) {
            console.log('   ❌ Not in a Git repository or Git not configured');
            process.exit(1);
        }
        
        console.log('\n🤔 What seems to be the issue?');
        console.log('1. Authentication failed (username/password)');
        console.log('2. Remote repository not found (404)');
        console.log('3. No remote repository configured');
        console.log('4. Wrong branch name');
        console.log('5. Network/timeout issues');
        
        const choice = await ask('\nEnter choice (1-5): ');
        
        switch (choice) {
            case '1':
                console.log('\n🔑 Authentication Fix:');
                console.log('GitHub no longer accepts passwords for Git operations.');
                console.log('You need a Personal Access Token (PAT):\n');
                console.log('1. Go to: https://github.com/settings/tokens');
                console.log('2. Generate new token → Classic');
                console.log('3. Select "repo" permissions');
                console.log('4. Copy the token');
                console.log('5. Use token as password when Git prompts\n');
                
                const setupCredentials = await ask('Setup credential helper to remember token? (y/n): ');
                if (setupCredentials.toLowerCase() === 'y') {
                    execSync('git config --global credential.helper store');
                    console.log('✅ Credential helper configured');
                }
                break;
                
            case '2':
                console.log('\n🌐 Repository Setup:');
                const repoUrl = await ask('Enter your GitHub repository URL: ');
                
                try {
                    execSync(`git remote remove origin`);
                } catch (e) {
                    // Remote might not exist
                }
                
                execSync(`git remote add origin ${repoUrl}`);
                console.log('✅ Remote repository configured');
                break;
                
            case '3':
                console.log('\n📁 Creating Remote Repository:');
                console.log('1. Go to: https://github.com/new');
                console.log('2. Create repository named "web-crawler"');
                console.log('3. Do NOT initialize with README (you already have files)');
                
                const username = await ask('Enter your GitHub username: ');
                const repoName = await ask('Enter repository name (default: web-crawler): ') || 'web-crawler';
                
                const newRepoUrl = `https://github.com/${username}/${repoName}.git`;
                
                try {
                    execSync(`git remote remove origin`);
                } catch (e) {
                    // Remote might not exist
                }
                
                execSync(`git remote add origin ${newRepoUrl}`);
                console.log('✅ Remote repository configured');
                break;
                
            case '4':
                console.log('\n🌿 Branch Fix:');
                try {
                    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
                    console.log(`Current branch: ${currentBranch}`);
                    
                    if (currentBranch !== 'main') {
                        const rename = await ask(`Rename "${currentBranch}" to "main"? (y/n): `);
                        if (rename.toLowerCase() === 'y') {
                            execSync('git branch -m main');
                            console.log('✅ Branch renamed to main');
                        }
                    }
                } catch (error) {
                    console.log('❌ Error checking branch:', error.message);
                }
                break;
                
            case '5':
                console.log('\n🌐 Network Troubleshooting:');
                console.log('1. Check internet connection');
                console.log('2. Try pushing smaller commits');
                console.log('3. Use different network if possible');
                console.log('4. Try SSH instead of HTTPS');
                
                const trySsh = await ask('Setup SSH authentication? (y/n): ');
                if (trySsh.toLowerCase() === 'y') {
                    console.log('\nSSH Setup Instructions:');
                    console.log('1. Generate SSH key: ssh-keygen -t ed25519 -C "your.email@example.com"');
                    console.log('2. Add to SSH agent: ssh-add ~/.ssh/id_ed25519');
                    console.log('3. Copy public key: cat ~/.ssh/id_ed25519.pub');
                    console.log('4. Add to GitHub: Settings → SSH and GPG keys → New SSH key');
                    console.log('5. Change remote URL to SSH format');
                }
                break;
        }
        
        console.log('\n🚀 Ready to try pushing?');
        const tryPush = await ask('Attempt git push now? (y/n): ');
        
        if (tryPush.toLowerCase() === 'y') {
            console.log('\n⏳ Attempting to push...');
            try {
                // First ensure we're on the right branch and have commits
                try {
                    execSync('git add .');
                    execSync('git commit -m "Initial commit: Web crawler project"');
                } catch (e) {
                    // Might already be committed
                }
                
                execSync('git push -u origin main', { stdio: 'inherit' });
                console.log('\n✅ Successfully pushed to repository!');
            } catch (error) {
                console.log('\n❌ Push failed. Error details above.');
                console.log('\n💡 Additional troubleshooting:');
                console.log('1. Verify repository exists on GitHub');
                console.log('2. Check authentication (use Personal Access Token)');
                console.log('3. Ensure you have push permissions');
                console.log('4. Try: git push origin main --verbose');
            }
        }
        
        console.log('\n📚 Useful Git commands:');
        console.log('git status                 # Check current status');
        console.log('git remote -v              # Check remote repositories');
        console.log('git push origin main       # Push to main branch');
        console.log('git push --set-upstream origin main  # Set upstream and push');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        rl.close();
    }
}

if (require.main === module) {
    fixGitPush();
}

module.exports = fixGitPush;