import quotesCatalog from '../assets/quotes.json';
import { Quote } from '../types';

class QuoteService {
  private quotes: Quote[] = quotesCatalog as Quote[];

  /**
   * Get 1 quote per day deterministically based on today's calendar date
   */
  getDailyQuote(streak: number = 0): Quote {
    if (streak >= 30) {
      return {
        id: 'milestone-30',
        text: 'A full 30-day streak! Your dedication is a masterpiece, keep flourishing.',
        category: 'inspirational',
        author: 'MediAlert Recovery',
      };
    }
    if (streak >= 7) {
      return {
        id: 'milestone-7',
        text: 'One whole week without missing a beat! Your consistency is healing your body.',
        category: 'inspirational',
        author: 'Health Buddy',
      };
    }

    const today = new Date();
    // Deterministic daily index based on day of year
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const index = dayOfYear % this.quotes.length;
    return this.quotes[index];
  }

  /**
   * Get dynamic motivational quote based on streak milestones or random inspiration
   */
  getQuoteForStreak(streak: number): Quote {
    return this.getDailyQuote(streak);
  }

  /**
   * Get a random alternative quote
   */
  getRandomQuote(excludeId?: string): Quote {
    const candidates = this.quotes.filter((q) => q.id !== excludeId);
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex] || this.quotes[0];
  }

  getAllQuotes(): Quote[] {
    return this.quotes;
  }
}

export default new QuoteService();
