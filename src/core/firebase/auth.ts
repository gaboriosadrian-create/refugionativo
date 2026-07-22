import { auth } from './firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { Logger } from '../logger/Logger';

export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    Logger.info(`Usuario inició sesión exitosamente: ${result.user.email}`);
    return result.user;
  } catch (error) {
    Logger.error('Error durante el inicio de sesión con Google:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    Logger.info('Usuario cerró sesión exitosamente');
  } catch (error) {
    Logger.error('Error durante el cierre de sesión:', error);
    throw error;
  }
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
