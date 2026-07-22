import React, { createContext, useContext, useState, useEffect } from 'react';
import { SearchCriteria, SearchResultItem } from '../types';
import { SearchService } from '../services/SearchService';
import { useResort } from '../../../shared/contexts/ResortContext';
import { getTodayDateString, getTomorrowDateString } from '../utils/searchUtils';

interface SearchContextType {
  criteria: SearchCriteria;
  results: SearchResultItem[];
  loading: boolean;
  errors: string[];
  hasSearched: boolean;
  setCriteria: (criteria: Partial<SearchCriteria>) => void;
  performSearch: (customCriteria?: SearchCriteria) => Promise<void>;
  resetSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { resort } = useResort();
  const resortId = resort?.id || 'demo_resort';

  const defaultCriteria: SearchCriteria = {
    checkIn: getTodayDateString(),
    checkOut: getTomorrowDateString(),
    adults: 2,
    children: 0,
    babies: 0,
    pets: 0,
  };

  const [criteria, setCriteriaState] = useState<SearchCriteria>(defaultCriteria);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const setCriteria = (newFields: Partial<SearchCriteria>) => {
    setCriteriaState(prev => {
      const updated = { ...prev, ...newFields };
      // Keep dates clean if check-in changes and check-out is now invalid
      if (newFields.checkIn && updated.checkOut <= newFields.checkIn) {
        updated.checkOut = getTomorrowDateString(newFields.checkIn);
      }
      return updated;
    });
  };

  const performSearch = async (customCriteria?: SearchCriteria) => {
    setLoading(true);
    setErrors([]);
    setHasSearched(true);
    
    const searchParams = customCriteria || criteria;

    try {
      const response = await SearchService.search(resortId, searchParams);
      if (response.errors.length > 0) {
        setErrors(response.errors);
        setResults([]);
      } else {
        setResults(response.results);
      }
    } catch (err: any) {
      setErrors([err.message || 'Error de conexión con el motor de búsqueda.']);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setCriteriaState(defaultCriteria);
    setResults([]);
    setErrors([]);
    setHasSearched(false);
  };

  return (
    <SearchContext.Provider
      value={{
        criteria,
        results,
        loading,
        errors,
        hasSearched,
        setCriteria,
        performSearch,
        resetSearch
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
