#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');

async function benchmark() {
    console.log('⚡ Running Web Crawler Benchmark...');
    console.log('This will test crawling performance with different configurations\n');
    
    const WebCrawler = require('../src/WebCrawler');
    
    // Test configurations - now including concurrent modes
    const configs = [
        { name: 'Sequential (depth 1, 1000ms delay)', maxDepth: 1, delay: 1000, concurrent: false },
        { name: 'Sequential (depth 2, 1000ms delay)', maxDepth: 2, delay: 1000, concurrent: false },
        { name: 'Concurrent Fast (depth 1, 500ms delay, 5 workers)', maxDepth: 1, delay: 500, concurrent: true, concurrency: 5 },
        { name: 'Concurrent Fast (depth 2, 500ms delay, 5 workers)', maxDepth: 2, delay: 500, concurrent: true, concurrency: 5 },
        { name: 'Concurrent Turbo (depth 2, 300ms delay, 10 workers)', maxDepth: 2, delay: 300, concurrent: true, concurrency: 10 }
    ];
    
    // Test URLs (you can modify these)
    const testUrls = [
        'https://example.com',
        'https://httpbin.org/html'  // Reliable test endpoint
    ];
    
    const results = [];
    
    for (const config of configs) {
        console.log(`\n🔧 Testing configuration: ${config.name}`);
        console.log('-'.repeat(50));
        
        for (const url of testUrls) {
            console.log(`\n📍 Crawling: ${url}`);
            
            let crawler;
            if (config.concurrent) {
                const ConcurrentWebCrawler = require('../src/ConcurrentWebCrawler');
                crawler = new ConcurrentWebCrawler({
                    maxDepth: config.maxDepth,
                    delay: config.delay,
                    concurrency: config.concurrency || 5
                });
            } else {
                crawler = new WebCrawler({
                    maxDepth: config.maxDepth,
                    delay: config.delay
                });
            }
            
            const startTime = Date.now();
            
            try {
                await crawler.crawl(url);
                const endTime = Date.now();
                const executionTime = endTime - startTime;
                
                const metrics = crawler.calculateMetrics();
                
                const result = {
                    config: config.name,
                    url: url,
                    executionTime: executionTime,
                    pagesPerMinute: (crawler.totalPages / (executionTime / 60000)).toFixed(2),
                    totalPages: crawler.totalPages,
                    totalWords: crawler.totalWords,
                    uniqueWords: crawler.wordFrequency.size,
                    successRate: metrics.successRate.toFixed(1),
                    avgResponseTime: metrics.averageResponseTime.toFixed(0),
                    errors: crawler.errors.length
                };
                
                results.push(result);
                
                console.log(`✅ Results:`);
                console.log(`   Pages crawled: ${result.totalPages}`);
                console.log(`   Total words: ${result.totalWords.toLocaleString()}`);
                console.log(`   Unique words: ${result.uniqueWords.toLocaleString()}`);
                console.log(`   Success rate: ${result.successRate}%`);
                console.log(`   Pages/minute: ${result.pagesPerMinute}`);
                console.log(`   Avg response time: ${result.avgResponseTime}ms`);
                console.log(`   Execution time: ${(executionTime / 1000).toFixed(1)}s`);
                
            } catch (error) {
                console.error(`❌ Failed to crawl ${url}: ${error.message}`);
                results.push({
                    config: config.name,
                    url: url,
                    error: error.message,
                    success: false
                });
            }
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    // Generate benchmark report
    console.log('\n' + '='.repeat(60));
    console.log('📊 BENCHMARK SUMMARY');
    console.log('='.repeat(60));
    
    const successfulResults = results.filter(r => !r.error);
    
    if (successfulResults.length > 0) {
        console.log('\n🏆 Best Performance:');
        const fastest = successfulResults.reduce((best, current) => 
            parseFloat(current.pagesPerMinute) > parseFloat(best.pagesPerMinute) ? current : best
        );
        console.log(`   Configuration: ${fastest.config}`);
        console.log(`   URL: ${fastest.url}`);
        console.log(`   Pages per minute: ${fastest.pagesPerMinute}`);
        console.log(`   Success rate: ${fastest.successRate}%`);
        
        console.log('\n📈 Performance Comparison:');
        console.log('Config'.padEnd(30) + 'Pages/min'.padEnd(12) + 'Success%'.padEnd(10) + 'Avg RT(ms)');
        console.log('-'.repeat(60));
        
        for (const result of successfulResults) {
            console.log(
                result.config.slice(0, 29).padEnd(30) +
                result.pagesPerMinute.padEnd(12) +
                (result.successRate + '%').padEnd(10) +
                result.avgResponseTime + 'ms'
            );
        }
        
        // Calculate averages
        const avgPagesPerMin = (successfulResults.reduce((sum, r) => sum + parseFloat(r.pagesPerMinute), 0) / successfulResults.length).toFixed(2);
        const avgSuccessRate = (successfulResults.reduce((sum, r) => sum + parseFloat(r.successRate), 0) / successfulResults.length).toFixed(1);
        const avgResponseTime = (successfulResults.reduce((sum, r) => sum + parseFloat(r.avgResponseTime), 0) / successfulResults.length).toFixed(0);
        
        console.log('\n📊 Overall Averages:');
        console.log(`   Pages per minute: ${avgPagesPerMin}`);
        console.log(`   Success rate: ${avgSuccessRate}%`);
        console.log(`   Average response time: ${avgResponseTime}ms`);
    }
    
    // Show failed tests
    const failedResults = results.filter(r => r.error);
    if (failedResults.length > 0) {
        console.log('\n❌ Failed Tests:');
        failedResults.forEach(result => {
            console.log(`   ${result.config} + ${result.url}: ${result.error}`);
        });
    }
    
    // Save benchmark results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const benchmarkFile = path.join(__dirname, '..', 'reports', `benchmark-${timestamp}.json`);
    
    await fs.ensureDir(path.dirname(benchmarkFile));
    await fs.writeJSON(benchmarkFile, {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        results: results,
        summary: {
            totalTests: results.length,
            successfulTests: successfulResults.length,
            failedTests: failedResults.length,
            averagePerformance: successfulResults.length > 0 ? {
                pagesPerMinute: avgPagesPerMin,
                successRate: avgSuccessRate,
                avgResponseTime: avgResponseTime
            } : null
        }
    }, { spaces: 2 });
    
    console.log(`\n💾 Benchmark results saved to: ${benchmarkFile}`);
    console.log('\n🎯 Recommendations:');
    
    if (successfulResults.length > 0) {
        const bestConfig = successfulResults.reduce((best, current) => 
            parseFloat(current.pagesPerMinute) > parseFloat(best.pagesPerMinute) ? current : best
        );
        
        console.log(`   Use "${bestConfig.config}" for best performance`);
        
        if (parseFloat(avgSuccessRate) < 90) {
            console.log('   Consider increasing delays to improve success rate');
        }
        
        if (parseFloat(avgResponseTime) > 2000) {
            console.log('   High response times detected - check network connection');
        }
    }
    
    console.log('\n✅ Benchmark completed!');
}

if (require.main === module) {
    benchmark().catch(console.error);
}

module.exports = benchmark;