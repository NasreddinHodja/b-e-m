import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc
} from 'firebase/firestore';
import type { Backend, DiarioEntry, NewDiarioEntry } from './types';

// Firebase web config is public by design; access is enforced by Firestore security rules.
const config = {
  apiKey: 'AIzaSyC1gz3lEuKhnd_TvXUNNIYRq8HEzdxtVGw',
  authDomain: 'b-e-m-2b022.firebaseapp.com',
  projectId: 'b-e-m-2b022',
  storageBucket: 'b-e-m-2b022.firebasestorage.app',
  messagingSenderId: '915349324107',
  appId: '1:915349324107:web:43491b00674b5d8b1c28ce'
};

export function createFirebaseBackend(): Backend {
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const diario = (uid: string) => collection(db, `users/${uid}/diario`);

  return {
    auth: {
      onChange: (cb) =>
        onAuthStateChanged(auth, (u) => cb(u ? { uid: u.uid, email: u.email } : null)),
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
      },
      signOut: () => signOut(auth)
    },
    diario: {
      async list(uid) {
        const snap = await getDocs(query(diario(uid), orderBy('timestamp', 'desc')));
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as DiarioEntry);
      },
      async add(uid, entry: NewDiarioEntry) {
        const ref = await addDoc(diario(uid), entry);
        return { id: ref.id, ...entry };
      },
      async remove(uid, id) {
        await deleteDoc(doc(diario(uid), id));
      }
    },
    stats: {
      async save(uid, stats) {
        await setDoc(doc(db, `users/${uid}/stats`, 'current'), stats, { merge: true });
      }
    }
  };
}
