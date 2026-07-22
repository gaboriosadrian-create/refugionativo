import { CustomerSuccessDb } from './CustomerSuccessDb';
import { HelpArticle } from '../types';

export class HelpCenterService {
  /**
   * Retrieves all help articles.
   */
  public static getArticles(): HelpArticle[] {
    return CustomerSuccessDb.getAll<HelpArticle>('helpArticles');
  }

  /**
   * Performs an intelligent local search over title, tags, content, and category.
   */
  public static searchArticles(query: string, language: string = 'es'): HelpArticle[] {
    const articles = this.getArticles().filter(a => a.language === language && a.status === 'published');
    if (!query || query.trim() === '') {
      return articles;
    }

    const term = query.toLowerCase().trim();
    return articles.filter(art => {
      const titleMatch = art.title.toLowerCase().includes(term);
      const contentMatch = art.content.toLowerCase().includes(term);
      const categoryMatch = art.category.toLowerCase().includes(term);
      const tagsMatch = art.tags.some(tag => tag.toLowerCase().includes(term));
      return titleMatch || contentMatch || categoryMatch || tagsMatch;
    });
  }

  /**
   * Retrieves list of categories available.
   */
  public static getCategories(language: string = 'es'): string[] {
    const articles = this.getArticles().filter(a => a.language === language && a.status === 'published');
    const categories = new Set<string>();
    articles.forEach(a => categories.add(a.category));
    return Array.from(categories);
  }

  /**
   * Increases the helpfulness count of an article.
   */
  public static voteHelpful(id: string, helpful: boolean): void {
    const articles = this.getArticles();
    const updated = articles.map(art => {
      if (art.id === id) {
        return {
          ...art,
          helpfulCount: helpful ? art.helpfulCount + 1 : art.helpfulCount,
          unhelpfulCount: !helpful ? art.unhelpfulCount + 1 : art.unhelpfulCount
        };
      }
      return art;
    });
    CustomerSuccessDb.setAll('helpArticles', updated);
    
    // Sync to knowledgeBase too
    const kb = CustomerSuccessDb.getAll<any>('knowledgeBase');
    const updatedKb = kb.map(art => {
      if (art.id === id) {
        return {
          ...art,
          helpfulCount: helpful ? art.helpfulCount + 1 : art.helpfulCount,
          unhelpfulCount: !helpful ? art.unhelpfulCount + 1 : art.unhelpfulCount
        };
      }
      return art;
    });
    CustomerSuccessDb.setAll('knowledgeBase', updatedKb);
  }

  /**
   * Increments the article view counter.
   */
  public static incrementViews(id: string): void {
    const articles = this.getArticles();
    const updated = articles.map(art => {
      if (art.id === id) {
        return { ...art, views: art.views + 1 };
      }
      return art;
    });
    CustomerSuccessDb.setAll('helpArticles', updated);
  }

  /**
   * Get FAQs.
   */
  public static getFAQs(language: string = 'es'): HelpArticle[] {
    return this.getArticles().filter(art => art.language === language && art.faq && art.status === 'published');
  }
}
