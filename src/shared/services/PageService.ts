import { pageRepository } from '../repositories/PageRepository';
import { Page } from '../../types';

export class PageService {
  static async getPages(resortId: string): Promise<Page[]> {
    return pageRepository.getAll(resortId);
  }

  static async savePage(resortId: string, page: Page): Promise<void> {
    await pageRepository.save(resortId, page);
  }
}
export default PageService;
