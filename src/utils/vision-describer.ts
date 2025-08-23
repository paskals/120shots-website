/**
 * Google Vision API Image Describer for 120 Shots Photography Portfolio
 * 
 * This utility generates alt text descriptions for photography using Google Vision API.
 * It uses only LANDMARK_DETECTION and LABEL_DETECTION to create photography-focused
 * descriptions suitable for alt text and accessibility.
 */

import { config } from 'dotenv';
import { hideBin } from "yargs/helpers";
import yargs from "yargs";

// Load environment variables
config();

interface VisionRequest {
  requests: {
    image: {
      source: {
        imageUri: string;
      };
    };
    features: {
      type: string;
      maxResults: number;
    }[];
  }[];
}

interface VisionResponse {
  responses: {
    labelAnnotations?: {
      description: string;
      score: number;
    }[];
    landmarkAnnotations?: {
      description: string;
      score: number;
      locations?: {
        latLng: {
          latitude: number;
          longitude: number;
        };
      }[];
    }[];
    error?: {
      code: number;
      message: string;
    };
  }[];
}

interface ImageDescription {
  url: string;
  description: string;
  labels: string[];
  landmarks: string[];
  success: boolean;
  error?: string;
}

interface BatchProcessResult {
  successful: ImageDescription[];
  failed: ImageDescription[];
  totalProcessed: number;
  successRate: number;
}

export class GoogleVisionImageDescriber {
  private apiKey: string;
  private baseUrl = 'https://vision.googleapis.com/v1/images:annotate';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Google API key is required. Set GOOGLE_API_KEY environment variable or pass it to constructor.');
    }
  }

  /**
   * Generate detailed description for an image from URL
   * @param imageUrl - Direct URL to the image
   * @param detailLevel - 'basic' | 'detailed' | 'comprehensive'
   */
  async describeImage(
    imageUrl: string, 
    detailLevel: 'basic' | 'detailed' | 'comprehensive' = 'detailed'
  ): Promise<ImageDescription> {
    try {
      const features = this.getFeaturesByDetailLevel(detailLevel);
      
      const requestBody: VisionRequest = {
        requests: [{
          image: {
            source: { imageUri: imageUrl }
          },
          features
        }]
      };

      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: VisionResponse = await response.json();
      
      if (data.responses[0].error) {
        throw new Error(`Vision API error: ${data.responses[0].error.message}`);
      }

      const visionData = data.responses[0];
      const labels = visionData.labelAnnotations?.map(l => l.description) || [];
      const landmarks = visionData.landmarkAnnotations?.map(l => l.description) || [];
      const description = this.formatDescription(visionData, detailLevel);

      return {
        url: imageUrl,
        description,
        labels,
        landmarks,
        success: true
      };
    } catch (error: any) {
      return {
        url: imageUrl,
        description: '',
        labels: [],
        landmarks: [],
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process multiple images in batch with rate limiting
   * @param imageUrls - Array of image URLs
   * @param detailLevel - Detail level for descriptions
   * @param delayMs - Delay between requests (default: 100ms for rate limiting)
   */
  async describeImageBatch(
    imageUrls: string[], 
    detailLevel: 'basic' | 'detailed' | 'comprehensive' = 'detailed',
    delayMs: number = 100
  ): Promise<BatchProcessResult> {
    const results: ImageDescription[] = [];
    
    console.log(`🔄 Processing ${imageUrls.length} images with ${delayMs}ms delay between requests...`);
    
    for (let i = 0; i < imageUrls.length; i++) {
      const url = imageUrls[i];
      console.log(`Processing ${i + 1}/${imageUrls.length}: ${url}`);
      
      try {
        const description = await this.describeImage(url, detailLevel);
        results.push(description);
        
        if (description.success) {
          console.log(`✅ Success: ${description.description.substring(0, 60)}...`);
        } else {
          console.log(`❌ Failed: ${description.error}`);
        }
        
        // Rate limiting delay
        if (i < imageUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error: any) {
        results.push({
          url,
          description: '',
          labels: [],
          landmarks: [],
          success: false,
          error: error.message
        });
        console.log(`❌ Error processing ${url}: ${error.message}`);
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return {
      successful,
      failed,
      totalProcessed: results.length,
      successRate: (successful.length / results.length) * 100
    };
  }

  /**
   * Get features to request based on detail level
   * Only uses LANDMARK_DETECTION and LABEL_DETECTION as requested
   */
  private getFeaturesByDetailLevel(detailLevel: string) {
    if (detailLevel === 'basic') {
      return [
        { type: 'LABEL_DETECTION', maxResults: 5 }
      ];
    }

    if (detailLevel === 'comprehensive') {
      return [
        { type: 'LABEL_DETECTION', maxResults: 15 },
        { type: 'LANDMARK_DETECTION', maxResults: 10 }
      ];
    }

    // detailed (default)
    return [
      { type: 'LABEL_DETECTION', maxResults: 10 },
      { type: 'LANDMARK_DETECTION', maxResults: 5 }
    ];
  }

  /**
   * Format the API response into a photography-focused alt text description
   */
  private formatDescription(response: any, detailLevel: string): string {
    const parts: string[] = [];

    // Landmarks (locations, buildings, monuments)
    if (response.landmarkAnnotations?.length > 0) {
      const landmarks = response.landmarkAnnotations
        .filter((landmark: any) => landmark.score > 0.6)
        .map((landmark: any) => landmark.description)
        .slice(0, detailLevel === 'comprehensive' ? 5 : 3);
      
      if (landmarks.length > 0) {
        parts.push(`Photographed at ${landmarks.join(', ')}`);
      }
    }

    // Labels - focusing on photography-relevant elements
    if (response.labelAnnotations?.length > 0) {
      const photographyRelevantLabels = this.filterPhotographyLabels(response.labelAnnotations);
      const filteredLabels = photographyRelevantLabels
        .filter((label: any) => label.score > 0.7)
        .map((label: any) => label.description.toLowerCase())
        .slice(0, detailLevel === 'basic' ? 3 : detailLevel === 'comprehensive' ? 10 : 6);
      
      if (filteredLabels.length > 0) {
        if (parts.length > 0) {
          parts.push(`featuring ${filteredLabels.join(', ')}`);
        } else {
          parts.push(`Photograph featuring ${filteredLabels.join(', ')}`);
        }
      }
    }

    // Fallback if no meaningful content detected
    if (parts.length === 0) {
      return 'Film photography image';
    }

    return parts.join(', ') + '.';
  }

  /**
   * Filter labels to focus on photography-relevant content
   */
  private filterPhotographyLabels(labelAnnotations: any[]): any[] {
    // Remove generic/unhelpful labels
    const skipLabels = [
      'photograph', 'image', 'picture', 'photo', 'camera', 'digital camera',
      'single lens reflex camera', 'film', 'film photography', 'black and white',
      'color', 'vintage', 'retro'
    ];

    return labelAnnotations.filter(label => 
      !skipLabels.some(skip => label.description.toLowerCase().includes(skip.toLowerCase()))
    );
  }
}

/**
 * Convenience function for batch processing photography collections
 */
export async function processPhotographyBatch(
  imageUrls: string[], 
  detailLevel: 'basic' | 'detailed' | 'comprehensive' = 'detailed'
): Promise<BatchProcessResult> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is required');
  }

  const describer = new GoogleVisionImageDescriber(apiKey);
  return describer.describeImageBatch(imageUrls, detailLevel);
}

// CLI interface for standalone testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = yargs(hideBin(process.argv))
    .command(
      'describe <urls..>',
      'Generate descriptions for image URLs',
      {
        detailLevel: {
          alias: 'd',
          describe: 'Detail level for descriptions',
          choices: ['basic', 'detailed', 'comprehensive'] as const,
          default: 'detailed' as const,
        },
        delay: {
          alias: 'delay',
          describe: 'Delay between API calls in milliseconds',
          type: 'number',
          default: 100,
        }
      }
    )
    .help()
    .parseSync();

  if (argv._.includes('describe') && argv.urls && Array.isArray(argv.urls)) {
    try {
      const describer = new GoogleVisionImageDescriber();
      const results = await describer.describeImageBatch(
        argv.urls as string[],
        argv.detailLevel as 'basic' | 'detailed' | 'comprehensive',
        argv.delay as number
      );
      
      console.log('\n📊 BATCH PROCESSING RESULTS:');
      console.log(`Total processed: ${results.totalProcessed}`);
      console.log(`Success rate: ${results.successRate.toFixed(1)}%`);
      
      if (results.successful.length > 0) {
        console.log('\n✅ SUCCESSFUL DESCRIPTIONS:');
        results.successful.forEach((result, index) => {
          console.log(`\n${index + 1}. ${result.url}`);
          console.log(`   Description: ${result.description}`);
          if (result.landmarks.length > 0) {
            console.log(`   Landmarks: ${result.landmarks.join(', ')}`);
          }
          console.log(`   Labels: ${result.labels.slice(0, 5).join(', ')}`);
        });
      }
      
      if (results.failed.length > 0) {
        console.log('\n❌ FAILED DESCRIPTIONS:');
        results.failed.forEach((result, index) => {
          console.log(`${index + 1}. ${result.url}: ${result.error}`);
        });
      }
      
    } catch (error: any) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  } else {
    console.log('Usage: tsx vision-describer.ts describe <url1> <url2> ...');
    console.log('Example: tsx vision-describer.ts describe "https://cdn.120shots.com/images/roll1/photo1.webp"');
  }
}