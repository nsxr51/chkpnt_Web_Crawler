#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WebCrawlerMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'web-crawler-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.crawlData = new Map(); // Store crawl results by session ID
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'crawl_website',
            description: 'Crawl a website and extract content with word frequency analysis',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'The URL to crawl',
                },
                options: {
                  type: 'object',
                  properties: {
                    maxDepth: {
                      type: 'number',
                      description: 'Maximum crawling depth (default: 2)',
                      minimum: 1,
                      maximum: 5,
                    },
                    maxPages: {
                      type: 'number',
                      description: 'Maximum number of pages to crawl (default: 10)',
                      minimum: 1,
                      maximum: 50,
                    },
                    delay: {
                      type: 'number',
                      description: 'Delay between requests in milliseconds (default: 1000)',
                      minimum: 500,
                      maximum: 5000,
                    },
                  },
                },
              },
              required: ['url'],
            },
          },
          {
            name: 'analyze_crawl_data',
            description: 'Analyze crawled data and generate insights',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Session ID from previous crawl',
                },
                topWordsLimit: {
                  type: 'number',
                  description: 'Number of top words to return (default: 20)',
                  minimum: 5,
                  maximum: 100,
                },
              },
              required: ['sessionId'],
            },
          },
          {
            name: 'search_crawled_content',
            description: 'Search through crawled content for specific terms',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Session ID from previous crawl',
                },
                searchTerm: {
                  type: 'string',
                  description: 'Term to search for in crawled content',
                },
                caseSensitive: {
                  type: 'boolean',
                  description: 'Whether search should be case sensitive (default: false)',
                },
              },
              required: ['sessionId', 'searchTerm'],
            },
          },
          {
            name: 'export_crawl_data',
            description: 'Export crawled data in various formats',
            inputSchema: {
              type: 'object',
              properties: {
                sessionId: {
                  type: 'string',
                  description: 'Session ID from previous crawl',
                },
                format: {
                  type: 'string',
                  enum: ['json', 'csv', 'txt'],
                  description: 'Export format',
                },
              },
              required: ['sessionId', 'format'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'crawl_website':
            return await this.crawlWebsite(args);
          case 'analyze_crawl_data':
            return await this.analyzeCrawlData(args);
          case 'search_crawled_content':
            return await this.searchCrawledContent(args);
          case 'export_crawl_data':
            return await this.exportCrawlData(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async crawlWebsite(args) {
    const { url, options = {} } = args;
    const sessionId = this.generateSessionId();
    
    const config = {
      maxDepth: options.maxDepth || 2,
      maxPages: options.maxPages || 10,
      delay: options.delay || 1000,
    };

    try {
      const startTime = Date.now();
      const crawler = new SimpleCrawler(config);
      const results = await crawler.crawl(url);
      const endTime = Date.now();

      const crawlData = {
        sessionId,
        startUrl: url,
        config,
        results,
        metadata: {
          startTime: new Date(startTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          duration: endTime - startTime,
          totalPages: results.pages.length,
          totalWords: results.totalWords,
          uniqueWords: results.wordFrequency.size,
        },
      };

      this.crawlData.set(sessionId, crawlData);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Successfully crawled ${url}!\n\n` +
                  `📋 Session ID: ${sessionId}\n` +
                  `📄 Pages crawled: ${results.pages.length}\n` +
                  `📝 Total words: ${results.totalWords.toLocaleString()}\n` +
                  `🔤 Unique words: ${results.wordFrequency.size.toLocaleString()}\n` +
                  `⏱️ Duration: ${(crawlData.metadata.duration / 1000).toFixed(1)}s\n\n` +
                  `🔍 Use the session ID "${sessionId}" to analyze the data with other tools.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Crawling failed: ${error.message}`);
    }
  }

  async analyzeCrawlData(args) {
    const { sessionId, topWordsLimit = 20 } = args;
    const data = this.crawlData.get(sessionId);

    if (!data) {
      throw new Error('Session not found. Please crawl a website first.');
    }

    const topWords = this.getTopWords(data.results.wordFrequency, topWordsLimit);
    
    let analysis = `📊 Analysis for Session: ${sessionId}\n\n`;
    analysis += `🌐 URL: ${data.startUrl}\n`;
    analysis += `📄 Pages: ${data.metadata.totalPages}\n`;
    analysis += `📝 Total words: ${data.metadata.totalWords.toLocaleString()}\n`;
    analysis += `🔤 Unique words: ${data.metadata.uniqueWords.toLocaleString()}\n`;
    analysis += `📈 Vocabulary richness: ${(data.metadata.uniqueWords / data.metadata.totalWords * 100).toFixed(2)}%\n\n`;
    
    analysis += `🔝 Top ${topWordsLimit} Words:\n`;
    topWords.forEach((item, index) => {
      const percentage = (item.count / data.metadata.totalWords * 100).toFixed(2);
      analysis += `${(index + 1).toString().padStart(3)}. ${item.word.padEnd(20)} ${item.count.toString().padStart(6)} (${percentage}%)\n`;
    });

    return {
      content: [
        {
          type: 'text',
          text: analysis,
        },
      ],
    };
  }

  async searchCrawledContent(args) {
    const { sessionId, searchTerm, caseSensitive = false } = args;
    const data = this.crawlData.get(sessionId);

    if (!data) {
      throw new Error('Session not found. Please crawl a website first.');
    }

    const searchRegex = new RegExp(searchTerm, caseSensitive ? 'g' : 'gi');
    const matches = [];
    
    data.results.pages.forEach(page => {
      const content = page.textContent || '';
      const pageMatches = [];
      
      let match;
      while ((match = searchRegex.exec(content)) !== null) {
        const start = Math.max(0, match.index - 50);
        const end = Math.min(content.length, match.index + searchTerm.length + 50);
        const context = content.substring(start, end);
        
        pageMatches.push({
          position: match.index,
          context: '...' + context + '...',
        });
      }
      
      if (pageMatches.length > 0) {
        matches.push({
          url: page.url,
          title: page.title,
          matchCount: pageMatches.length,
          matches: pageMatches.slice(0, 3), // Limit to first 3 matches per page
        });
      }
    });
    
    let result = `🔍 Search Results for "${searchTerm}" in Session: ${sessionId}\n\n`;
    result += `Found ${matches.reduce((sum, m) => sum + m.matchCount, 0)} total matches in ${matches.length} pages\n\n`;
    
    if (matches.length === 0) {
      result += 'No matches found. Try a different search term.';
    } else {
      matches.forEach((match, index) => {
        result += `${index + 1}. ${match.title}\n`;
        result += `   URL: ${match.url}\n`;
        result += `   Matches: ${match.matchCount}\n`;
        
        match.matches.forEach((m, i) => {
          result += `   Context ${i + 1}: ${m.context}\n`;
        });
        result += '\n';
      });
    }

    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  async exportCrawlData(args) {
    const { sessionId, format } = args;
    const data = this.crawlData.get(sessionId);

    if (!data) {
      throw new Error('Session not found. Please crawl a website first.');
    }

    let exportedData = '';

    switch (format) {
      case 'json':
        exportedData = JSON.stringify(data, null, 2);
        break;
      case 'csv':
        exportedData = this.exportToCSV(data.results.wordFrequency);
        break;
      case 'txt':
        exportedData = this.exportToText(data);
        break;
      default:
        throw new Error('Unsupported export format');
    }

    return {
      content: [
        {
          type: 'text',
          text: `📄 Exported data for session ${sessionId} in ${format.toUpperCase()} format:\n\n${exportedData}`,
        },
      ],
    };
  }

  exportToCSV(wordFrequency) {
    const topWords = this.getTopWords(wordFrequency, 100);
    let csv = 'word,count,percentage\n';
    const totalWords = Array.from(wordFrequency.values()).reduce((sum, count) => sum + count, 0);
    
    topWords.forEach(item => {
      const percentage = (item.count / totalWords * 100).toFixed(2);
      csv += `"${item.word}",${item.count},${percentage}\n`;
    });
    
    return csv;
  }

  exportToText(data) {
    let text = `Web Crawl Report - Session: ${data.sessionId}\n`;
    text += `URL: ${data.startUrl}\n`;
    text += `Date: ${data.metadata.startTime}\n`;
    text += `Pages: ${data.metadata.totalPages}\n`;
    text += `Total Words: ${data.metadata.totalWords}\n`;
    text += `Unique Words: ${data.metadata.uniqueWords}\n\n`;
    
    text += 'Page Details:\n';
    data.results.pages.forEach((page, index) => {
      text += `${index + 1}. ${page.title}\n`;
      text += `   URL: ${page.url}\n`;
      text += `   Words: ${page.totalWords}\n\n`;
    });
    
    return text;
  }

  getTopWords(wordFrequency, limit) {
    return Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  }

  generateSessionId() {
    return `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Web Crawler MCP Server running on stdio');
  }
}

// Simple crawler implementation
class SimpleCrawler {
  constructor(config) {
    this.config = config;
    this.visitedUrls = new Set();
    this.pages = [];
    this.wordFrequency = new Map();
    this.totalWords = 0;
    this.errors = [];
  }

  async crawl(startUrl) {
    const urlQueue = [{ url: startUrl, depth: 0 }];
    
    while (urlQueue.length > 0 && this.pages.length < this.config.maxPages) {
      const { url, depth } = urlQueue.shift();
      
      if (this.visitedUrls.has(url) || depth > this.config.maxDepth) {
        continue;
      }

      await this.processUrl(url, depth, urlQueue);
      
      if (this.config.delay > 0) {
        await this.sleep(this.config.delay);
      }
    }
    
    return {
      pages: this.pages,
      wordFrequency: this.wordFrequency,
      totalWords: this.totalWords,
      errors: this.errors,
    };
  }

  async processUrl(url, depth, urlQueue) {
    this.visitedUrls.add(url);

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'WebCrawler-MCP/1.0',
        },
      });

      const $ = cheerio.load(response.data);
      
      // Extract text content
      $('script, style, nav, header, footer').remove();
      const textContent = $('body').text().replace(/\s+/g, ' ').trim();
      
      // Count words
      const words = textContent
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);
      
      const pageWordCount = {};
      words.forEach(word => {
        pageWordCount[word] = (pageWordCount[word] || 0) + 1;
        this.wordFrequency.set(word, (this.wordFrequency.get(word) || 0) + 1);
        this.totalWords++;
      });

      // Extract links
      const links = [];
      $('a[href]').each((i, element) => {
        try {
          const href = $(element).attr('href');
          const absoluteUrl = new URL(href, url).toString();
          const linkUrl = new URL(absoluteUrl);
          const baseUrl = new URL(url);
          
          if (linkUrl.hostname === baseUrl.hostname && 
              !this.visitedUrls.has(absoluteUrl) &&
              !absoluteUrl.match(/\.(pdf|jpg|png|gif|css|js)$/i)) {
            links.push(absoluteUrl);
          }
        } catch (error) {
          // Skip invalid URLs
        }
      });

      // Store page data
      this.pages.push({
        url,
        title: $('title').text().trim(),
        totalWords: words.length,
        linkCount: links.length,
        textContent,
        words: pageWordCount,
        depth,
      });

      // Add new links to queue for next depth
      if (depth < this.config.maxDepth) {
        links.slice(0, 3).forEach(link => {
          if (!this.visitedUrls.has(link)) {
            urlQueue.push({ url: link, depth: depth + 1 });
          }
        });
      }

    } catch (error) {
      this.errors.push({
        url,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the server
const server = new WebCrawlerMCPServer();
server.start().catch(console.error);