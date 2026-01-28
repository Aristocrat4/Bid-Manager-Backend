import { Injectable, Logger } from '@nestjs/common';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Use stealth plugin to avoid bot detection
puppeteerExtra.use(StealthPlugin());

export interface LotStatus {
  lotNumber: string;
  status: 'won' | 'lost' | 'active' | 'pending' | 'unknown';
  finalPrice?: number;
  winnerInfo?: string;
  auctionEnded: boolean;
}

@Injectable()
export class CopartScraperService {
  private readonly logger = new Logger(CopartScraperService.name);
  private browser: Browser | null = null;
  private requestCount = 0;
  private requestWindow = Date.now();

  async initialize() {
    if (!this.browser) {
      this.logger.log('Initializing Puppeteer browser...');

      this.browser = await puppeteerExtra.launch({
        headless: true, // Run without GUI
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080',
        ],
      });

      this.logger.log('Browser initialized successfully');
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.log('Browser closed');
    }
  }

  async loginToCopart(username: string, password: string): Promise<Page> {
    await this.initialize();
    await this.checkRateLimit();

    const page = await this.browser.newPage();

    // Set user agent to look like real browser
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      this.logger.log('Navigating to Copart login page...');

      // Navigate to login page
      await page.goto('https://www.copart.com/login/', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Wait for login form
      await page.waitForSelector('input[name="username"]', { timeout: 10000 });

      this.logger.log('Filling login credentials...');

      // Fill in credentials
      await page.type('input[name="username"]', username, { delay: 100 });
      await page.type('input[name="password"]', password, { delay: 100 });

      // Click login button
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      ]);

      // Check if login was successful
      const currentUrl = page.url();

      if (currentUrl.includes('/login') || currentUrl.includes('/error')) {
        throw new Error('Login failed - incorrect credentials or blocked');
      }

      this.logger.log('Login successful!');

      // Wait a bit to avoid looking like a bot
      await this.randomDelay(2000, 4000);

      return page;
    } catch (error) {
      this.logger.error('Login error:', error);
      await page.close();
      throw error;
    }
  }

  async checkLotStatus(
    page: Page,
    lotNumber: string,
    userBidAmount: number
  ): Promise<LotStatus> {
    try {
      this.logger.log(`Checking status for lot #${lotNumber}...`);
      await this.checkRateLimit();

      // Navigate to lot page
      const lotUrl = `https://www.copart.com/lot/${lotNumber}`;
      await page.goto(lotUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await this.randomDelay(1000, 2000);

      // Check if lot exists
      const pageContent = await page.content();
      if (pageContent.includes('404') || pageContent.includes('not found')) {
        return {
          lotNumber,
          status: 'unknown',
          auctionEnded: false,
        };
      }

      // Extract auction status
      const auctionStatus = await page.evaluate(() => {
        const statusElement = document.querySelector('[class*="auction-status"]') ||
                             document.querySelector('[class*="status"]');
        return statusElement ? statusElement.textContent.toLowerCase() : '';
      });

      // Check if auction has ended
      const auctionEnded =
        auctionStatus.includes('sold') ||
        auctionStatus.includes('ended') ||
        auctionStatus.includes('closed') ||
        auctionStatus.includes('completed');

      if (!auctionEnded) {
        return {
          lotNumber,
          status: 'active',
          auctionEnded: false,
        };
      }

      // Extract final price
      const finalPrice = await page.evaluate(() => {
        const priceSelectors = [
          '[class*="sold-price"]',
          '[class*="final-price"]',
          '[class*="winning-bid"]',
          '[data-test*="price"]',
        ];

        for (const selector of priceSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.textContent || element.innerText;
            const priceMatch = text.match(/\$?([\d,]+)/);
            if (priceMatch) {
              return parseFloat(priceMatch[1].replace(/,/g, ''));
            }
          }
        }

        return null;
      });

      // Check if user won - compare with user's bid
      const userWon = finalPrice && finalPrice === userBidAmount;

      // Alternative: Check "My Bids" page to confirm (more reliable)
      const confirmedWin = await this.checkMyBidsPage(page, lotNumber);

      return {
        lotNumber,
        status: confirmedWin || userWon ? 'won' : 'lost',
        finalPrice: finalPrice || undefined,
        auctionEnded: true,
      };
    } catch (error) {
      this.logger.error(`Error checking lot ${lotNumber}:`, error);
      return {
        lotNumber,
        status: 'unknown',
        auctionEnded: false,
      };
    }
  }

  async checkMyBidsPage(page: Page, lotNumber: string): Promise<boolean> {
    try {
      await this.checkRateLimit();

      // Navigate to "My Bids" page
      await page.goto('https://www.copart.com/myAccount/myBids', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      await this.randomDelay(1000, 2000);

      // Look for the lot number in won bids section
      const wonBids = await page.evaluate((lot) => {
        const wonSection = document.querySelector('[class*="won-bids"]') ||
                          document.querySelector('[data-test*="won-bids"]') ||
                          document.querySelector('[id*="won"]');

        if (!wonSection) {
          // Fallback: search entire page
          const bodyText = document.body.textContent || document.body.innerText;
          return bodyText.includes(lot) && bodyText.toLowerCase().includes('won');
        }

        const text = wonSection.textContent || wonSection.innerText;
        return text.includes(lot);
      }, lotNumber);

      return wonBids;
    } catch (error) {
      this.logger.error('Error checking My Bids page:', error);
      return false;
    }
  }

  async handleCaptcha(page: Page): Promise<boolean> {
    try {
      // Check if CAPTCHA is present
      const captchaElement = await page.$('iframe[src*="recaptcha"]') ||
                            await page.$('[class*="captcha"]');

      if (captchaElement) {
        this.logger.warn('CAPTCHA detected! Manual intervention required.');

        // Take screenshot for debugging
        await this.takeScreenshot(page, `captcha-${Date.now()}.png`);

        return false;
      }

      return true; // No CAPTCHA
    } catch (error) {
      this.logger.error('Error checking for CAPTCHA:', error);
      return false;
    }
  }

  private async checkRateLimit() {
    const now = Date.now();
    const windowSize = 60000; // 1 minute

    if (now - this.requestWindow > windowSize) {
      // Reset window
      this.requestCount = 0;
      this.requestWindow = now;
    }

    if (this.requestCount > 20) {
      // Max 20 requests per minute
      const waitTime = windowSize - (now - this.requestWindow);
      this.logger.warn(`Rate limit reached, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.requestCount = 0;
      this.requestWindow = Date.now();
    }

    this.requestCount++;
  }

  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  async takeScreenshot(page: Page, filename: string): Promise<void> {
    try {
      await page.screenshot({ path: `screenshots/${filename}`, fullPage: false });
      this.logger.log(`Screenshot saved: ${filename}`);
    } catch (error) {
      this.logger.error('Error taking screenshot:', error);
    }
  }
}
