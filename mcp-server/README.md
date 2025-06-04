# Web Crawler MCP Server

This MCP (Model Context Protocol) server allows you to use the web crawler functionality directly through Claude Desktop or other MCP-compatible clients.

## 🚀 Quick Setup

### 1. Install MCP Server Dependencies

```bash
cd mcp-server
npm install
```

### 2. Configure Claude Desktop

Add this configuration to your Claude Desktop config file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "web-crawler": {
      "command": "node",
      "args": ["C:\\Users\\lior.b\\dev\\web-crawler\\mcp-server\\server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Note:** Update the path in `args` to match your actual installation directory.

### 3. Restart Claude Desktop

After adding the configuration, restart Claude Desktop to load the MCP server.

## 🛠️ Available Tools

Once configured, you'll have access to these tools in Claude:

### 1. `crawl_website`
Crawl a website and extract content with word frequency analysis.

**Parameters:**
- `url` (required): The URL to crawl
- `options` (optional):
  - `maxDepth`: Maximum crawling depth (1-5, default: 2)
  - `maxPages`: Maximum pages to crawl (1-100, default: 10)
  - `concurrent`: Use concurrent crawling (default: true)
  - `concurrency`: Number of workers (1-10, default: 3)
  - `delay`: Delay between requests in ms (100-5000, default: 1000)

**Example:**
```
Please crawl https://example.com with depth 2 and 5 concurrent workers
```

### 2. `analyze_crawl_data`
Analyze crawled data and generate insights.

**Parameters:**
- `sessionId` (required): Session ID from previous crawl
- `analysisType`: Type of analysis ('word_frequency', 'content_analysis', 'performance', 'full')
- `topWordsLimit`: Number of top words to return (5-100, default: 20)

### 3. `get_crawl_summary`
Get a summary of crawled data.

**Parameters:**
- `sessionId` (required): Session ID from previous crawl

### 4. `search_crawled_content`
Search through crawled content for specific terms.

**Parameters:**
- `sessionId` (required): Session ID from previous crawl
- `searchTerm` (required): Term to search for
- `caseSensitive`: Whether search should be case sensitive (default: false)

### 5. `export_crawl_data`
Export crawled data in various formats.

**Parameters:**
- `sessionId` (required): Session ID from previous crawl
- `format` (required): Export format ('json', 'csv', 'txt', 'markdown')

## 💬 Example Usage in Claude

Here are some example conversations you can have with Claude once the MCP server is set up:

### Basic Crawling
```
User: Can you crawl https://news.ycombinator.com and analyze the most common words?

Claude: I'll crawl Hacker News for you and analyze the word frequency.

[Uses crawl_website tool]
[Uses analyze_crawl_data tool with word_frequency analysis]
```

### Advanced Analysis
```
User: Crawl https://example.com with maximum depth 3 and then give me a full analysis including performance metrics.

Claude: I'll crawl the website with depth 3 and provide comprehensive analysis.

[Uses crawl_website with maxDepth: 3]
[Uses analyze_crawl_data with analysisType: 'full']
```

### Content Search
```
User: Search the crawled data for mentions of "artificial intelligence"

Claude: I'll search through the crawled content for "artificial intelligence".

[Uses search_crawled_content tool]
```

### Data Export
```
User: Export the crawl data as CSV format

Claude: I'll export the word frequency data in CSV format.

[Uses export_crawl_data with format: 'csv']
```

## 🔧 Configuration Options

You can customize the MCP server behavior by modifying the `server.js` file:

- **Default concurrency**: Change the default number of workers
- **Rate limiting**: Adjust delays between requests
- **Data retention**: Configure how long to keep crawl sessions
- **Output formats**: Add custom export formats

## 🚨 Troubleshooting

### MCP Server Not Loading
1. Check that the path in `claude_desktop_config.json` is correct
2. Ensure Node.js is installed and accessible
3. Verify all dependencies are installed (`npm install` in mcp-server directory)
4. Check Claude Desktop logs for error messages

### Permission Errors
- On Windows: Run Claude Desktop as administrator if needed
- On macOS/Linux: Ensure the script has execute permissions

### Network Issues
- Check firewall settings
- Verify internet connectivity
- Some websites may block automated requests

## 🎯 Features

### ✅ What's Included
- **Concurrent crawling** for better performance
- **Word frequency analysis** with statistical insights
- **Content search** across crawled pages
- **Multiple export formats** (JSON, CSV, TXT, Markdown)
- **Performance metrics** tracking
- **Error handling** and recovery
- **Session management** for multiple crawl operations
- **Resource exposure** through MCP resources

### 🚀 Benefits of MCP Integration
- **Seamless Claude integration** - use natural language to control crawling
- **Real-time analysis** - get insights immediately after crawling
- **Interactive exploration** - ask follow-up questions about the data
- **Multiple export options** - get data in the format you need
- **Session persistence** - analyze the same crawl data multiple times

## 📊 Example Workflow

1. **Start crawling:**
   ```
   "Please crawl https://blog.example.com and find the most common topics"
   ```

2. **Analyze results:**
   ```
   "Show me the top 50 words and their frequency percentages"
   ```

3. **Search content:**
   ```
   "Search for mentions of 'machine learning' in the crawled content"
   ```

4. **Export data:**
   ```
   "Export the word frequency data as a CSV file"
   ```

5. **Performance analysis:**
   ```
   "How was the crawling performance? Show me the metrics"
   ```

## 🔄 Session Management

Each crawl operation creates a unique session ID that you can use to:
- Analyze the same data multiple times
- Search through crawled content
- Export data in different formats
- Compare different crawl sessions

Sessions are stored in memory and persist until the MCP server is restarted.

---

**Ready to start crawling with Claude? Set up the MCP server and start exploring the web with natural language commands!** 🕷️