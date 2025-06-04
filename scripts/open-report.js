#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

async function openLatestReport() {
    console.log('🌐 Opening latest analysis report...');
    
    const reportsDir = path.join(__dirname, '..', 'reports');
    
    try {
        // Check if reports directory exists
        if (!await fs.pathExists(reportsDir)) {
            console.log('❌ No reports directory found. Please run the analyzer first.');
            console.log('   Run: npm run analyze');
            return;
        }
        
        // Get all HTML report files
        const files = await fs.readdir(reportsDir);
        const htmlFiles = files
            .filter(file => file.startsWith('analysis-report-') && file.endsWith('.html'))
            .sort()
            .reverse(); // Latest first
        
        if (htmlFiles.length === 0) {
            console.log('❌ No HTML reports found. Please run the analyzer first.');
            console.log('   Run: npm run analyze');
            return;
        }
        
        const latestReport = path.join(reportsDir, htmlFiles[0]);
        
        // Open the file
        let command;
        switch (os.platform()) {
            case 'darwin': // macOS
                command = `open "${latestReport}"`;
                break;
            case 'win32': // Windows
                command = `start "" "${latestReport}"`;
                break;
            default: // Linux and others
                command = `xdg-open "${latestReport}"`;
                break;
        }
        
        exec(command, (error) => {
            if (error) {
                console.log(`ℹ️  Could not auto-open file: ${error.message}`);
                console.log(`📄 Please manually open: ${latestReport}`);
            } else {
                console.log(`✅ Opened latest report: ${path.basename(latestReport)}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Failed to open report:', error.message);
    }
}

if (require.main === module) {
    openLatestReport();
}

module.exports = openLatestReport;