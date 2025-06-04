#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function cleanupData() {
    console.log('🧹 Cleaning up old data files...');
    
    const dataDir = path.join(__dirname, '..', 'data');
    const reportsDir = path.join(__dirname, '..', 'reports');
    const tempDir = path.join(__dirname, '..', 'temp');
    
    try {
        // Get all data files
        const dataFiles = await fs.readdir(dataDir).catch(() => []);
        const reportFiles = await fs.readdir(reportsDir).catch(() => []);
        
        // Sort by date (newest first)
        const sortFiles = (files, prefix) => {
            return files
                .filter(file => file.startsWith(prefix))
                .sort()
                .reverse();
        };
        
        const crawlFiles = sortFiles(dataFiles, 'crawl-data-');
        const wordFiles = sortFiles(dataFiles, 'word-frequency-');
        const analysisFiles = sortFiles(reportFiles, 'analysis-report-');
        
        // Keep only the 5 most recent files of each type
        const keepCount = 5;
        
        // Clean crawl data files
        if (crawlFiles.length > keepCount) {
            const filesToDelete = crawlFiles.slice(keepCount);
            for (const file of filesToDelete) {
                await fs.remove(path.join(dataDir, file));
                console.log(`🗑️  Removed old crawl data: ${file}`);
            }
        }
        
        // Clean word frequency files
        if (wordFiles.length > keepCount) {
            const filesToDelete = wordFiles.slice(keepCount);
            for (const file of filesToDelete) {
                await fs.remove(path.join(dataDir, file));
                console.log(`🗑️  Removed old word frequency data: ${file}`);
            }
        }
        
        // Clean analysis reports
        if (analysisFiles.length > keepCount) {
            const filesToDelete = analysisFiles.slice(keepCount);
            for (const file of filesToDelete) {
                await fs.remove(path.join(reportsDir, file));
                console.log(`🗑️  Removed old analysis report: ${file}`);
            }
        }
        
        // Clean temp directory
        if (await fs.pathExists(tempDir)) {
            await fs.emptyDir(tempDir);
            console.log('🗑️  Cleaned temp directory');
        }
        
        // Calculate space saved
        const remainingFiles = {
            crawlData: Math.min(crawlFiles.length, keepCount),
            wordFreq: Math.min(wordFiles.length, keepCount),
            analysis: Math.min(analysisFiles.length, keepCount)
        };
        
        console.log('\n📊 Cleanup Summary:');
        console.log(`   Crawl data files: ${remainingFiles.crawlData} kept`);
        console.log(`   Word frequency files: ${remainingFiles.wordFreq} kept`);
        console.log(`   Analysis reports: ${remainingFiles.analysis} kept`);
        console.log('\n✅ Cleanup completed successfully!');
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    cleanupData();
}

module.exports = cleanupData;