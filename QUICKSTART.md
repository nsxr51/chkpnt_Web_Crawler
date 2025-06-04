# 🚀 Quick Start Guide

Get your web crawler up and running in minutes!

## 📋 Prerequisites

- **Node.js** v14 or higher
- **npm** v6 or higher
- Internet connection

## ⚡ Installation & Setup

### Option 1: Standard Setup
1. **Navigate to the project directory:**
   ```bash
   cd web-crawler
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

### Option 2: MCP Integration (Use with Claude!)
1. **Complete setup including MCP server:**
   ```bash
   npm run full-setup
   ```

2. **Restart Claude Desktop**

3. **Use natural language with Claude:**
   ```
   "Please crawl https://example.com and analyze the word frequency"
   "Search the content for mentions of 'technology'"
   "Export the data as CSV format"
   ```

## 🎯 Basic Usage

### Start Crawling
```bash
# Sequential crawling (slower but stable)
npm start https://example.com

# 🚀 Concurrent crawling (3-5x faster!)
npm run start:fast https://example.com

# ⚡ Turbo mode (even faster!)
npm run start:turbo https://example.com

# Custom concurrent settings
npm start https://example.com --concurrent --concurrency=8
```

### Speed Options
```bash
# Fast mode (recommended)
npm run start:fast https://news.ycombinator.com

# Turbo mode for large sites
npm run start:turbo https://reddit.com

# Custom configuration
npm start https://example.com --concurrent --depth=3 --delay=200
```

### Generate Analysis
```bash
npm run analyze
```

### Run Examples
```bash
node examples/demo.js basic
node examples/demo.js advanced
```

## 📊 What You'll Get

After crawling, you'll find:

### Data Files (`data/` folder)
- `crawl-data-[timestamp].json` - Complete crawl results
- `word-frequency-[timestamp].csv` - Word frequency data

### Reports (`reports/` folder)
- `analysis-report-[timestamp].json` - Detailed analysis
- `analysis-report-[timestamp].md` - Human-readable report

## 🔧 Configuration

Edit `config.json` to customize:

```json
{
  "crawler": {
    "maxDepth": 2,        // How deep to crawl
    "delay": 1000,        // Delay between requests (ms)
    "requestTimeout": 10000
  }
}
```

## 📈 Sample Output

```
🕷️  Web Crawler Starting...
📍 Starting URL: https://example.com
------------------------------------------------------------
Crawling: https://example.com (depth: 0)
✓ Processed: https://example.com - 847 words, 12 links

============================================================
📈 CRAWL SUMMARY
============================================================
Pages crawled: 15
Total words: 12,847
Unique words: 2,156
Success rate: 93.3%
Average response time: 1,247ms

🔤 TOP 10 WORDS:
 1. example          156 (1.21%)
 2. information      142 (1.11%)
 3. website          128 (1.00%)
```

## 🛠️ Useful Commands

```bash
# Development mode with auto-restart
npm run dev https://example.com

# Run tests
npm test

# Benchmark performance
npm run benchmark

# Clean old data files
npm run cleanup

# Run examples
node examples/demo.js
```

## 🚨 Troubleshooting

### Common Issues

**"No crawl data found"**
```bash
# Run crawler first
npm start https://example.com
```

**Network timeouts**
```bash
# Increase timeout in config.json
# Or check internet connection
```

**Permission errors**
```bash
# Check file permissions
# Run setup again
npm run setup
```

## 📞 Need Help?

1. Check the full [README.md](README.md)
2. Look at [examples/demo.js](examples/demo.js)
3. Run benchmark: `npm run benchmark`
4. Check error logs in console output

## 🎉 You're Ready!

Start with:
```bash
npm start https://news.ycombinator.com
npm run analyze
```

Happy crawling! 🕷️