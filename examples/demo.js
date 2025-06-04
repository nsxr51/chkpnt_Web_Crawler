const WebCrawler = require('../src/WebCrawler');
const DataAnalyzer = require('../src/analyzer');

/**
 * Example: Basic crawling and analysis
 */
async function basicExample() {
    console.log('🚀 Running Basic Crawling Example...\n');
    
    const crawler = new WebCrawler({
        maxDepth: 1,
        delay: 1000
    });
    
    try {
        // Crawl a simple website
        await crawler.crawl('https://example.com');
        
        // Print results
        crawler.printSummary();
        
        // Save data
        await crawler.saveData();
        
        console.log('\n✅ Basic example completed!');
        
    } catch (error) {
        console.error('❌ Basic example failed:', error.message);
    }
}

/**
 * Example: Advanced crawling with custom configuration
 */
async function advancedExample() {
    console.log('🚀 Running Advanced Crawling Example...\n');
    
    const crawler = new WebCrawler({
        maxDepth: 2,
        delay: 800,
        userAgent: 'CustomCrawler/1.0 (+example)'
    });
    
    try {
        // Crawl a news site (example)
        await crawler.crawl('https://httpbin.org/html');
        
        // Print detailed results
        console.log('\n📊 Detailed Analysis:');
        console.log(`Total execution time: ${(Date.now() - crawler.startTime) / 1000}s`);
        console.log(`Pages crawled: ${crawler.totalPages}`);
        console.log(`Words collected: ${crawler.totalWords.toLocaleString()}`);
        console.log(`Unique words: ${crawler.wordFrequency.size.toLocaleString()}`);
        
        // Get top 20 words
        const topWords = crawler.getTopWords(20);
        console.log('\n🔤 Top 20 Words:');
        topWords.forEach((item, index) => {
            console.log(`${(index + 1).toString().padStart(2)}. ${item.word.padEnd(20)} ${item.count.toString().padStart(5)} (${item.percentage}%)`);
        });
        
        // Calculate metrics
        const metrics = crawler.calculateMetrics();
        console.log('\n⚡ Performance Metrics:');
        console.log(`Success rate: ${metrics.successRate.toFixed(1)}%`);
        console.log(`Average response time: ${metrics.averageResponseTime.toFixed(0)}ms`);
        console.log(`Pages per minute: ${(crawler.totalPages / (metrics.totalExecutionTime / 60000)).toFixed(2)}`);
        
        // Save data and generate analysis
        await crawler.saveData();
        
        // Run analysis
        const analyzer = new DataAnalyzer();
        await analyzer.generateReport();
        
        console.log('\n✅ Advanced example completed with analysis!');
        
    } catch (error) {
        console.error('❌ Advanced example failed:', error.message);
    }
}

/**
 * Example: Programmatic data processing
 */
async function dataProcessingExample() {
    console.log('🚀 Running Data Processing Example...\n');
    
    const crawler = new WebCrawler({
        maxDepth: 1,
        delay: 500
    });
    
    try {
        await crawler.crawl('https://httpbin.org/html');
        
        // Custom data processing
        console.log('📈 Custom Analysis:');
        
        // Word length analysis
        const wordLengths = Array.from(crawler.wordFrequency.keys()).map(word => word.length);
        const avgWordLength = wordLengths.reduce((sum, len) => sum + len, 0) / wordLengths.length;
        
        console.log(`Average word length: ${avgWordLength.toFixed(2)} characters`);
        
        // Find words by length categories
        const shortWords = Array.from(crawler.wordFrequency.keys()).filter(word => word.length <= 4);
        const mediumWords = Array.from(crawler.wordFrequency.keys()).filter(word => word.length > 4 && word.length <= 8);
        const longWords = Array.from(crawler.wordFrequency.keys()).filter(word => word.length > 8);
        
        console.log(`Short words (≤4 chars): ${shortWords.length}`);
        console.log(`Medium words (5-8 chars): ${mediumWords.length}`);
        console.log(`Long words (>8 chars): ${longWords.length}`);
        
        // Most common word lengths
        const lengthFreq = {};
        wordLengths.forEach(len => {
            lengthFreq[len] = (lengthFreq[len] || 0) + 1;
        });
        
        const commonLengths = Object.entries(lengthFreq)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        console.log('\n📏 Most Common Word Lengths:');
        commonLengths.forEach(([length, count]) => {
            console.log(`${length} characters: ${count} words`);
        });
        
        // Vocabulary diversity analysis
        const totalWords = crawler.totalWords;
        const uniqueWords = crawler.wordFrequency.size;
        const diversityRatio = (uniqueWords / totalWords * 100).toFixed(2);
        
        console.log('\n🎯 Vocabulary Analysis:');
        console.log(`Total words: ${totalWords.toLocaleString()}`);
        console.log(`Unique words: ${uniqueWords.toLocaleString()}`);
        console.log(`Diversity ratio: ${diversityRatio}%`);
        
        console.log('\n✅ Data processing example completed!');
        
    } catch (error) {
        console.error('❌ Data processing example failed:', error.message);
    }
}

/**
 * Example: Error handling and resilience
 */
async function errorHandlingExample() {
    console.log('🚀 Running Error Handling Example...\n');
    
    const crawler = new WebCrawler({
        maxDepth: 1,
        delay: 500
    });
    
    // Test with various URLs including some that might fail
    const testUrls = [
        'https://httpbin.org/html',           // Should work
        'https://httpbin.org/status/404',     // Will return 404
        'https://invalid-domain-xyz.com',     // DNS failure
        'https://httpbin.org/delay/10',       // Timeout (if timeout is < 10s)
    ];
    
    for (const url of testUrls) {
        console.log(`\n🔍 Testing: ${url}`);
        
        try {
            await crawler.crawl(url);
            console.log(`✅ Success: ${crawler.crawlData.length} pages crawled`);
        } catch (error) {
            console.log(`❌ Expected error: ${error.message}`);
        }
        
        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 Error Summary:');
    console.log(`Total errors: ${crawler.errors.length}`);
    crawler.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.url}: ${error.error}`);
    });
    
    console.log('\n✅ Error handling example completed!');
}

// Main execution
async function runExamples() {
    console.log('🎯 Web Crawler Examples');
    console.log('=' + '='.repeat(50) + '\n');
    
    const examples = [
        { name: 'Basic Example', fn: basicExample },
        { name: 'Advanced Example', fn: advancedExample },
        { name: 'Data Processing Example', fn: dataProcessingExample },
        { name: 'Error Handling Example', fn: errorHandlingExample }
    ];
    
    // Run example based on command line argument
    const exampleName = process.argv[2];
    
    if (exampleName) {
        const example = examples.find(ex => ex.name.toLowerCase().includes(exampleName.toLowerCase()));
        if (example) {
            await example.fn();
        } else {
            console.log('❌ Example not found. Available examples:');
            examples.forEach(ex => console.log(`   - ${ex.name.toLowerCase().replace(' ', '-')}`));
        }
    } else {
        console.log('Available examples:');
        examples.forEach((ex, index) => {
            console.log(`${index + 1}. ${ex.name}`);
        });
        
        console.log('\nUsage:');
        console.log('node examples/demo.js basic');
        console.log('node examples/demo.js advanced');
        console.log('node examples/demo.js data-processing');
        console.log('node examples/demo.js error-handling');
        
        console.log('\nRunning basic example...\n');
        await basicExample();
    }
}

if (require.main === module) {
    runExamples().catch(console.error);
}

module.exports = {
    basicExample,
    advancedExample,
    dataProcessingExample,
    errorHandlingExample
};