import { config } from '../config';

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  category: string;
}

interface GroqApiResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class ApiService {
  private static instance: ApiService | null = null;
  private baseUrl: string;
  private apiKey: string;

  private constructor() {
    this.baseUrl = config.apiEndpoint;
    this.apiKey = config.apiKey;
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private parseSearchResults(content: string): SearchResult[] {
    try {
      // Extensive logging for debugging
      console.group('Parse Search Results Debugging');
      console.log('Raw content type:', typeof content);
      console.log('Raw content length:', content.length);
      console.log('Raw content first 500 chars:', content.slice(0, 500));
      console.log('Raw content last 500 chars:', content.slice(-500));

      // Advanced sanitization and preprocessing
      const sanitizedContent = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .replace(/^[^[{]*/, '')  // Remove any text before the first [ or {
        .replace(/[^}\]]*$/, '')  // Remove any text after the last } or ]
        .trim();

      console.log('Sanitized content first 500 chars:', sanitizedContent.slice(0, 500));

      // Try multiple parsing strategies
      const parseStrategies = [
        // Strategy 1: Strict JSON array parsing with multiple sanitization attempts
        () => {
          const sanitizationAttempts = [
            (text) => text,
            (text) => text.replace(/\s+/g, ''),  // Remove all whitespace
            (text) => text.replace(/([{\[,])\s*(["\w])/g, '$1$2'),  // Compact JSON
          ];

          for (const sanitize of sanitizationAttempts) {
            try {
              const sanitizedText = sanitize(sanitizedContent);
              const jsonMatch = sanitizedText.match(/\[\s*\{.*?\}\s*\]/s);
              console.log('JSON Array Match:', jsonMatch ? jsonMatch[0] : 'No match');
              return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
            } catch {}
          }
          return null;
        },
        // Strategy 2: Flexible JSON parsing with multiple sanitization
        () => {
          const sanitizationAttempts = [
            (text) => text,
            (text) => text.replace(/\s+/g, ''),
            (text) => text.replace(/([{\[,])\s*(["\w])/g, '$1$2'),
          ];

          for (const sanitize of sanitizationAttempts) {
            try {
              const sanitizedText = sanitize(sanitizedContent);
              return JSON.parse(sanitizedText);
            } catch {}
          }
          return null;
        },
        // Strategy 3: Aggressive extraction and parsing
        () => {
          const extractionAttempts = [
            (text) => text.match(/\[\{[\s\S]*?\}\]/),
            (text) => text.match(/\{[\s\S]*?\}/),
            (text) => text.match(/\[[\s\S]*?\]/)
          ];

          for (const extract of extractionAttempts) {
            const jsonMatch = extract(sanitizedContent);
            if (jsonMatch) {
              try {
                console.log('Extracted JSON:', jsonMatch[0]);
                return JSON.parse(jsonMatch[0]);
              } catch {}
            }
          }
          return null;
        }
      ];

      for (const strategy of parseStrategies) {
        try {
          const parsedResults = strategy();
          console.log('Parsed Results:', parsedResults);

          if (parsedResults) {
            // Validate the structure
            if (Array.isArray(parsedResults)) {
              // Ensure each result has required fields
              const validResults = parsedResults.filter(result => 
                result.title && result.url && result.description
              );
              console.log('Valid Results:', validResults);
              return validResults;
            } else if (typeof parsedResults === 'object') {
              console.log('Single Object Result:', [parsedResults]);
              return [parsedResults];
            }
          }
        } catch (strategyError) {
          console.error('Parsing strategy failed:', strategyError);
        }
      }

      console.error('No valid JSON found in response');
      console.groupEnd();
      return [];
    } catch (e) {
      console.error('Failed to parse search results:', e);
      console.groupEnd();
      return [];
    }
  }

  public async searchWebsites(query: string): Promise<SearchResult[]> {
    try {
      // Validate API key using config method
      if (!config.validateApiKey()) {
        throw new Error('Invalid or missing API key');
      }

      console.log('Searching for websites related to:', query);

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://whatyouseek.co', // Optional but recommended
          'X-Title': 'WhatYouSeek'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system', 
              content: 'You are a helpful assistant that finds websites based on user queries.'
            },
            {
              role: 'user',
              content: `Find 5 websites related to: ${query}. 
              Respond ONLY with a VALID JSON array of objects, each containing:
              - title: string (website name)
              - url: string (full website URL)
              - description: string (brief description)
              - category: string (website category)
              Example: [{
                "title":"Example Site",
                "url":"https://example.com",
                "description":"A site about things",
                "category":"Technology"
              }]`
            }
          ],
          model: 'mistralai/mistral-7b-instruct', // Open Router model
          temperature: 0.7,
          max_tokens: 300,
        })
      });

      // Check if the response is ok
      if (!response.ok) {
        const errorBody = await response.text();
        console.error('API Response Error:', {
          status: response.status,
          body: errorBody
        });
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
      }

      const apiResponse = await response.json();
      
      // Detailed logging for API response
      console.log('Full API Response:', JSON.stringify(apiResponse, null, 2));

      // Add more robust checking for Open Router response
      if (!apiResponse || !apiResponse.choices || apiResponse.choices.length === 0) {
        console.error('Invalid API response structure:', apiResponse);
        return [];
      }

      const content = apiResponse.choices[0]?.message?.content || '';
      if (!content) {
        console.error('No content in API response');
        return [];
      }

      console.log('Extracted Content:', content);

      return this.parseSearchResults(content);
    } catch (error) {
      console.error('Complete Search Error:', {
        message: error.message,
        stack: error.stack
      });
      return [];
    }
  }

  public async getRecommendations(favorites: string[]): Promise<SearchResult[]> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that recommends websites based on user favorites.'
            },
            {
              role: 'user',
              content: `Based on these favorite websites: ${favorites.join(', ')}, 
              recommend 5 similar websites. 
              Respond ONLY with a JSON array of objects, each containing:
              - title: string (website name)
              - url: string (full website URL)
              - description: string (brief description)
              - category: string (website category)
              Example: [{
                "title":"Example Site",
                "url":"https://example.com",
                "description":"A site about things",
                "category":"Technology"
              }]`
            }
          ],
          model: 'llama-4-maverick-free',
          temperature: 0.7,
          max_tokens: 300,
        })
      });

      const apiResponse = await response.json() as GroqApiResponse;
      const content = apiResponse.choices[0]?.message.content || '';
      return this.parseSearchResults(content);
    } catch (error) {
      console.error('Recommendations error:', error);
      return [];
    }
  }
}

export const apiService = ApiService.getInstance();