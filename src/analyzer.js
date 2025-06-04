const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

class DataAnalyzer {
    constructor() {
        this.dataDir = path.join(__dirname, '..', 'data');
        this.reportsDir = path.join(__dirname, '..', 'reports');
    }

    /**
     * Get the latest crawl data file
     */
    async getLatestCrawlData() {
        const files = await fs.readdir(this.dataDir);
        const crawlFiles = files.filter(file => 
            (file.startsWith('crawl-data-') || file.startsWith('concurrent-crawl-data-')) && 
            file.endsWith('.json')
        );
        
        if (crawlFiles.length === 0) {
            throw new Error('No crawl data found. Please run the crawler first.');
        }
        
        // Sort by filename (which includes timestamp) and get the latest
        crawlFiles.sort().reverse();
        const latestFile = path.join(this.dataDir, crawlFiles[0]);
        
        console.log(`📄 Analyzing: ${crawlFiles[0]}`);
        
        return await fs.readJSON(latestFile);
    }

    /**
     * Analyze word frequency patterns
     */
    analyzeWordFrequency(crawlData) {
        const { topWords, metadata } = crawlData;
        
        // Categorize words by frequency ranges
        const frequencyRanges = {
            'Very High (>100)': topWords.filter(w => w.count > 100).length,
            'High (50-100)': topWords.filter(w => w.count >= 50 && w.count <= 100).length,
            'Medium (10-49)': topWords.filter(w => w.count >= 10 && w.count < 50).length,
            'Low (5-9)': topWords.filter(w => w.count >= 5 && w.count < 10).length,
            'Very Low (1-4)': topWords.filter(w => w.count >= 1 && w.count < 5).length
        };
        
        // Calculate distribution metrics
        const wordCounts = topWords.map(w => w.count);
        const average = wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length;
        const median = this.calculateMedian(wordCounts);
        const standardDeviation = this.calculateStandardDeviation(wordCounts, average);
        
        return {
            frequencyRanges,
            statistics: {
                totalUniqueWords: metadata.totalWords,
                averageFrequency: Math.round(average),
                medianFrequency: median,
                standardDeviation: Math.round(standardDeviation),
                vocabularyRichness: (metadata.totalWords / topWords.length).toFixed(2)
            },
            topWords: topWords.slice(0, 20)
        };
    }

    /**
     * Analyze crawling performance
     */
    analyzePerformance(crawlData) {
        const { metadata, pages, errors } = crawlData;
        const { metrics } = metadata;
        
        // Page-level analysis
        const pageSizes = pages.map(p => p.totalWords);
        const responseTimes = pages.map(p => p.responseTime);
        const linkCounts = pages.map(p => p.linkCount);
        
        // Identify performance issues
        const issues = [];
        if (metrics.averageResponseTime > 3000) {
            issues.push('High average response time (>3s)');
        }
        if (errors.length > 0) {
            issues.push(`${errors.length} failed requests`);
        }
        if (metrics.successRate < 90) {
            issues.push('Low success rate (<90%)');
        }
        
        return {
            overview: {
                totalPages: metadata.totalPages,
                successRate: `${metrics.successRate.toFixed(1)}%`,
                averageResponseTime: `${metrics.averageResponseTime.toFixed(0)}ms`,
                totalExecutionTime: `${(metrics.totalExecutionTime / 1000).toFixed(1)}s`,
                errorsCount: errors.length
            },
            pageAnalysis: {
                averageWordsPerPage: Math.round(this.calculateAverage(pageSizes)),
                averageLinksPerPage: Math.round(this.calculateAverage(linkCounts)),
                largestPage: Math.max(...pageSizes),
                smallestPage: Math.min(...pageSizes)
            },
            issues,
            recommendations: this.generatePerformanceRecommendations(metrics, issues)
        };
    }

    /**
     * Identify content patterns and insights
     */
    analyzeContentPatterns(crawlData) {
        const { pages, topWords } = crawlData;
        
        // Analyze content diversity
        const titleWords = new Set();
        const contentTypes = {};
        
        pages.forEach(page => {
            // Extract title words
            const words = page.title.toLowerCase().split(/\s+/);
            words.forEach(word => titleWords.add(word));
            
            // Categorize pages by content size
            const wordCount = page.totalWords;
            let category;
            if (wordCount > 1000) category = 'Long Content';
            else if (wordCount > 500) category = 'Medium Content';
            else if (wordCount > 100) category = 'Short Content';
            else category = 'Very Short Content';
            
            contentTypes[category] = (contentTypes[category] || 0) + 1;
        });
        
        // Find common themes
        const commonThemes = this.identifyThemes(topWords);
        
        return {
            contentDistribution: contentTypes,
            titleDiversity: titleWords.size,
            commonThemes,
            insights: this.generateContentInsights(pages, topWords)
        };
    }

    /**
     * Generate improvement recommendations
     */
    generateRecommendations(crawlData) {
        const wordAnalysis = this.analyzeWordFrequency(crawlData);
        const performanceAnalysis = this.analyzePerformance(crawlData);
        const contentAnalysis = this.analyzeContentPatterns(crawlData);
        
        const recommendations = [];
        
        // Performance recommendations
        if (performanceAnalysis.issues.length > 0) {
            recommendations.push({
                category: 'Performance',
                priority: 'High',
                issue: 'Crawling performance issues detected',
                recommendations: performanceAnalysis.recommendations
            });
        }
        
        // Content quality recommendations
        if (wordAnalysis.statistics.vocabularyRichness < 2) {
            recommendations.push({
                category: 'Content Quality',
                priority: 'Medium',
                issue: 'Low vocabulary richness detected',
                recommendations: [
                    'Crawl more diverse content sources',
                    'Implement better text extraction for rich content',
                    'Consider excluding common stop words from analysis'
                ]
            });
        }
        
        // Scalability recommendations
        recommendations.push({
            category: 'Scalability',
            priority: 'Medium',
            issue: 'Prepare for larger scale crawling',
            recommendations: [
                'Implement database storage for large datasets',
                'Add distributed crawling capabilities',
                'Implement caching mechanisms',
                'Add rate limiting and throttling controls'
            ]
        });
        
        return recommendations;
    }

    /**
     * Generate comprehensive analysis report
     */
    async generateReport() {
        console.log('📊 Generating analysis report...');
        
        try {
            const crawlData = await this.getLatestCrawlData();
            
            const analysis = {
                metadata: {
                    reportDate: new Date().toISOString(),
                    crawlDate: crawlData.metadata.startTime,
                    dataSource: 'Latest crawl data'
                },
                wordFrequencyAnalysis: this.analyzeWordFrequency(crawlData),
                performanceAnalysis: this.analyzePerformance(crawlData),
                contentPatternAnalysis: this.analyzeContentPatterns(crawlData),
                recommendations: this.generateRecommendations(crawlData),
                rawData: {
                    totalPages: crawlData.metadata.totalPages,
                    totalWords: crawlData.metadata.totalWords,
                    crawlMetrics: crawlData.metadata.metrics
                }
            };
            
            // Save analysis report
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            const reportFile = path.join(this.reportsDir, `analysis-report-${timestamp}.json`);
            
            await fs.ensureDir(this.reportsDir);
            await fs.writeJSON(reportFile, analysis, { spaces: 2 });
            
            // Generate human-readable report
            const readableReportFile = path.join(this.reportsDir, `analysis-report-${timestamp}.md`);
            const readableReport = this.generateMarkdownReport(analysis);
            await fs.writeFile(readableReportFile, readableReport);
            
            // Convert Markdown to HTML for better browser viewing
            const htmlReportFile = path.join(this.reportsDir, `analysis-report-${timestamp}.html`);
            await this.convertMarkdownToHtml(readableReport, htmlReportFile, analysis);
            
            console.log(`\n📈 Analysis Report Generated:`);
            console.log(`   JSON: ${reportFile}`);
            console.log(`   Markdown: ${readableReportFile}`);
            console.log(`   HTML: ${htmlReportFile}`);
            
            // Print summary to console
            this.printAnalysisSummary(analysis);
            
            // Open HTML report in browser
            console.log('\n🌐 Opening report in browser...');
            await this.openInBrowser(htmlReportFile);
            
            return analysis;
            
        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            throw error;
        }
    }

    /**
     * Open file in default browser or application
     */
    async openInBrowser(filePath) {
        return new Promise((resolve, reject) => {
            let command;
            
            // Determine the command based on the operating system
            switch (os.platform()) {
                case 'darwin': // macOS
                    command = `open "${filePath}"`;
                    break;
                case 'win32': // Windows
                    command = `start "" "${filePath}"`;
                    break;
                default: // Linux and others
                    command = `xdg-open "${filePath}"`;
                    break;
            }
            
            exec(command, (error) => {
                if (error) {
                    console.log(`ℹ️  Could not auto-open file: ${error.message}`);
                    console.log(`📄 Please manually open: ${filePath}`);
                    resolve(false);
                } else {
                    console.log(`🌐 Opened in browser: ${path.basename(filePath)}`);
                    resolve(true);
                }
            });
        });
    }

    /**
     * Convert Markdown to HTML for better browser viewing
     */
    async convertMarkdownToHtml(markdownContent, outputPath, analysisData) {
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web Crawler Analysis Report</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        h2 {
            color: #34495e;
            margin-top: 30px;
            border-left: 4px solid #3498db;
            padding-left: 15px;
        }
        h3 {
            color: #2c3e50;
            margin-top: 25px;
        }
        code {
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Consolas', monospace;
        }
        pre {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            border-left: 4px solid #3498db;
        }
        ul, ol {
            padding-left: 20px;
        }
        li {
            margin-bottom: 5px;
        }
        strong {
            color: #2c3e50;
        }
        .metric {
            background: #e8f4fd;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            border-left: 4px solid #3498db;
        }
        .warning {
            background: #fff3cd;
            padding: 10px;
            border-radius: 5px;
            border-left: 4px solid #ffc107;
        }
        .success {
            background: #d4edda;
            padding: 10px;
            border-radius: 5px;
            border-left: 4px solid #28a745;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        .chart-container {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .chart-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 30px 0;
        }
        .chart-full {
            grid-column: 1 / -1;
        }
        @media (max-width: 768px) {
            .chart-grid {
                grid-template-columns: 1fr;
            }
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 0.9em;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        ${this.markdownToHtml(markdownContent)}
        
        <!-- Data Visualizations -->
        <h2>📊 Data Visualizations</h2>
        
        <!-- Key Statistics Cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${analysisData.rawData.totalPages.toLocaleString()}</div>
                <div class="stat-label">Pages Crawled</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${analysisData.rawData.totalWords.toLocaleString()}</div>
                <div class="stat-label">Total Words</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${analysisData.wordFrequencyAnalysis.statistics.totalUniqueWords.toLocaleString()}</div>
                <div class="stat-label">Unique Words</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${analysisData.performanceAnalysis.overview.successRate}</div>
                <div class="stat-label">Success Rate</div>
            </div>
        </div>
        
        <!-- Charts Grid -->
        <div class="chart-grid">
            <div class="chart-container">
                <h3>🔤 Top 20 Words</h3>
                <canvas id="topWordsChart" width="400" height="300"></canvas>
            </div>
            
            <div class="chart-container">
                <h3>📈 Word Frequency Distribution</h3>
                <canvas id="frequencyDistChart" width="400" height="300"></canvas>
            </div>
            
            <div class="chart-container chart-full">
                <h3>📊 Top 50 Words - Detailed View</h3>
                <canvas id="detailedWordsChart" width="800" height="400"></canvas>
            </div>
            
            <div class="chart-container">
                <h3>⚡ Performance Metrics</h3>
                <canvas id="performanceChart" width="400" height="300"></canvas>
            </div>
            
            <div class="chart-container">
                <h3>📄 Content Analysis</h3>
                <canvas id="contentChart" width="400" height="300"></canvas>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated by Web Crawler Analysis Tool • ${new Date().toLocaleString()}</p>
        </div>
    </div>
    
    <script>
        // Chart.js configuration
        Chart.defaults.font.family = "'Segoe UI', Roboto, sans-serif";
        Chart.defaults.color = '#2c3e50';
        
        // Data preparation
        const analysisData = ${JSON.stringify(analysisData)};
        const topWords = analysisData.wordFrequencyAnalysis.topWords;
        const top20Words = topWords.slice(0, 20);
        const top50Words = topWords.slice(0, 50);
        const frequencyRanges = analysisData.wordFrequencyAnalysis.frequencyRanges;
        const contentDistribution = analysisData.contentPatternAnalysis.contentDistribution;
        
        // Color schemes
        const colors = {
            primary: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'],
            gradient: [
                'rgba(52, 152, 219, 0.8)',
                'rgba(231, 76, 60, 0.8)',
                'rgba(46, 204, 113, 0.8)',
                'rgba(243, 156, 18, 0.8)',
                'rgba(155, 89, 182, 0.8)',
                'rgba(26, 188, 156, 0.8)',
                'rgba(52, 73, 94, 0.8)',
                'rgba(230, 126, 34, 0.8)'
            ]
        };
        
        // 1. Top 20 Words Bar Chart
        new Chart(document.getElementById('topWordsChart'), {
            type: 'bar',
            data: {
                labels: top20Words.map(item => item.word),
                datasets: [{
                    label: 'Frequency',
                    data: top20Words.map(item => item.count),
                    backgroundColor: colors.gradient[0],
                    borderColor: colors.primary[0],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const word = top20Words[context.dataIndex];
                                return \`\${word.word}: \${word.count} times (\${word.percentage}%)\`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Frequency'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Words'
                        }
                    }
                }
            }
        });
        
        // 2. Frequency Distribution Pie Chart
        new Chart(document.getElementById('frequencyDistChart'), {
            type: 'doughnut',
            data: {
                labels: Object.keys(frequencyRanges),
                datasets: [{
                    data: Object.values(frequencyRanges),
                    backgroundColor: colors.gradient,
                    borderColor: colors.primary,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = Object.values(frequencyRanges).reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return \`\${context.label}: \${context.parsed} words (\${percentage}%)\`;
                            }
                        }
                    }
                }
            }
        });
        
        // 3. Detailed Top 50 Words Horizontal Bar Chart
        new Chart(document.getElementById('detailedWordsChart'), {
            type: 'bar',
            data: {
                labels: top50Words.map(item => item.word),
                datasets: [{
                    label: 'Word Frequency',
                    data: top50Words.map(item => item.count),
                    backgroundColor: colors.gradient[1],
                    borderColor: colors.primary[1],
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const word = top50Words[context.dataIndex];
                                return \`\${word.word}: \${word.count} occurrences (\${word.percentage}%)\`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Frequency'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Words'
                        }
                    }
                }
            }
        });
        
        // 4. Performance Metrics Radar Chart
        const performanceData = {
            'Success Rate': parseFloat(analysisData.performanceAnalysis.overview.successRate),
            'Avg Response Time': Math.max(0, 100 - (parseFloat(analysisData.performanceAnalysis.overview.averageResponseTime.replace('ms', '')) / 50)), // Inverted scale
            'Pages Crawled': Math.min(100, analysisData.rawData.totalPages * 10),
            'Content Quality': analysisData.wordFrequencyAnalysis.statistics.vocabularyRichness * 30,
            'Error Rate': Math.max(0, 100 - (analysisData.performanceAnalysis.overview.errorsCount * 20))
        };
        
        new Chart(document.getElementById('performanceChart'), {
            type: 'radar',
            data: {
                labels: Object.keys(performanceData),
                datasets: [{
                    label: 'Performance Score',
                    data: Object.values(performanceData),
                    backgroundColor: 'rgba(46, 204, 113, 0.2)',
                    borderColor: colors.primary[2],
                    borderWidth: 2,
                    pointBackgroundColor: colors.primary[2],
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        
        // 5. Content Distribution Chart
        if (Object.keys(contentDistribution).length > 0) {
            new Chart(document.getElementById('contentChart'), {
                type: 'pie',
                data: {
                    labels: Object.keys(contentDistribution),
                    datasets: [{
                        data: Object.values(contentDistribution),
                        backgroundColor: colors.gradient.slice(0, Object.keys(contentDistribution).length),
                        borderColor: colors.primary.slice(0, Object.keys(contentDistribution).length),
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = Object.values(contentDistribution).reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return \`\${context.label}: \${context.parsed} pages (\${percentage}%)\`;
                                }
                            }
                        }
                    }
                }
            });
        } else {
            document.getElementById('contentChart').parentElement.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No content distribution data available</p>';
        }
    </script>
</body>
</html>`;
        
        await fs.writeFile(outputPath, htmlContent);
        return outputPath;
    }

    /**
     * Simple Markdown to HTML converter
     */
    markdownToHtml(markdown) {
        return markdown
            // Headers
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Bold and emphasis
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code blocks
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            // Inline code
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Lists
            .replace(/^\- (.*$)/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.*)$/gm, '<p>$1</p>')
            // Clean up
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<h[1-6]>.*<\/h[1-6]>)<\/p>/g, '$1')
            .replace(/<p>(<ul>.*<\/ul>)<\/p>/g, '$1')
            .replace(/<p>(<pre>.*<\/pre>)<\/p>/g, '$1');
    }
    calculateAverage(numbers) {
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }

    calculateMedian(numbers) {
        const sorted = numbers.slice().sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 
            ? (sorted[middle - 1] + sorted[middle]) / 2 
            : sorted[middle];
    }

    calculateStandardDeviation(numbers, average) {
        const squaredDiffs = numbers.map(num => Math.pow(num - average, 2));
        const avgSquaredDiff = this.calculateAverage(squaredDiffs);
        return Math.sqrt(avgSquaredDiff);
    }

    identifyThemes(topWords) {
        // Simple theme identification based on common word patterns
        const themes = [];
        const businessWords = topWords.filter(w => ['business', 'company', 'service', 'product', 'customer', 'market'].includes(w.word));
        const techWords = topWords.filter(w => ['technology', 'software', 'data', 'system', 'digital', 'tech'].includes(w.word));
        const newsWords = topWords.filter(w => ['news', 'report', 'article', 'story', 'update', 'information'].includes(w.word));
        
        if (businessWords.length > 0) themes.push('Business/Commerce');
        if (techWords.length > 0) themes.push('Technology');
        if (newsWords.length > 0) themes.push('News/Information');
        
        return themes.length > 0 ? themes : ['General Content'];
    }

    generateContentInsights(pages, topWords) {
        const insights = [];
        
        // Content length analysis
        const avgWordsPerPage = pages.reduce((sum, page) => sum + page.totalWords, 0) / pages.length;
        if (avgWordsPerPage > 800) {
            insights.push('Pages contain substantial content (high word count)');
        } else if (avgWordsPerPage < 200) {
            insights.push('Pages have relatively short content');
        }
        
        // Link density analysis
        const avgLinksPerPage = pages.reduce((sum, page) => sum + page.linkCount, 0) / pages.length;
        if (avgLinksPerPage > 20) {
            insights.push('High link density - good for navigation');
        } else if (avgLinksPerPage < 5) {
            insights.push('Low link density - limited internal linking');
        }
        
        return insights;
    }

    generatePerformanceRecommendations(metrics, issues) {
        const recommendations = [];
        
        if (metrics.averageResponseTime > 3000) {
            recommendations.push('Implement connection pooling and optimize request handling');
            recommendations.push('Add caching mechanisms for improved performance');
        }
        
        if (metrics.successRate < 95) {
            recommendations.push('Implement retry logic for failed requests');
            recommendations.push('Add better error handling and recovery mechanisms');
        }
        
        if (issues.length === 0) {
            recommendations.push('Performance is good - consider scaling up crawling operations');
        }
        
        return recommendations;
    }

    generateMarkdownReport(analysis) {
        const { wordFrequencyAnalysis, performanceAnalysis, contentPatternAnalysis, recommendations } = analysis;
        
        return `# Web Crawler Analysis Report

**Generated:** ${analysis.metadata.reportDate}  
**Crawl Date:** ${analysis.metadata.crawlDate}

## Executive Summary

This report analyzes the web crawling operation that processed **${performanceAnalysis.overview.totalPages} pages** and collected **${analysis.rawData.totalWords.toLocaleString()} words** with a **${performanceAnalysis.overview.successRate}** success rate.

## Word Frequency Analysis

### Key Statistics
- **Total Unique Words:** ${wordFrequencyAnalysis.statistics.totalUniqueWords.toLocaleString()}
- **Average Word Frequency:** ${wordFrequencyAnalysis.statistics.averageFrequency}
- **Vocabulary Richness:** ${wordFrequencyAnalysis.statistics.vocabularyRichness}

### Top 10 Most Frequent Words
${wordFrequencyAnalysis.topWords.slice(0, 10).map((word, i) => 
    `${i + 1}. **${word.word}** - ${word.count} occurrences (${word.percentage}%)`
).join('\n')}

### Frequency Distribution
${Object.entries(wordFrequencyAnalysis.frequencyRanges).map(([range, count]) => 
    `- ${range}: ${count} words`
).join('\n')}

## Performance Analysis

### Overview
- **Pages Crawled:** ${performanceAnalysis.overview.totalPages}
- **Success Rate:** ${performanceAnalysis.overview.successRate}
- **Average Response Time:** ${performanceAnalysis.overview.averageResponseTime}
- **Total Execution Time:** ${performanceAnalysis.overview.totalExecutionTime}

### Page Content Analysis
- **Average Words per Page:** ${performanceAnalysis.pageAnalysis.averageWordsPerPage}
- **Average Links per Page:** ${performanceAnalysis.pageAnalysis.averageLinksPerPage}
- **Largest Page:** ${performanceAnalysis.pageAnalysis.largestPage} words
- **Smallest Page:** ${performanceAnalysis.pageAnalysis.smallestPage} words

${performanceAnalysis.issues.length > 0 ? `### Issues Identified
${performanceAnalysis.issues.map(issue => `- ⚠️ ${issue}`).join('\n')}` : ''}

## Content Pattern Analysis

### Content Distribution
${Object.entries(contentPatternAnalysis.contentDistribution).map(([type, count]) => 
    `- ${type}: ${count} pages`
).join('\n')}

### Common Themes
${contentPatternAnalysis.commonThemes.map(theme => `- ${theme}`).join('\n')}

## Recommendations

${recommendations.map(rec => `### ${rec.category} (${rec.priority} Priority)
**Issue:** ${rec.issue}

**Recommendations:**
${rec.recommendations.map(r => `- ${r}`).join('\n')}
`).join('\n')}

## Proposed KPIs and Business Metrics

### Crawling Efficiency KPIs
1. **Pages per Minute:** Target >10 pages/min
2. **Success Rate:** Target >95%
3. **Average Response Time:** Target <2 seconds
4. **Error Rate:** Target <5%

### Content Quality KPIs
1. **Words per Page:** Target >200 words
2. **Vocabulary Richness:** Target >2.0
3. **Content Diversity Score:** Monitor theme distribution
4. **Unique Word Ratio:** Target >30%

### System Performance KPIs
1. **Memory Usage:** Monitor and optimize
2. **CPU Utilization:** Keep under 80%
3. **Concurrent Connections:** Optimize for throughput
4. **Data Storage Growth:** Plan for scalability

---
*Report generated by Web Crawler Analysis Tool v1.0*`;
    }

    printAnalysisSummary(analysis) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 ANALYSIS SUMMARY');
        console.log('='.repeat(60));
        
        const { wordFrequencyAnalysis, performanceAnalysis, contentPatternAnalysis } = analysis;
        
        console.log('\n🔤 WORD FREQUENCY INSIGHTS:');
        console.log(`   Unique words: ${wordFrequencyAnalysis.statistics.totalUniqueWords.toLocaleString()}`);
        console.log(`   Vocabulary richness: ${wordFrequencyAnalysis.statistics.vocabularyRichness}`);
        console.log(`   Most common word: "${wordFrequencyAnalysis.topWords[0].word}" (${wordFrequencyAnalysis.topWords[0].count} times)`);
        
        console.log('\n⚡ PERFORMANCE INSIGHTS:');
        console.log(`   Success rate: ${performanceAnalysis.overview.successRate}`);
        console.log(`   Avg response time: ${performanceAnalysis.overview.averageResponseTime}`);
        console.log(`   Pages processed: ${performanceAnalysis.overview.totalPages}`);
        
        console.log('\n📄 CONTENT INSIGHTS:');
        console.log(`   Themes detected: ${contentPatternAnalysis.commonThemes.join(', ')}`);
        console.log(`   Content diversity: ${contentPatternAnalysis.titleDiversity} unique title words`);
        
        if (performanceAnalysis.issues.length > 0) {
            console.log('\n⚠️  ISSUES DETECTED:');
            performanceAnalysis.issues.forEach(issue => console.log(`   - ${issue}`));
        }
        
        console.log('\n💡 RECOMMENDATIONS:');
        analysis.recommendations.forEach(rec => {
            console.log(`   ${rec.category} (${rec.priority}): ${rec.issue}`);
        });
    }
}

// Main execution
async function main() {
    const analyzer = new DataAnalyzer();
    
    try {
        await analyzer.generateReport();
    } catch (error) {
        console.error('Analysis failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = DataAnalyzer;