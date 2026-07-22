import { useSearch as useSearchContext } from '../contexts/SearchContext';

export function useSearch() {
  return useSearchContext();
}

export default useSearch;
