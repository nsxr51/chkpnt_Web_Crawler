const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');
const robotsParser = require('robots-parser');

class WebCrawler {
    constructor(options = {}) {
        this.maxDepth = options.maxDepth || 2;
        this.delay = options.delay || 1000; // Delay between requests in ms
        this.visitedUrls = new Set();
        this.crawlData = [];
        this.wordFrequency = new Map();
        this.totalWords = 0;
        this.totalPages = 0;
        this.errors = [];
        this.startTime = Date.now();
        
        // Performance metrics
        this.metrics = {
            requestCount: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            responseTimes: [],
            wordsPerPage: [],
            linksPerPage: []
        };
        
        // User agent for respectful crawling
        this.userAgent = 'WebCrawler/1.0 (+educational-purpose)';
    }

    /**
     * Main crawling function
     */
    async crawl(startUrl, currentDepth = 0) {
        if (currentDepth > this.maxDepth || this.visitedUrls.has(startUrl)) {
            return;
        }

        console.log(`Crawling: ${startUrl} (depth: ${currentDepth})`);
        this.visitedUrls.add(startUrl);

        try {
            // Check robots.txt compliance
            const isAllowed = await this.checkRobotsTxt(startUrl);
            if (!isAllowed) {
                console.log(`Robots.txt disallows crawling: ${startUrl}`);
                return;
            }

            const startRequestTime = Date.now();
            
            // Fetch page content
            const response = await axios.get(startUrl, {
                headers: {
                    'User-Agent': this.userAgent
                },
                timeout: 10000
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
            
            // Extract links
            const links = this.extractLinks($, startUrl);
            
            // Store page data
            const pageData = {
                url: startUrl,
                depth: currentDepth,
                title: $('title').text().trim(),
                wordCount: Object.keys(wordCount).length,
                totalWords: Object.values(wordCount).reduce((sum, count) => sum + count, 0),
                linkCount: links.length,
                timestamp: new Date().toISOString(),
                responseTime: responseTime,
                textLength: textContent.length,
                words: wordCount,
                links: links
            };

            this.crawlData.push(pageData);
            this.totalPages++;
            this.metrics.wordsPerPage.push(pageData.totalWords);
            this.metrics.linksPerPage.push(pageData.linkCount);

            // Update global word frequency
            this.updateGlobalWordFrequency(wordCount);

            console.log(`✓ Processed: ${startUrl} - ${pageData.totalWords} words, ${links.length} links`);

            // Crawl found links (respecting depth limit)
            if (currentDepth < this.maxDepth) {
                for (const link of links.slice(0, 5)) { // Limit to 5 links per page
                    await this.sleep(this.delay); // Be respectful with delays
                    await this.crawl(link, currentDepth + 1);
                }
            }

        } catch (error) {
            this.metrics.requestCount++;
            this.metrics.failedRequests++;
            this.errors.push({
                url: startUrl,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            console.error(`✗ Failed to crawl ${startUrl}: ${error.message}`);
        }
    }

    /**
     * Extract meaningful text from HTML
     */
    extractText($) {
        // Remove script and style elements
        $('script, style, nav, header, footer, aside').remove();
        
        // Extract text from main content areas
        const textElements = $('p, h1, h2, h3, h4, h5, h6, article, main, section');
        let text = '';
        
        textElements.each((i, element) => {
            text += $(element).text() + ' ';
        });
        
        // Fallback to body text if no content found
        if (text.trim().length === 0) {
            text = $('body').text();
        }
        
        return text.trim();
    }

    /**
     * Count word frequency in text
     */
    countWords(text) {
        const words = text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .split(/\s+/)
            .filter(word => word.length > 2); // Filter out short words
        
        const wordCount = {};
        words.forEach(word => {
            wordCount[word] = (wordCount[word] || 0) + 1;
        });
        
        return wordCount;
    }

    /**
     * Extract and normalize links from page
     */
    extractLinks($, baseUrl) {
        const links = [];
        const baseUrlObj = new URL(baseUrl);
        
        $('a[href]').each((i, element) => {
            try {
                const href = $(element).attr('href');
                const absoluteUrl = new URL(href, baseUrl).toString();
                
                // Only crawl same domain links
                const linkUrl = new URL(absoluteUrl);
                if (linkUrl.hostname === baseUrlObj.hostname && 
                    !this.visitedUrls.has(absoluteUrl) &&
                    !absoluteUrl.includes('#') && // Skip anchor links
                    !absoluteUrl.match(/\.(pdf|jpg|png|gif|css|js)$/i)) { // Skip files
                    links.push(absoluteUrl);
                }
            } catch (error) {
                // Skip invalid URLs
            }
        });
        
        return [...new Set(links)]; // Remove duplicates
    }

    /**
     * Update global word frequency map
     */
    updateGlobalWordFrequency(wordCount) {
        Object.entries(wordCount).forEach(([word, count]) => {
            this.wordFrequency.set(word, (this.wordFrequency.get(word) || 0) + count);
            this.totalWords += count;
        });
    }

    /**
     * Check robots.txt compliance
     */
    async checkRobotsTxt(url) {
        try {
            const urlObj = new URL(url);
            const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
            
            const response = await axios.get(robotsUrl, { timeout: 5000 });
            const robots = robotsParser(robotsUrl, response.data);
            
            return robots.isAllowed(url, this.userAgent);
        } catch (error) {
            // If robots.txt doesn't exist or can't be fetched, assume allowed
            return true;
        }
    }

    /**
     * Sleep utility for delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Calculate performance metrics
     */
    calculateMetrics() {
        this.metrics.averageResponseTime = this.metrics.responseTimes.length > 0 
            ? this.metrics.responseTimes.reduce((sum, time) => sum + time, 0) / this.metrics.responseTimes.length 
            : 0;
        
        return {
            ...this.metrics,
            totalExecutionTime: Date.now() - this.startTime,
            successRate: this.metrics.requestCount > 0 ? (this.metrics.successfulRequests / this.metrics.requestCount) * 100 : 0,
            averageWordsPerPage: this.metrics.wordsPerPage.length > 0 
                ? this.metrics.wordsPerPage.reduce((sum, count) => sum + count, 0) / this.metrics.wordsPerPage.length 
                : 0,
            averageLinksPerPage: this.metrics.linksPerPage.length > 0 
                ? this.metrics.linksPerPage.reduce((sum, count) => sum + count, 0) / this.metrics.linksPerPage.length 
                : 0
        };
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
        
        // Save detailed crawl data
        const crawlDataFile = path.join(dataDir, `crawl-data-${timestamp}.json`);
        await fs.writeJSON(crawlDataFile, {
            metadata: {
                startTime: new Date(this.startTime).toISOString(),
                endTime: new Date().toISOString(),
                totalPages: this.totalPages,
                totalWords: this.totalWords,
                maxDepth: this.maxDepth,
                metrics: this.calculateMetrics()
            },
            pages: this.crawlData,
            topWords: this.getTopWords(),
            errors: this.errors
        }, { spaces: 2 });
        
        // Save word frequency as CSV
        const csvFile = path.join(dataDir, `word-frequency-${timestamp}.csv`);
        const csvContent = 'word,count,percentage\n' + 
            this.getTopWords(200).map(item => `${item.word},${item.count},${item.percentage}`).join('\n');
        await fs.writeFile(csvFile, csvContent);
        
        console.log(`\n📊 Data saved:`);
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
        console.log('📈 CRAWL SUMMARY');
        console.log('='.repeat(60));
        console.log(`Pages crawled: ${this.totalPages}`);
        console.log(`Total words: ${this.totalWords.toLocaleString()}`);
        console.log(`Unique words: ${this.wordFrequency.size.toLocaleString()}`);
        console.log(`Success rate: ${metrics.successRate.toFixed(1)}%`);
        console.log(`Average response time: ${metrics.averageResponseTime.toFixed(0)}ms`);
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

module.exports = WebCrawler;