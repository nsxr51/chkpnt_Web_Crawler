const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');
const robotsParser = require('robots-parser');

class ConcurrentWebCrawler {
    constructor(options = {}) {
        this.maxDepth = options.maxDepth || 2;
        this.delay = options.delay || 500; // Reduced default delay for faster crawling
        this.concurrency = options.concurrency || 5; // Number of simultaneous requests
        this.maxPagesPerDomain = options.maxPagesPerDomain || 50;
        this.requestTimeout = options.requestTimeout || 10000;
        
        // Data storage
        this.visitedUrls = new Set();
        this.crawlData = [];
        this.wordFrequency = new Map();
        this.totalWords = 0;
        this.totalPages = 0;
        this.errors = [];
        this.startTime = Date.now();
        
        // Queue management
        this.urlQueue = [];
        this.activeRequests = 0;
        this.maxActiveRequests = this.concurrency;
        
        // Performance metrics
        this.metrics = {
            requestCount: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            responseTimes: [],
            wordsPerPage: [],
            linksPerPage: [],
            concurrentPeaks: []
        };
        
        // Rate limiting per domain
        this.domainQueues = new Map();
        this.domainLastRequest = new Map();
        
        // User agent for respectful crawling
        this.userAgent = options.userAgent || 'ConcurrentWebCrawler/1.0 (+educational-purpose)';
        
        // Progress tracking
        this.progressCallback = options.progressCallback || this.defaultProgressCallback;
    }

    /**
     * Main concurrent crawling function
     */
    async crawl(startUrl) {
        console.log(`🚀 Starting concurrent crawling with ${this.concurrency} workers...`);
        console.log(`📍 Starting URL: ${startUrl}`);
        console.log(`🔍 Max Depth: ${this.maxDepth}, Concurrency: ${this.concurrency}`);
        console.log('-'.repeat(60));
        
        // Initialize the queue with the starting URL
        this.urlQueue.push({ url: startUrl, depth: 0 });
        
        // Start concurrent workers
        const workers = [];
        for (let i = 0; i < this.concurrency; i++) {
            workers.push(this.worker(i));
        }
        
        // Wait for all workers to complete
        await Promise.all(workers);
        
        console.log('\n✅ Concurrent crawling completed!');
        this.printConcurrencyStats();
    }

    /**
     * Worker function that processes URLs from the queue
     */
    async worker(workerId) {
        while (true) {
            // Get next URL from queue
            const urlData = this.getNextUrl();
            if (!urlData) {
                // No more URLs and no active requests - we're done
                if (this.activeRequests === 0) {
                    break;
                }
                // Wait a bit and check again
                await this.sleep(100);
                continue;
            }

            const { url, depth } = urlData;
            
            // Skip if already visited or depth exceeded
            if (this.visitedUrls.has(url) || depth > this.maxDepth) {
                continue;
            }

            this.activeRequests++;
            this.metrics.concurrentPeaks.push(this.activeRequests);
            
            try {
                await this.processUrl(url, depth, workerId);
            } catch (error) {
                console.error(`Worker ${workerId}: Failed to process ${url}: ${error.message}`);
            } finally {
                this.activeRequests--;
            }
            
            // Respect rate limiting
            await this.respectRateLimit(url);
        }
    }

    /**
     * Get next URL from queue (thread-safe)
     */
    getNextUrl() {
        if (this.urlQueue.length === 0) {
            return null;
        }
        return this.urlQueue.shift();
    }

    /**
     * Process a single URL
     */
    async processUrl(url, depth, workerId) {
        if (this.visitedUrls.has(url)) {
            return;
        }

        this.visitedUrls.add(url);
        
        try {
            // Check robots.txt compliance
            const isAllowed = await this.checkRobotsTxt(url);
            if (!isAllowed) {
                console.log(`🤖 Worker ${workerId}: Robots.txt disallows: ${url}`);
                return;
            }

            const startRequestTime = Date.now();
            
            // Fetch page content with timeout
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.userAgent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                    'Accept-Encoding': 'gzip, deflate',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1'
                },
                timeout: this.requestTimeout,
                maxRedirects: 3
            });

            const responseTime = Date.now() - startRequestTime;
            this.metrics.responseTimes.push(responseTime);
            this.metrics.requestCount++;
            this.metrics.successfulRequests++;

            // Parse HTML content
            const $ = cheerio.load(response.data);
            
            // Extract text content
            const textContent = this.extractText($);
            
            // Count words in the content
            const wordCount = this.countWords(textContent);
            
            // Extract links for next depth level
            const links = this.extractLinks($, url);
            
            // Store page data
            const pageData = {
                url: url,
                depth: depth,
                title: $('title').text().trim(),
                wordCount: Object.keys(wordCount).length,
                totalWords: Object.values(wordCount).reduce((sum, count) => sum + count, 0),
                linkCount: links.length,
                timestamp: new Date().toISOString(),
                responseTime: responseTime,
                textLength: textContent.length,
                words: wordCount,
                links: links,
                processedBy: `Worker-${workerId}`
            };

            // Thread-safe data updates
            this.updateSharedData(pageData, wordCount);

            // Progress reporting
            this.progressCallback({
                workerId,
                url,
                depth,
                totalPages: this.totalPages,
                totalWords: this.totalWords,
                responseTime
            });

            // Add discovered links to queue for next depth level
            if (depth < this.maxDepth) {
                this.addLinksToQueue(links, depth + 1);
            }

        } catch (error) {
            this.metrics.requestCount++;
            this.metrics.failedRequests++;
            this.errors.push({
                url: url,
                error: error.message,
                timestamp: new Date().toISOString(),
                workerId: workerId
            });
            
            // Don't log every error to avoid spam, just count them
            if (this.errors.length % 10 === 1) {
                console.error(`⚠️  Worker ${workerId}: Error crawling ${url}: ${error.message}`);
            }
        }
    }

    /**
     * Thread-safe update of shared data
     */
    updateSharedData(pageData, wordCount) {
        // Add page data
        this.crawlData.push(pageData);
        this.totalPages++;
        this.metrics.wordsPerPage.push(pageData.totalWords);
        this.metrics.linksPerPage.push(pageData.linkCount);

        // Update global word frequency
        Object.entries(wordCount).forEach(([word, count]) => {
            this.wordFrequency.set(word, (this.wordFrequency.get(word) || 0) + count);
            this.totalWords += count;
        });
    }

    /**
     * Add links to processing queue
     */
    addLinksToQueue(links, depth) {
        // Limit links per page to prevent explosion
        const maxLinksToAdd = Math.min(links.length, 10);
        const linksToAdd = links.slice(0, maxLinksToAdd);
        
        for (const link of linksToAdd) {
            if (!this.visitedUrls.has(link) && this.urlQueue.length < 1000) {
                this.urlQueue.push({ url: link, depth });
            }
        }
    }

    /**
     * Rate limiting per domain
     */
    async respectRateLimit(url) {
        try {
            const domain = new URL(url).hostname;
            const lastRequest = this.domainLastRequest.get(domain) || 0;
            const timeSinceLastRequest = Date.now() - lastRequest;
            
            if (timeSinceLastRequest < this.delay) {
                const waitTime = this.delay - timeSinceLastRequest;
                await this.sleep(waitTime);
            }
            
            this.domainLastRequest.set(domain, Date.now());
        } catch (error) {
            // If URL parsing fails, just apply default delay
            await this.sleep(this.delay);
        }
    }

    /**
     * Default progress callback
     */
    defaultProgressCallback(progress) {
        if (progress.totalPages % 5 === 0 || progress.totalPages <= 10) {
            console.log(`🔄 Worker ${progress.workerId}: Page ${progress.totalPages} | ${progress.url.substring(0, 60)}... | ${progress.responseTime}ms | Depth ${progress.depth}`);
        }
    }

    /**
     * Extract meaningful text from HTML (same as original)
     */
    extractText($) {
        // Remove script and style elements
        $('script, style, nav, header, footer, aside, .sidebar, .menu, .advertisement').remove();
        
        // Extract text from main content areas
        const textElements = $('p, h1, h2, h3, h4, h5, h6, article, main, section, .content, .post, .entry');
        let text = '';
        
        textElements.each((i, element) => {
            const elementText = $(element).text().trim();
            if (elementText.length > 10) { // Filter out very short elements
                text += elementText + ' ';
            }
        });
        
        // Fallback to body text if no content found
        if (text.trim().length === 0) {
            text = $('body').text();
        }
        
        return text.trim();
    }

    /**
     * Count word frequency in text (optimized)
     */
    countWords(text) {
        const words = text
            .toLowerCase()
            .replace(/[^\w\s\u00C0-\u017F]/g, ' ') // Include accented characters
            .split(/\s+/)
            .filter(word => word.length > 2 && word.length < 50) // Filter reasonable word lengths
            .filter(word => !/^\d+$/.test(word)); // Exclude pure numbers
        
        const wordCount = {};
        for (const word of words) {
            wordCount[word] = (wordCount[word] || 0) + 1;
        }
        
        return wordCount;
    }

    /**
     * Extract and normalize links from page (optimized)
     */
    extractLinks($, baseUrl) {
        const links = new Set(); // Use Set to automatically handle duplicates
        const baseUrlObj = new URL(baseUrl);
        
        $('a[href]').each((i, element) => {
            try {
                const href = $(element).attr('href');
                if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
                    return;
                }
                
                const absoluteUrl = new URL(href, baseUrl).toString();
                const linkUrl = new URL(absoluteUrl);
                
                // Only crawl same domain links
                if (linkUrl.hostname === baseUrlObj.hostname && 
                    !absoluteUrl.match(/\.(pdf|jpg|jpeg|png|gif|css|js|ico|svg|zip|doc|docx|xls|xlsx|ppt|pptx)$/i)) {
                    links.add(absoluteUrl);
                }
            } catch (error) {
                // Skip invalid URLs
            }
        });
        
        return Array.from(links);
    }

    /**
     * Check robots.txt compliance (cached)
     */
    async checkRobotsTxt(url) {
        try {
            const urlObj = new URL(url);
            const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
            
            // Simple caching to avoid repeated requests
            if (!this.robotsCache) {
                this.robotsCache = new Map();
            }
            
            if (this.robotsCache.has(urlObj.host)) {
                const robots = this.robotsCache.get(urlObj.host);
                return robots ? robots.isAllowed(url, this.userAgent) : true;
            }
            
            const response = await axios.get(robotsUrl, { 
                timeout: 5000,
                headers: { 'User-Agent': this.userAgent }
            });
            const robots = robotsParser(robotsUrl, response.data);
            this.robotsCache.set(urlObj.host, robots);
            
            return robots.isAllowed(url, this.userAgent);
        } catch (error) {
            // If robots.txt doesn't exist or can't be fetched, assume allowed
            if (!this.robotsCache) {
                this.robotsCache = new Map();
            }
            this.robotsCache.set(new URL(url).host, null);
            return true;
        }
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Calculate performance metrics (enhanced)
     */
    calculateMetrics() {
        const executionTime = Date.now() - this.startTime;
        
        this.metrics.averageResponseTime = this.metrics.responseTimes.length > 0 
            ? this.metrics.responseTimes.reduce((sum, time) => sum + time, 0) / this.metrics.responseTimes.length 
            : 0;
        
        const maxConcurrency = this.metrics.concurrentPeaks.length > 0 
            ? Math.max(...this.metrics.concurrentPeaks) 
            : 0;
        
        const avgConcurrency = this.metrics.concurrentPeaks.length > 0 
            ? this.metrics.concurrentPeaks.reduce((sum, peak) => sum + peak, 0) / this.metrics.concurrentPeaks.length 
            : 0;

        return {
            ...this.metrics,
            totalExecutionTime: executionTime,
            successRate: this.metrics.requestCount > 0 ? (this.metrics.successfulRequests / this.metrics.requestCount) * 100 : 0,
            averageWordsPerPage: this.metrics.wordsPerPage.length > 0 
                ? this.metrics.wordsPerPage.reduce((sum, count) => sum + count, 0) / this.metrics.wordsPerPage.length 
                : 0,
            averageLinksPerPage: this.metrics.linksPerPage.length > 0 
                ? this.metrics.linksPerPage.reduce((sum, count) => sum + count, 0) / this.metrics.linksPerPage.length 
                : 0,
            pagesPerMinute: (this.totalPages / (executionTime / 60000)).toFixed(2),
            pagesPerSecond: (this.totalPages / (executionTime / 1000)).toFixed(2),
            maxConcurrency: maxConcurrency,
            avgConcurrency: avgConcurrency.toFixed(1),
            efficiency: ((this.totalPages / (executionTime / 1000)) * 100 / this.concurrency).toFixed(1)
        };
    }

    /**
     * Print concurrency statistics
     */
    printConcurrencyStats() {
        const metrics = this.calculateMetrics();
        
        console.log('\n⚡ CONCURRENT CRAWLING PERFORMANCE:');
        console.log(`   Max concurrent requests: ${metrics.maxConcurrency}`);
        console.log(`   Avg concurrent requests: ${metrics.avgConcurrency}`);
        console.log(`   Pages per second: ${metrics.pagesPerSecond}`);
        console.log(`   Pages per minute: ${metrics.pagesPerMinute}`);
        console.log(`   Concurrency efficiency: ${metrics.efficiency}%`);
        console.log(`   Total execution time: ${(metrics.totalExecutionTime / 1000).toFixed(1)}s`);
    }

    /**
     * Get top words by frequency
     */
    getTopWords(limit = 50) {
        return Array.from(this.wordFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([word, count]) => ({ word, count, percentage: (count / this.totalWords * 100).toFixed(2) }));
    }

    /**
     * Save crawl data to files
     */
    async saveData() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const dataDir = path.join(__dirname, '..', 'data');
        
        // Ensure data directory exists
        await fs.ensureDir(dataDir);
        
        const metrics = this.calculateMetrics();
        
        // Save detailed crawl data with concurrency metrics
        const crawlDataFile = path.join(dataDir, `concurrent-crawl-data-${timestamp}.json`);
        await fs.writeJSON(crawlDataFile, {
            metadata: {
                crawlerType: 'ConcurrentWebCrawler',
                startTime: new Date(this.startTime).toISOString(),
                endTime: new Date().toISOString(),
                totalPages: this.totalPages,
                totalWords: this.totalWords,
                maxDepth: this.maxDepth,
                concurrency: this.concurrency,
                metrics: metrics
            },
            pages: this.crawlData,
            topWords: this.getTopWords(),
            errors: this.errors
        }, { spaces: 2 });
        
        // Save word frequency as CSV
        const csvFile = path.join(dataDir, `concurrent-word-frequency-${timestamp}.csv`);
        const csvContent = 'word,count,percentage\n' + 
            this.getTopWords(200).map(item => `${item.word},${item.count},${item.percentage}`).join('\n');
        await fs.writeFile(csvFile, csvContent);
        
        console.log(`\n📊 Concurrent crawl data saved:`);
        console.log(`   JSON: ${crawlDataFile}`);
        console.log(`   CSV:  ${csvFile}`);
        
        return { jsonFile: crawlDataFile, csvFile };
    }

    /**
     * Print summary statistics
     */
    printSummary() {
        const metrics = this.calculateMetrics();
        const topWords = this.getTopWords(10);
        
        console.log('\n' + '='.repeat(60));
        console.log('🚀 CONCURRENT CRAWL SUMMARY');
        console.log('='.repeat(60));
        console.log(`Pages crawled: ${this.totalPages}`);
        console.log(`Total words: ${this.totalWords.toLocaleString()}`);
        console.log(`Unique words: ${this.wordFrequency.size.toLocaleString()}`);
        console.log(`Success rate: ${metrics.successRate.toFixed(1)}%`);
        console.log(`Average response time: ${metrics.averageResponseTime.toFixed(0)}ms`);
        console.log(`Pages per minute: ${metrics.pagesPerMinute}`);
        console.log(`Concurrency efficiency: ${metrics.efficiency}%`);
        console.log(`Total execution time: ${(metrics.totalExecutionTime / 1000).toFixed(1)}s`);
        
        console.log('\n🔤 TOP 10 WORDS:');
        topWords.forEach((item, index) => {
            console.log(`${(index + 1).toString().padStart(2)}. ${item.word.padEnd(15)} ${item.count.toString().padStart(6)} (${item.percentage}%)`);
        });
        
        if (this.errors.length > 0) {
            console.log(`\n⚠️  ${this.errors.length} errors occurred during crawling`);
        }
    }
}

module.exports = ConcurrentWebCrawler;