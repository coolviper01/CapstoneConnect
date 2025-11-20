
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signOut } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export type UserRole = 'adviser' | 'teacher' | 'student' | null;

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  role: UserRole;
  isRoleLoading: boolean;
}

export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  handleSignOut: () => Promise<void>;
}

export interface FirebaseServicesAndUser extends UserAuthState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  handleSignOut: () => Promise<void>;
}

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
    role: null,
    isRoleLoading: true,
  });

  useEffect(() => {
    if (!auth || !firestore) {
      setUserAuthState({
        user: null,
        isUserLoading: false,
        userError: new Error("Auth or Firestore service not provided."),
        role: null,
        isRoleLoading: false,
      });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (firebaseUser) {
          setUserAuthState(prevState => ({ ...prevState, user: firebaseUser, isUserLoading: false, isRoleLoading: true }));
          
          const adviserDoc = await getDoc(doc(firestore, "advisors", firebaseUser.uid));
          if (adviserDoc.exists()) {
            setUserAuthState(prevState => ({ ...prevState, role: 'adviser', isRoleLoading: false }));
            return;
          }
          const teacherDoc = await getDoc(doc(firestore, "teachers", firebaseUser.uid));
          if (teacherDoc.exists()) {
            setUserAuthState(prevState => ({ ...prevState, role: 'teacher', isRoleLoading: false }));
            return;
          }
          const studentDoc = await getDoc(doc(firestore, "students", firebaseUser.uid));
          if (studentDoc.exists()) {
            setUserAuthState(prevState => ({ ...prevState, role: 'student', isRoleLoading: false }));
            return;
          }
          
          // No role found
          setUserAuthState(prevState => ({ ...prevState, role: null, isRoleLoading: false }));
          
        } else {
          setUserAuthState({
            user: null,
            isUserLoading: false,
            userError: null,
            role: null,
            isRoleLoading: false,
          });
        }
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({
          user: null,
          isUserLoading: false,
          userError: error,
          role: null,
          isRoleLoading: false,
        });
      }
    );

    return () => unsubscribe();
  }, [auth, firestore]);

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      ...userAuthState,
      handleSignOut,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser & { role: UserRole, isRoleLoading: boolean } => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
    role: context.role,
    isRoleLoading: context.isRoleLoading,
    handleSignOut: context.handleSignOut,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};

// Add this interface to be imported by FirebaseProvider
export interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}
