# Web Crawler - Node.js Implementation

A comprehensive web crawler built in Node.js that retrieves content from web pages, analyzes word frequency, and provides detailed insights and performance metrics.

## 🚀 Features

- **Content Retrieval**: Fetches content from web pages with configurable depth
- **Word Frequency Analysis**: Counts and analyzes word occurrences across crawled content
- **Performance Monitoring**: Tracks response times, success rates, and system metrics
- **Data Storage**: Saves results in JSON and CSV formats
- **Respectful Crawling**: Implements delays, robots.txt compliance, and rate limiting
- **Comprehensive Analysis**: Generates detailed reports with insights and recommendations
- **Error Handling**: Robust error handling with detailed logging

## 📋 Requirements

- Node.js (v14 or higher)
- npm (v6 or higher)

## 🛠️ Installation

1. Clone or download this project
2. Navigate to the project directory:
   ```bash
   cd web-crawler
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## 🤖 MCP Server Integration

**Use the web crawler directly through Claude Desktop!**

The project includes an MCP (Model Context Protocol) server that lets you control the web crawler using natural language through Claude Desktop.

### Quick MCP Setup

```bash
# Complete MCP setup with automatic configuration
npm run mcp:full-setup

# Manual step-by-step setup
npm run mcp:install    # Install MCP dependencies
npm run mcp:setup      # Configure Claude Desktop

# Alternative: Copy config manually
cd mcp-server
npm run copy-config    # Copy configuration file to Claude Desktop

# Restart Claude Desktop
# Now you can use natural language commands!
```

### Example Claude Conversations

```
You: "Crawl https://news.ycombinator.com and show me the most common words"
Claude: [Uses web crawler and provides analysis]

You: "Search the crawled content for 'AI' mentions"
Claude: [Searches and shows results with context]

You: "Export the word frequency data as CSV"
Claude: [Provides CSV formatted data]
```

### MCP Commands Available

- **Crawl websites** with custom depth and concurrency
- **Analyze word frequency** and content patterns  
- **Search crawled content** for specific terms
- **Export data** in multiple formats (JSON, CSV, Markdown)
- **Performance analysis** and metrics

See `mcp-server/README.md` for detailed setup instructions.

---

### Basic Crawling

**Sequential Crawling (Original):**
```bash
# Basic sequential crawling
npm start https://example.com

# Use default URL
npm start
```

**🚀 Concurrent Crawling (3-5x Faster!):**
```bash
# Fast concurrent mode (5 workers)
npm run start:fast https://example.com

# Turbo mode (10 workers)
npm run start:turbo https://example.com

# Custom concurrent crawling
npm start https://example.com --concurrent
npm start https://example.com --concurrent --concurrency=8
```

### Advanced Options

```bash
# Custom depth and delay
npm start https://example.com --concurrent --depth=3 --delay=300

# Show all available options
npm start --help

# High-performance crawling
npm start https://news.ycombinator.com --concurrent --concurrency=15 --depth=2
```

### Performance Comparison

| Mode | Speed | Concurrency | Best For |
|------|-------|-------------|----------|
| Sequential | 1x | 1 request | Small sites, testing |
| Fast | 3-4x | 5 workers | Most websites |
| Turbo | 4-6x | 10 workers | Large sites |
| Custom | Variable | 1-20 workers | Specific needs |

### Development Mode

Run with auto-restart on file changes:
```bash
npm run dev https://example.com
```

### Generate Analysis Report

After crawling, generate detailed analysis:
```bash
npm run analyze
```

This will:
- Generate comprehensive analysis reports
- Create both Markdown and HTML versions
- **Automatically open the HTML report in your browser**

### Open Latest Report

To manually open the latest report in your browser:
```bash
npm run open-report
```

## 📊 Output Files

The crawler generates several output files in the `data/` and `reports/` directories:

### Data Files
- `crawl-data-[timestamp].json` - Complete crawl results with metadata
- `word-frequency-[timestamp].csv` - Word frequency data in CSV format

### Report Files
- `analysis-report-[timestamp].json` - Detailed analysis in JSON format
- `analysis-report-[timestamp].md` - Human-readable Markdown report

## ⚙️ Configuration

Modify `config.json` to customize crawling behavior:

```json
{
  "crawler": {
    "maxDepth": 2,
    "delay": 1000,
    "maxPagesPerDomain": 50,
    "requestTimeout": 10000
  },
  "analysis": {
    "minWordLength": 3,
    "topWordsLimit": 200,
    "excludeCommonWords": true
  }
}
```

### Key Configuration Options

- **maxDepth**: How deep to follow links (default: 2)
- **delay**: Milliseconds between requests (default: 1000)
- **requestTimeout**: Maximum time to wait for page response (default: 10000ms)
- **minWordLength**: Minimum word length to include in analysis (default: 3)
- **topWordsLimit**: Number of top words to save (default: 200)

## 📈 Understanding the Output

### Console Output
The crawler provides real-time feedback:
```
🕷️  Web Crawler Starting...
📍 Starting URL: https://example.com
🔍 Max Depth: 2
⏱️  Delay: 1000ms
------------------------------------------------------------
Crawling: https://example.com (depth: 0)
✓ Processed: https://example.com - 847 words, 12 links
Crawling: https://example.com/about (depth: 1)
✓ Processed: https://example.com/about - 543 words, 8 links
```

### Summary Statistics
After completion, you'll see:
```
============================================================
📈 CRAWL SUMMARY
============================================================
Pages crawled: 15
Total words: 12,847
Unique words: 2,156
Success rate: 93.3%
Average response time: 1,247ms
Total execution time: 23.4s

🔤 TOP 10 WORDS:
 1. website         156 (1.21%)
 2. information     142 (1.11%)
 3. service         128 (1.00%)
 ...
```

## 🔍 Analysis Features

The analysis tool provides:

### Word Frequency Analysis
- Distribution of word frequencies
- Vocabulary richness metrics
- Top words with percentages
- Statistical analysis (mean, median, standard deviation)

### Performance Analysis
- Request success rates
- Response time analysis
- Page content metrics
- Error analysis and recommendations

### Content Pattern Analysis
- Content type distribution
- Theme identification
- Title diversity analysis
- Content quality insights

## 🚨 Error Handling

The crawler handles various scenarios:
- Network timeouts
- Invalid URLs
- Robots.txt restrictions
- Server errors (4xx, 5xx)
- Malformed HTML

Errors are logged and don't stop the crawling process.

## 🤖 Respectful Crawling

This crawler implements ethical crawling practices:
- Respects robots.txt files
- Implements configurable delays between requests
- Uses appropriate User-Agent strings
- Limits concurrent connections
- Avoids infinite loops with visited URL tracking

## 📝 Example Commands

```bash
# Basic crawling
npm start https://news.ycombinator.com

# Crawl with custom depth
node src/app.js https://example.com

# Generate analysis after crawling
npm run analyze

# View all data files
ls data/

# View reports
ls reports/
```

## 🎛️ Advanced Usage

### Custom Configuration
Create a custom config file and modify the crawler behavior:
```javascript
const WebCrawler = require('./src/WebCrawler');

const crawler = new WebCrawler({
    maxDepth: 3,
    delay: 500,
    userAgent: 'MyCustomCrawler/1.0'
});

crawler.crawl('https://example.com');
```

### Programmatic Usage
```javascript
const WebCrawler = require('./src/WebCrawler');
const DataAnalyzer = require('./src/analyzer');

async function crawlAndAnalyze(url) {
    const crawler = new WebCrawler({ maxDepth: 2 });
    await crawler.crawl(url);
    await crawler.saveData();
    
    const analyzer = new DataAnalyzer();
    const analysis = await analyzer.generateReport();
    
    return analysis;
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"No crawl data found"**
   - Run the crawler first: `npm start [URL]`

2. **Network timeouts**
   - Increase timeout in config.json
   - Check internet connection

3. **High memory usage**
   - Reduce maxDepth
   - Limit pages per domain

4. **403/401 errors**
   - Site may block crawlers
   - Check robots.txt compliance

### Debug Mode
Enable verbose logging by setting LOG_LEVEL:
```bash
LOG_LEVEL=debug npm start https://example.com
```

## 📊 Key Performance Indicators (KPIs)

The system tracks several KPIs:

### Crawling Efficiency
- Pages per minute
- Success rate percentage
- Average response time
- Error rate

### Content Quality
- Words per page
- Vocabulary richness
- Content diversity score
- Unique word ratio

### System Performance
- Memory usage
- CPU utilization
- Storage requirements
- Execution time

## 🔮 Future Improvements

Potential enhancements identified:
- Database integration for large-scale storage
- Distributed crawling capabilities
- Real-time dashboard
- Machine learning for content classification
- Advanced text preprocessing
- Sentiment analysis integration

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Add tests
5. Submit a pull request

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review error logs in the console
3. Examine generated reports for insights
4. Create an issue with detailed information

---

**Happy Crawling! 🕷️**