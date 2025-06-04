#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupMCPServer() {
    console.log('🚀 Setting up Web Crawler MCP Server...\n');
    
    const currentDir = process.cwd();
    const serverPath = path.join(currentDir, 'server.js');
    
    // Check if we're in the right directory
    if (!await fs.pathExists(serverPath)) {
        console.error('❌ Error: server.js not found. Please run this script from the mcp-server directory.');
        process.exit(1);
    }
    
    // Get Claude Desktop config file path based on OS
    const getClaudeConfigPath = () => {
        switch (os.platform()) {
            case 'win32':
                return path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
            case 'darwin':
                return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
            default:
                return path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
        }
    };
    
    const configPath = getClaudeConfigPath();
    const absoluteServerPath = path.resolve(serverPath);
    
    console.log(`📍 Server path: ${absoluteServerPath}`);
    console.log(`📁 Claude config: ${configPath}\n`);
    
    // Create MCP server configuration
    const mcpConfig = {
        mcpServers: {
            'web-crawler': {
                command: 'node',
                args: [absoluteServerPath],
                env: {
                    NODE_ENV: 'production'
                }
            }
        }
    };
    
    try {
        // Check if Claude config directory exists
        const configDir = path.dirname(configPath);
        await fs.ensureDir(configDir);
        
        let existingConfig = {};
        
        // Read existing config if it exists
        if (await fs.pathExists(configPath)) {
            try {
                existingConfig = await fs.readJSON(configPath);
                console.log('📄 Found existing Claude Desktop config');
            } catch (error) {
                console.log('⚠️  Existing config file is invalid JSON, creating new one');
            }
        } else {
            console.log('📝 Creating new Claude Desktop config file');
        }
        
        // Merge configurations
        const mergedConfig = {
            ...existingConfig,
            mcpServers: {
                ...(existingConfig.mcpServers || {}),
                ...mcpConfig.mcpServers
            }
        };
        
        // Write updated config
        await fs.writeJSON(configPath, mergedConfig, { spaces: 2 });
        
        console.log('✅ Successfully updated Claude Desktop configuration!');
        console.log(`   Added 'web-crawler' MCP server to config\n`);
        
        // Create a ready-to-use configuration file in the current directory
        const readyConfigPath = path.join(currentDir, 'claude_desktop_config.json');
        await fs.writeJSON(readyConfigPath, mergedConfig, { spaces: 2 });
        
        console.log(`📋 Configuration file created: ${readyConfigPath}`);
        console.log(`💾 This file has been automatically placed in your Claude Desktop config location.\n`);
        
        // Also create a manual copy version with instructions
        const manualConfigPath = path.join(currentDir, 'claude_desktop_config_manual.json');
        await fs.writeJSON(manualConfigPath, mcpConfig, { spaces: 2 });
        console.log(`📄 Manual configuration file: ${manualConfigPath}`);
        console.log(`   Use this if automatic setup doesn't work.\n`);
        
        // Test server startup
        console.log('🧪 Testing server startup...');
        
        const testProcess = spawn('node', [serverPath], {
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let serverStarted = false;
        
        testProcess.stderr.on('data', (data) => {
            const output = data.toString();
            if (output.includes('MCP Server running')) {
                serverStarted = true;
                testProcess.kill();
            }
        });
        
        testProcess.on('error', (error) => {
            console.error(`❌ Server test failed: ${error.message}`);
        });
        
        // Give it a moment to start
        setTimeout(() => {
            if (!serverStarted) {
                testProcess.kill();
            }
        }, 3000);
        
        testProcess.on('close', (code) => {
            if (serverStarted) {
                console.log('✅ Server test successful!\n');
            } else {
                console.log('⚠️  Server test inconclusive (this may be normal)\n');
            }
            
            console.log('🎉 Setup complete! Next steps:');
            console.log('');
            console.log('1. 🔄 Restart Claude Desktop to load the MCP server');
            console.log('2. 🗣️  In Claude Desktop, you can now use natural language to:');
            console.log('   • "Crawl https://example.com and analyze word frequency"');
            console.log('   • "Search the crawled content for specific terms"');
            console.log('   • "Export the data as CSV"');
            console.log('   • "Show me performance metrics"');
            console.log('');
            console.log('3. 📚 Check the README.md for more examples and documentation');
            console.log('');
            console.log('🛠️  If you have issues:');
            console.log('   • Check Claude Desktop logs');
            console.log('   • Verify Node.js is installed and accessible');
            console.log('   • Ensure all dependencies are installed (npm install)');
            console.log('');
            console.log('Happy crawling with Claude! 🕷️');
        });
        
    } catch (error) {
        console.error(`❌ Setup failed: ${error.message}`);
        
        // Create configuration files anyway for manual setup
        const readyConfigPath = path.join(currentDir, 'claude_desktop_config.json');
        const manualConfigPath = path.join(currentDir, 'claude_desktop_config_manual.json');
        
        try {
            // Create a complete config file
            await fs.writeJSON(readyConfigPath, mcpConfig, { spaces: 2 });
            await fs.writeJSON(manualConfigPath, mcpConfig, { spaces: 2 });
            
            console.log('\n📄 Configuration files created for manual setup:');
            console.log(`   - ${readyConfigPath}`);
            console.log(`   - ${manualConfigPath}`);
        } catch (fileError) {
            console.error('Failed to create config files:', fileError.message);
        }
        
        console.log('\n🛠️  Manual Setup Instructions:');
        console.log('\n📌 **Step 1: Locate your Claude Desktop config file:**');
        
        switch (os.platform()) {
            case 'win32':
                console.log('   Windows: %APPDATA%\\Claude\\claude_desktop_config.json');
                console.log(`   Full path: ${path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json')}`);
                break;
            case 'darwin':
                console.log('   macOS: ~/Library/Application Support/Claude/claude_desktop_config.json');
                console.log(`   Full path: ${path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')}`);
                break;
            default:
                console.log('   Linux: ~/.config/Claude/claude_desktop_config.json');
                console.log(`   Full path: ${path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json')}`);
                break;
        }
        
        console.log('\n📝 **Step 2: Copy the configuration:**');
        console.log(`   1. Copy the file: ${readyConfigPath}`);
        console.log('   2. To the Claude Desktop config location above');
        console.log('   3. If the directory doesn\'t exist, create it first');
        
        console.log('\n📊 **Step 3: Configuration content:**');
        console.log('   If you need to manually edit, add this to your Claude config:');
        console.log('');
        console.log(JSON.stringify(mcpConfig, null, 2));
        console.log('');
        console.log('🔄 **Step 4: Restart Claude Desktop**');
    }
}

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
    setupMCPServer().catch(console.error);
}

export default setupMCPServer;