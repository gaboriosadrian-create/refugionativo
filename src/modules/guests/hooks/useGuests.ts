import { useContext } from 'react';
import { GuestContext } from '../contexts/GuestContext';

export function useGuests() {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuests debe ser utilizado dentro de un GuestProvider');
  }
  return context;
}

export default useGuests;
