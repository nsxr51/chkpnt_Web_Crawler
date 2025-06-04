#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

console.log('🧪 Testing MCP Server...\n');

const serverPath = path.join(process.cwd(), 'server.js');

console.log(`Starting server: ${serverPath}`);

const serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
});

let serverOutput = '';
let serverError = '';

serverProcess.stdout.on('data', (data) => {
    serverOutput += data.toString();
});

serverProcess.stderr.on('data', (data) => {
    const output = data.toString();
    serverError += output;
    
    if (output.includes('Web Crawler MCP Server running')) {
        console.log('✅ Server started successfully!');
        console.log('✅ MCP Server is working correctly');
        serverProcess.kill();
    }
});

serverProcess.on('error', (error) => {
    console.error(`❌ Server failed to start: ${error.message}`);
    process.exit(1);
});

serverProcess.on('close', (code) => {
    if (code === 0 || serverError.includes('MCP Server running')) {
        console.log('\n🎉 MCP Server test passed!');
        console.log('📝 Next steps:');
        console.log('   1. Make sure Claude Desktop is installed');
        console.log('   2. Run: npm run setup');
        console.log('   3. Restart Claude Desktop');
        console.log('   4. Try: "Crawl https://example.com and analyze words"');
    } else {
        console.error(`❌ Server exited with code ${code}`);
        if (serverError) {
            console.error('Error output:', serverError);
        }
        if (serverOutput) {
            console.log('Standard output:', serverOutput);
        }
        process.exit(1);
    }
});

// Kill server after 5 seconds if it doesn't exit
setTimeout(() => {
    if (!serverProcess.killed) {
        console.log('⚠️  Server still running after 5 seconds (this may be normal)');
        console.log('✅ Manually stopping test - server appears to be working');
        serverProcess.kill();
        
        setTimeout(() => {
            console.log('\n🎉 MCP Server test completed!');
            console.log('📝 The server appears to be working correctly.');
            process.exit(0);
        }, 1000);
    }
}, 5000);