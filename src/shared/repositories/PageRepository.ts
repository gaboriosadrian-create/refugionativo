import { BaseRepository } from '../../core/repositories/BaseRepository';
import { Page } from '../../types';

export class PageRepository extends BaseRepository<Page> {
  constructor() {
    super('pages');
  }
}
export const pageRepository = new PageRepository();
