import React, { createContext, useContext, useState, useEffect } from 'react';
import { Resort } from '../../types';
import { ResortService } from '../services/ResortService';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { FirestoreSeedService } from '../services/FirestoreSeedService';

interface ResortContextType {
  resort: Resort | null;
  userResorts: { resort: Resort; role: string }[];
  loading: boolean;
  changeResort: (resortId: string) => Promise<void>;
  reloadUserResorts: () => Promise<void>;
}

const ResortContext = createContext<ResortContextType | undefined>(undefined);

export const ResortProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setRoleForResort } = useAuth();
  const [resort, setResort] = useState<Resort | null>(null);
  const [userResorts, setUserResorts] = useState<{ resort: Resort; role: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const loadResortData = async () => {
    setLoading(true);
    try {
      // Ensure all fallback structures are idempotently seeded first
      await FirestoreSeedService.seedAllDefaultResorts();
    } catch (seedErr) {
      console.warn('[SEED] Error during startup seeding:', seedErr);
    }

    if (!user) {
      // Public website default fallback resort
      try {
        const defaultResort = await ResortService.getResort('patagonia-refugio');
        setResort(defaultResort);
      } catch (err) {
        console.error('Error loading default resort:', err);
      }
      setUserResorts([]);
      setLoading(false);
      return;
    }

    try {
      const list = await ResortService.getResortsForUser(user.uid);
      setUserResorts(list);
      if (list.length > 0) {
        // Default to first resort
        setResort(list[0].resort);
        await setRoleForResort(list[0].resort.id);
      } else {
        setResort(null);
      }
    } catch (err) {
      console.error('Error loading resort data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResortData();
  }, [user]);

  const changeResort = async (resortId: string) => {
    setLoading(true);
    try {
      const selected = await ResortService.getResort(resortId);
      if (selected) {
        setResort(selected);
        await setRoleForResort(resortId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const reloadUserResorts = async () => {
    if (user) {
      const list = await ResortService.getResortsForUser(user.uid);
      setUserResorts(list);
    }
  };

  return (
    <ResortContext.Provider value={{ resort, userResorts, loading, changeResort, reloadUserResorts }}>
      {children}
    </ResortContext.Provider>
  );
};

export const useResort = () => {
  const ctx = useContext(ResortContext);
  if (!ctx) throw new Error('useResort must be used inside ResortProvider');
  return ctx;
};
export default ResortContext;
