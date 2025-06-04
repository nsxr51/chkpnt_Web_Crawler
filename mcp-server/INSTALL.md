# 🚀 MCP Server Installation Guide

## 📋 Quick Setup (Recommended)

### Step 1: Install Dependencies
```bash
cd mcp-server
npm install
```

### Step 2: Run Automated Setup
```bash
npm run setup
```

This will:
- ✅ Create `claude_desktop_config.json` in the current directory
- ✅ Automatically copy it to Claude Desktop's config location
- ✅ Test the server functionality

### Step 3: Restart Claude Desktop

### Step 4: Test with Claude
```
"Please crawl https://example.com and analyze the word frequency"
```

---

## 🛠️ Manual Setup (If Automatic Fails)

### Step 1: Create Configuration Files
```bash
cd mcp-server
npm run setup
```

Even if setup "fails", it will create these files:
- `claude_desktop_config.json` - Ready-to-copy config file
- `claude_desktop_config_manual.json` - Minimal config for manual editing

### Step 2: Locate Claude Desktop Config Directory

**Windows:**
```
%APPDATA%\Claude\
Full path: C:\Users\[YourUsername]\AppData\Roaming\Claude\
```

**macOS:**
```
~/Library/Application Support/Claude/
```

**Linux:**
```
~/.config/Claude/
```

### Step 3: Copy Configuration File

**Option A: Copy the entire file**
1. Copy `claude_desktop_config.json` from the mcp-server directory
2. Paste it to the Claude Desktop config directory above
3. Rename it to `claude_desktop_config.json` if needed

**Option B: Manual editing**
1. Open (or create) `claude_desktop_config.json` in the Claude config directory
2. Add this content:

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

**⚠️ Important:** Update the path in `args` to match your actual installation:
- Windows: Use `\\` (double backslashes) in the path
- macOS/Linux: Use `/` (forward slashes)

### Step 4: Verify Configuration

Your final `claude_desktop_config.json` should look like:

```json
{
  "mcpServers": {
    "web-crawler": {
      "command": "node",
      "args": ["/path/to/your/web-crawler/mcp-server/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Step 5: Restart Claude Desktop

---

## 🧪 Testing the Setup

### Test 1: Server Functionality
```bash
cd mcp-server
npm test
```
Expected: "✅ Server started successfully!"

### Test 2: Claude Integration
1. Open Claude Desktop
2. Look for web-crawler tools in the interface
3. Try: `"Crawl https://example.com and show me the top words"`

### Test 3: Full Workflow
```
You: "Please crawl https://news.ycombinator.com with 3 pages maximum"
Claude: [Crawls and shows results with session ID]

You: "Search that session for 'AI' mentions"
Claude: [Shows search results]

You: "Export the word frequency as CSV"
Claude: [Provides CSV data]
```

---

## 🚨 Troubleshooting

### Configuration File Issues

**Problem:** Config file not found
```bash
# Check if directory exists
# Windows
dir "%APPDATA%\Claude"

# macOS/Linux  
ls -la ~/Library/Application Support/Claude/
```

**Solution:** Create the directory if it doesn't exist:
```bash
# Windows
mkdir "%APPDATA%\Claude"

# macOS
mkdir -p "~/Library/Application Support/Claude"

# Linux
mkdir -p ~/.config/Claude
```

### Path Issues

**Problem:** Wrong server path in config
**Solution:** Get the correct path:
```bash
cd mcp-server
pwd  # Shows current directory
# Use this path + /server.js in the config
```

**Windows path format:**
```json
"args": ["C:\\Users\\YourName\\dev\\web-crawler\\mcp-server\\server.js"]
```

**macOS/Linux path format:**
```json
"args": ["/Users/YourName/dev/web-crawler/mcp-server/server.js"]
```

### Permission Issues

**Windows:**
- Run Claude Desktop as administrator
- Check that the config directory is writable

**macOS/Linux:**
- Check file permissions: `ls -la ~/.config/Claude/`
- Fix if needed: `chmod 644 ~/.config/Claude/claude_desktop_config.json`

### Server Won't Start

**Check Node.js:**
```bash
node --version  # Should show v14+
```

**Test server directly:**
```bash
cd mcp-server
node server.js
```
Should show: "Web Crawler MCP Server running on stdio"

---

## ✅ Success Indicators

1. **Setup completed** without errors
2. **Configuration file** exists in Claude config directory  
3. **Server test** passes
4. **Claude Desktop** shows web-crawler tools
5. **Can crawl websites** using natural language

---

## 📞 Getting Help

If you're still having issues:

1. **Check the paths** - Most common issue
2. **Restart Claude Desktop** - Required after config changes
3. **Test server manually** - Run `node server.js` to test
4. **Check logs** - Look for errors in Claude Desktop logs
5. **Recreate config** - Run setup again if needed

## 📝 Manual Configuration Template

Save this as `claude_desktop_config.json` in your Claude config directory:

```json
{
  "mcpServers": {
    "web-crawler": {
      "command": "node",
      "args": ["REPLACE_WITH_YOUR_ACTUAL_PATH/server.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Remember to:**
- Replace `REPLACE_WITH_YOUR_ACTUAL_PATH` with your real path
- Use proper path separators for your OS
- Restart Claude Desktop after changes

---

🎉 **You're ready to crawl the web with Claude!** 🕷️