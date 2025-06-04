# 🚀 Quick MCP Setup Guide

## Step 1: Install Dependencies
```bash
cd mcp-server
npm install
```

## Step 2: Automated Setup
```bash
npm run setup
```

This creates `claude_desktop_config.json` in the current directory and automatically copies it to Claude Desktop's config location.

**⚠️ If automatic setup fails:** The script will create configuration files you can manually copy. See the detailed instructions it provides.

## Step 3: Manual Copy (If Needed)

If automatic setup doesn't work, copy the generated `claude_desktop_config.json` to:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Linux:** `~/.config/Claude/claude_desktop_config.json`

## Step 4: Restart Claude Desktop

## Step 5: Test with Claude!

Try these commands in Claude Desktop:

```
"Please crawl https://example.com and show me the word analysis"
```

```
"Search the crawled content for mentions of 'technology'"
```

```
"Export the word frequency data as CSV"
```

## 🛠️ Available Tools

1. **crawl_website** - Crawl websites and extract content
2. **analyze_crawl_data** - Analyze word frequency and patterns
3. **search_crawled_content** - Search through crawled pages
4. **export_crawl_data** - Export in JSON, CSV, or TXT format

## ✅ Success Indicators

- Server test passes ✅
- Claude Desktop shows web-crawler tools ✅
- You can ask Claude to crawl websites ✅

## 🚨 Troubleshooting

**Server won't start:**
- Check Node.js is installed: `node --version`
- Try: `npm install` again

**Claude doesn't see the tools:**
- Make sure you restarted Claude Desktop
- Check the config was created correctly

**Permission errors:**
- Try running as administrator (Windows)
- Check file permissions (macOS/Linux)

---

🎉 **You're ready to crawl the web with Claude!** 🕷️