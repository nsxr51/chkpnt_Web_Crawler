const WebCrawler = require('./WebCrawler');
const ConcurrentWebCrawler = require('./ConcurrentWebCrawler');

async function main() {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const startUrl = args.find(arg => !arg.startsWith('--')) || 'https://example.com';
    
    // Check for concurrent mode flag
    const useConcurrent = args.includes('--concurrent') || args.includes('-c');
    const concurrency = parseInt(args.find(arg => arg.startsWith('--concurrency='))?.split('=')[1]) || 5;
    const maxDepth = parseInt(args.find(arg => arg.startsWith('--depth='))?.split('=')[1]) || 2;
    const delay = parseInt(args.find(arg => arg.startsWith('--delay='))?.split('=')[1]) || (useConcurrent ? 500 : 1000);
    
    // Configuration
    const config = {
        maxDepth: maxDepth,
        delay: delay,
        concurrency: concurrency
    };
    
    console.log(`🕷️  Web Crawler Starting... ${useConcurrent ? '(Concurrent Mode)' : '(Sequential Mode)'}`);
    console.log(`📍 Starting URL: ${startUrl}`);
    console.log(`🔍 Max Depth: ${config.maxDepth}`);
    console.log(`⏱️  Delay: ${config.delay}ms`);
    if (useConcurrent) {
        console.log(`🚀 Concurrency: ${config.concurrency} workers`);
    }
    console.log('-'.repeat(60));
    
    try {
        let crawler;
        
        if (useConcurrent) {
            // Use concurrent crawler for better performance
            crawler = new ConcurrentWebCrawler(config);
        } else {
            // Use original sequential crawler
            crawler = new WebCrawler(config);
        }
        
        // Start crawling
        await crawler.crawl(startUrl);
        
        // Print results
        crawler.printSummary();
        
        // Save data
        await crawler.saveData();
        
        console.log('\n✅ Crawling completed successfully!');
        console.log('💡 Run "npm run analyze" to generate detailed analysis and visualizations');
        
        if (!useConcurrent) {
            console.log('🚀 Try concurrent mode for faster crawling: npm start [URL] --concurrent');
        }
        
    } catch (error) {
        console.error('❌ Crawling failed:', error.message);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n⏹️  Crawling interrupted by user');
    process.exit(0);
});

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    console.log(`
🕷️  Web Crawler Usage:

Basic usage:
  npm start [URL]                          # Sequential crawling
  npm start [URL] --concurrent             # Concurrent crawling (faster)

Options:
  --concurrent, -c                        # Enable concurrent crawling
  --concurrency=N                          # Number of concurrent workers (default: 5)
  --depth=N                                # Maximum crawling depth (default: 2)
  --delay=N                                # Delay between requests in ms (default: 1000/500)
  --help, -h                               # Show this help

Examples:
  npm start https://example.com            # Basic sequential crawling
  npm start https://news.ycombinator.com --concurrent
  npm start https://example.com --concurrent --concurrency=10 --depth=3
  npm start https://example.com --delay=2000 --depth=1

🚀 Concurrent mode is 3-5x faster than sequential mode!
`);
    process.exit(0);
}

// Run the crawler
if (require.main === module) {
    main();
}

module.exports = main;