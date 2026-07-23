import { auth } from './firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { Logger } from '../logger/Logger';

export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    Logger.info(`Usuario inició sesión exitosamente con Google: ${result.user.email}`);
    return result.user;
  } catch (error) {
    Logger.error('Error durante el inicio de sesión con Google:', error);
    throw error;
  }
};

export const loginWithEmailAndPassword = async (email: string, pass: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    Logger.info(`Usuario inició sesión exitosamente con Email: ${result.user.email}`);
    return result.user;
  } catch (error) {
    Logger.error('Error durante el inicio de sesión con Email:', error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
    Logger.info(`Correo de recuperación de contraseña enviado a: ${email}`);
  } catch (error) {
    Logger.error('Error al enviar correo de recuperación de contraseña:', error);
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

export const getFirebaseAuthErrorMessage = (error: any): string => {
  if (!error) return 'Ocurrió un error inesperado al autenticar.';
  const code = error.code || error.message || '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Credenciales inválidas. Verifica tu correo y contraseña.';
    case 'auth/user-not-found':
      return 'No existe una cuenta registrada con este correo electrónico.';
    case 'auth/user-disabled':
      return 'Esta cuenta de usuario ha sido deshabilitada por el administrador.';
    case 'auth/too-many-requests':
      return 'Acceso bloqueado temporalmente por demasiados intentos fallidos. Por favor, reintenta más tarde.';
    case 'auth/invalid-email':
      return 'El formato del correo electrónico ingresado no es válido.';
    case 'auth/email-already-in-use':
      return 'Este correo electrónico ya se encuentra registrado.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/network-request-failed':
      return 'Error de conexión a internet. Por favor verifica tu red e inténtalo nuevamente.';
    default:
      return error.message || 'Error al conectar con el servidor de autenticación.';
  }
};

