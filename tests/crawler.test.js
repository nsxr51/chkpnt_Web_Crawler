const WebCrawler = require('../src/WebCrawler');
const DataAnalyzer = require('../src/analyzer');
const fs = require('fs-extra');
const path = require('path');

describe('WebCrawler', () => {
    let crawler;
    
    beforeEach(() => {
        crawler = new WebCrawler({
            maxDepth: 1,
            delay: 100
        });
    });

    test('should initialize with correct default values', () => {
        expect(crawler.maxDepth).toBe(1);
        expect(crawler.delay).toBe(100);
        expect(crawler.visitedUrls.size).toBe(0);
        expect(crawler.totalPages).toBe(0);
    });

    test('should extract text from HTML', () => {
        const $ = require('cheerio').load('<html><body><p>Test content</p></body></html>');
        const text = crawler.extractText($);
        expect(text).toContain('Test content');
    });

    test('should count words correctly', () => {
        const text = 'This is a test. This test is simple.';
        const wordCount = crawler.countWords(text);
        expect(wordCount['test']).toBe(2);
        expect(wordCount['this']).toBe(2);
        expect(wordCount['simple']).toBe(1);
    });

    test('should filter out short words', () => {
        const text = 'I am a big dog';
        const wordCount = crawler.countWords(text);
        expect(wordCount['i']).toBeUndefined();
        expect(wordCount['am']).toBeUndefined();
        expect(wordCount['big']).toBe(1);
        expect(wordCount['dog']).toBe(1);
    });

    test('should extract and normalize links', () => {
        const $ = require('cheerio').load(`
            <html>
                <body>
                    <a href="/page1">Page 1</a>
                    <a href="https://example.com/page2">Page 2</a>
                    <a href="https://other.com/page3">Page 3</a>
                </body>
            </html>
        `);
        
        const links = crawler.extractLinks($, 'https://example.com');
        expect(links).toContain('https://example.com/page1');
        expect(links).toContain('https://example.com/page2');
        expect(links).not.toContain('https://other.com/page3'); // Different domain
    });

    test('should update global word frequency', () => {
        const wordCount1 = { 'test': 2, 'word': 1 };
        const wordCount2 = { 'test': 1, 'another': 3 };
        
        crawler.updateGlobalWordFrequency(wordCount1);
        crawler.updateGlobalWordFrequency(wordCount2);
        
        expect(crawler.wordFrequency.get('test')).toBe(3);
        expect(crawler.wordFrequency.get('word')).toBe(1);
        expect(crawler.wordFrequency.get('another')).toBe(3);
    });

    test('should get top words correctly', () => {
        crawler.wordFrequency.set('most', 100);
        crawler.wordFrequency.set('common', 50);
        crawler.wordFrequency.set('word', 25);
        crawler.totalWords = 175;
        
        const topWords = crawler.getTopWords(2);
        expect(topWords).toHaveLength(2);
        expect(topWords[0].word).toBe('most');
        expect(topWords[0].count).toBe(100);
        expect(topWords[1].word).toBe('common');
        expect(topWords[1].count).toBe(50);
    });

    test('should calculate metrics correctly', () => {
        crawler.metrics.responseTimes = [1000, 1500, 2000];
        crawler.metrics.requestCount = 5;
        crawler.metrics.successfulRequests = 4;
        crawler.metrics.wordsPerPage = [100, 200, 300];
        
        const metrics = crawler.calculateMetrics();
        expect(metrics.averageResponseTime).toBe(1500);
        expect(metrics.successRate).toBe(80);
        expect(metrics.averageWordsPerPage).toBe(200);
    });
});

describe('DataAnalyzer', () => {
    let analyzer;
    
    beforeEach(() => {
        analyzer = new DataAnalyzer();
    });

    test('should calculate average correctly', () => {
        const numbers = [10, 20, 30, 40, 50];
        const average = analyzer.calculateAverage(numbers);
        expect(average).toBe(30);
    });

    test('should calculate median correctly', () => {
        const oddNumbers = [1, 3, 5, 7, 9];
        const evenNumbers = [2, 4, 6, 8];
        
        expect(analyzer.calculateMedian(oddNumbers)).toBe(5);
        expect(analyzer.calculateMedian(evenNumbers)).toBe(5);
    });

    test('should calculate standard deviation correctly', () => {
        const numbers = [2, 4, 4, 4, 5, 5, 7, 9];
        const average = analyzer.calculateAverage(numbers);
        const stdDev = analyzer.calculateStandardDeviation(numbers, average);
        expect(Math.round(stdDev * 100) / 100).toBe(2);
    });

    test('should identify themes correctly', () => {
        const topWords = [
            { word: 'business', count: 50 },
            { word: 'technology', count: 40 },
            { word: 'customer', count: 30 },
            { word: 'software', count: 20 }
        ];
        
        const themes = analyzer.identifyThemes(topWords);
        expect(themes).toContain('Business/Commerce');
        expect(themes).toContain('Technology');
    });
});

// Integration test
describe('Integration Tests', () => {
    test('should handle complete crawl workflow', async () => {
        // This would require a mock server or test website
        // For now, we'll test the data processing pipeline
        
        const mockCrawlData = {
            metadata: {
                startTime: new Date().toISOString(),
                totalPages: 5,
                totalWords: 1000,
                metrics: {
                    requestCount: 5,
                    successfulRequests: 5,
                    averageResponseTime: 1200,
                    successRate: 100
                }
            },
            pages: [
                {
                    url: 'https://example.com',
                    totalWords: 200,
                    linkCount: 5,
                    responseTime: 1000
                },
                {
                    url: 'https://example.com/about',
                    totalWords: 150,
                    linkCount: 3,
                    responseTime: 800
                }
            ],
            topWords: [
                { word: 'example', count: 50, percentage: '5.0' },
                { word: 'content', count: 30, percentage: '3.0' }
            ],
            errors: []
        };
        
        const analyzer = new DataAnalyzer();
        const wordAnalysis = analyzer.analyzeWordFrequency(mockCrawlData);
        const performanceAnalysis = analyzer.analyzePerformance(mockCrawlData);
        
        expect(wordAnalysis.topWords).toBeDefined();
        expect(performanceAnalysis.overview.totalPages).toBe(5);
        expect(performanceAnalysis.overview.successRate).toBe('100.0%');
    }, 10000);
});