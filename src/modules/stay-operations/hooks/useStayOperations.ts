import { useContext } from 'react';
import { StayOperationsContext } from '../contexts/StayOperationsContext';

export const useStayOperations = () => {
  const context = useContext(StayOperationsContext);
  if (context === undefined) {
    throw new Error('useStayOperations debe ser utilizado dentro de un StayOperationsProvider');
  }
  return context;
};

export default useStayOperations;
