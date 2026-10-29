import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  db,
  auth,
  googleProvider,
  testConnection,
  handleFirestoreError,
  cleanForFirestore,
  OperationType,
} from '../lib/firebase';
import {
  Transaction,
  Invoice,
  MitraProfile,
  Contact,
  ActiveTab,
  UserAccount,
} from '../types';
import { getHari } from '../utils/formatters';

const STORAGE_PREFIX = 'pembukuan_mitra_v1_';

export const DEFAULT_REGISTERED_USERS: UserAccount[] = [
  {
    id: 'usr_gordi_default',
    username: 'gordiarafah',
    password: 'arafahgordi',
    namaMitra: 'GORDI ARAFAH',
    whatsapp: '085189186944',
    createdAt: 1789500000000,
  },
  {
    id: 'usr_admin_default',
    username: 'admin',
    password: 'admin',
    namaMitra: 'ADMIN MITRA',
    whatsapp: '085189186944',
    createdAt: 1789500000000,
  },
];

export const DEFAULT_PROFILE: MitraProfile = {
  id: 'mitra-gordi',
  username: '@gordiarafah',
  namaMitra: 'GORDI ARAFAH',
  inisialLogo: 'GA',
  alamat: 'Lubuk Landai Sungai Lilin',
  jenisUsaha: 'Jasa Transfer dan Pulsa',
  tagline: 'Murah - Mudah - Cepat - Praktis',
  noWhatsapp: '085189186944',
  metodeTransfer: `1. Via Tunai / Cash
2. Via Transfer:
A. 553801037985532 (BRI) An Gordi Arafah
B. 085189186944 (DANA) An Gordi Arafah`,
  strukHeader: `GORDI ARAFAH
Lubuk Landai Sungai Lilin
WA: 085189186944`,
  strukFooter: `Terima kasih telah bertransaksi di Mitra Kami
Simpan struk ini sebagai bukti pembayaran yang sah.`,
};

export const DEFAULT_ACCOUNTS = [
  'Bri Mo',
  'Dana',
  'Dana Payment',
  'Dana Payz',
  'Digipos Aja',
  'Modal Bisnis',
  'Sea Bank',
  'Shopeepay',
];

export const DEFAULT_TRANSACTION_TYPES = [
  'Briva',
  'Cicilan Mobil',
  'Cicilan Motor',
  'Dana',
  'Gopay',
  'Minjam Dana',
  'Narik',
  'Ovo',
  'PLN Token',
  'Pulsa',
  'Pulsa Nelpon',
  'Shopeepay',
  'Token Listrik',
  'Top Up Game',
  'Transfer',
  'Voucher',
];

export const DEFAULT_CONTACTS: Contact[] = [];

export const DEFAULT_TRANSACTIONS: Transaction[] = [];

export const DEFAULT_INVOICES: Invoice[] = [];

interface AppContextType {
  profile: MitraProfile;
  updateProfile: (data: Partial<MitraProfile>) => void;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  markTransactionLunas: (id: string) => Promise<void>;
  markCustomerTransactionsLunas: (customerName: string) => Promise<void>;
  invoices: Invoice[];
  addInvoice: (inv: Omit<Invoice, 'id' | 'createdAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, inv: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (
    id: string,
    options?: {
      nomorInvoice?: string;
      customerName?: string;
      deleteRelatedTransactions?: boolean;
      rawTxIds?: string[];
    }
  ) => Promise<void>;
  deletedInvoiceKeys: string[];
  markInvoiceLunas: (id: string) => Promise<void>;
  accounts: string[];
  addAccount: (name: string) => void;
  deleteAccount: (name: string) => void;
  transactionTypes: string[];
  addTransactionType: (name: string) => void;
  deleteTransactionType: (name: string) => void;
  contacts: Contact[];
  addOrUpdateContact: (contact: Omit<Contact, 'id'> & { id?: string }) => void;
  deleteContact: (id: string) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedYear: number;
  setSelectedYear: (y: number) => void;
  selectedMonth: number; // 0-11
  setSelectedMonth: (m: number) => void;
  generateInvoiceNumber: (tanggalStr?: string) => string;
  currentUsername: string;
  setCurrentUsername: (u: string) => void;
  resetToDefaultData: () => void;
  isFirestoreConnected: boolean;
  isAuthenticated: boolean;
  firebaseUser: FirebaseUser | null;
  loginWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  syncNow: () => Promise<void>;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  login: (u: string, p: string) => { success: boolean; message?: string };
  register: (accountData: {
    username: string;
    password: string;
    namaMitra: string;
    whatsapp?: string;
  }) => { success: boolean; message: string };
  registeredUsers: UserAccount[];
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(`${STORAGE_PREFIX}session_auth`) === 'true';
    } catch {
      return false;
    }
  });

  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}registered_users`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return DEFAULT_REGISTERED_USERS;
    } catch {
      return DEFAULT_REGISTERED_USERS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}registered_users`, JSON.stringify(registeredUsers));
    } catch (e) {
      console.error(e);
    }
  }, [registeredUsers]);

  const [currentUsername, setCurrentUsername] = useState('GORDI ARAFAH');
  const userKey = currentUsername.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const [profile, setProfile] = useState<MitraProfile>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}profile_${userKey}`);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const isLegacyDemoId = (id: string) => {
    return /^tx-[1-6]$/.test(id) || /^inv-[1-3]$/.test(id) || /^c[1-6]$/.test(id) || /^tx_inv_/.test(id);
  };

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}transactions_${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: Transaction) => !isLegacyDemoId(t.id));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}invoices_${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((i: Invoice) => !isLegacyDemoId(i.id));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [deletedInvoiceKeys, setDeletedInvoiceKeys] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}deleted_invoices_${userKey}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [accounts, setAccounts] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}accounts_${userKey}`);
      return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  });

  const [transactionTypes, setTransactionTypes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}transaction_types_${userKey}`);
      return saved ? JSON.parse(saved) : DEFAULT_TRANSACTION_TYPES;
    } catch {
      return DEFAULT_TRANSACTION_TYPES;
    }
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}contacts_${userKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((c: Contact) => !isLegacyDemoId(c.id));
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedYear, setSelectedYear] = useState<number>(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth()); // Default otomatis ke bulan sekarang (current month)
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Check connectivity to Cloud Firestore & Auto-authenticate for realtime persistence
  useEffect(() => {
    testConnection().then((connected) => {
      setIsFirestoreConnected(connected);
    });

    if (!auth.currentUser) {
      signInAnonymously(auth).catch((err) => {
        console.warn('Auto anonymous sign-in:', err);
      });
    }
  }, []);

  const ensureAuthenticatedUid = async (): Promise<string> => {
    if (auth.currentUser?.uid) {
      return auth.currentUser.uid;
    }
    try {
      const cred = await signInAnonymously(auth);
      return cred.user.uid;
    } catch (e) {
      console.warn('ensureAuthenticatedUid error, falling back:', e);
      return 'user_default';
    }
  };

  // Listen to Firebase Auth state & attach real-time Firestore synchronization
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setIsAuthenticated(true);
        sessionStorage.setItem(`${STORAGE_PREFIX}session_auth`, 'true');
        if (user.displayName) {
          setCurrentUsername(user.displayName);
        }

        const uid = user.uid;

        // 1. Transactions Real-time Listener (ONLY real inputted transactions)
        const txCol = collection(db, 'users', uid, 'transactions');
        const unsubTx = onSnapshot(
          txCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const allDocs = snapshot.docs.map((d) => d.data() as Transaction);
              // Clean out legacy demo transactions if any were seeded in the past
              const validTxs = allDocs.filter((t) => !isLegacyDemoId(t.id));
              validTxs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
              setTransactions(validTxs);
              setLastSyncTime(new Date());

              // Silently clean up legacy demo documents from cloud
              allDocs.forEach((t) => {
                if (isLegacyDemoId(t.id)) {
                  deleteDoc(doc(db, 'users', uid, 'transactions', t.id)).catch(() => {});
                }
              });
            } else {
              setTransactions([]);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${uid}/transactions`);
          }
        );

        // 2. Invoices Real-time Listener
        const invCol = collection(db, 'users', uid, 'invoices');
        const unsubInv = onSnapshot(
          invCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const allDocs = snapshot.docs.map((d) => d.data() as Invoice);
              const validInvs = allDocs.filter((i) => !isLegacyDemoId(i.id));
              validInvs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
              setInvoices(validInvs);
              setLastSyncTime(new Date());

              allDocs.forEach((i) => {
                if (isLegacyDemoId(i.id)) {
                  deleteDoc(doc(db, 'users', uid, 'invoices', i.id)).catch(() => {});
                }
              });
            } else {
              setInvoices([]);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${uid}/invoices`);
          }
        );

        // 3. Contacts Real-time Listener
        const contactCol = collection(db, 'users', uid, 'contacts');
        const unsubContacts = onSnapshot(
          contactCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const allDocs = snapshot.docs.map((d) => d.data() as Contact);
              const validContacts = allDocs.filter((c) => !isLegacyDemoId(c.id));
              setContacts(validContacts);
              setLastSyncTime(new Date());

              allDocs.forEach((c) => {
                if (isLegacyDemoId(c.id)) {
                  deleteDoc(doc(db, 'users', uid, 'contacts', c.id)).catch(() => {});
                }
              });
            } else {
              setContacts([]);
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${uid}/contacts`);
          }
        );

        // 4. Profile Real-time Listener
        const profileRef = doc(db, 'users', uid, 'profile', 'main');
        const unsubProfile = onSnapshot(
          profileRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setProfile(docSnap.data() as MitraProfile);
              setLastSyncTime(new Date());
            } else {
              setDoc(profileRef, cleanForFirestore({ ...profile, userId: uid })).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `users/${uid}/profile/main`)
              );
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${uid}/profile/main`);
          }
        );

        // 5. Settings Real-time Listener
        const settingsRef = doc(db, 'users', uid, 'settings', 'main');
        const unsubSettings = onSnapshot(
          settingsRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              if (Array.isArray(data.accounts)) setAccounts(data.accounts);
              if (Array.isArray(data.transactionTypes)) setTransactionTypes(data.transactionTypes);
              if (Array.isArray(data.deletedInvoiceKeys)) setDeletedInvoiceKeys(data.deletedInvoiceKeys);
              setLastSyncTime(new Date());
            } else {
              setDoc(settingsRef, cleanForFirestore({
                id: 'main',
                userId: uid,
                accounts,
                transactionTypes,
                deletedInvoiceKeys,
              })).catch((err) =>
                handleFirestoreError(err, OperationType.WRITE, `users/${uid}/settings/main`)
              );
            }
          },
          (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${uid}/settings/main`);
          }
        );

        return () => {
          unsubTx();
          unsubInv();
          unsubContacts();
          unsubProfile();
          unsubSettings();
        };
      } else {
        setFirebaseUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}profile_${userKey}`, JSON.stringify(profile));
    } catch (e) {
      console.error(e);
    }
  }, [profile, userKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}transactions_${userKey}`, JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions, userKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}invoices_${userKey}`, JSON.stringify(invoices));
    } catch (e) {
      console.error(e);
    }
  }, [invoices, userKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}accounts_${userKey}`, JSON.stringify(accounts));
    } catch (e) {
      console.error(e);
    }
  }, [accounts, userKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}transaction_types_${userKey}`, JSON.stringify(transactionTypes));
    } catch (e) {
      console.error(e);
    }
  }, [transactionTypes, userKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}contacts_${userKey}`, JSON.stringify(contacts));
    } catch (e) {
      console.error(e);
    }
  }, [contacts, userKey]);

  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}deleted_invoices_${userKey}`, JSON.stringify(deletedInvoiceKeys));
    } catch (e) {
      console.error(e);
    }
  }, [deletedInvoiceKeys, userKey]);

  const login = (usernameInput: string, passwordInput: string): { success: boolean; message?: string } => {
    const cleanUser = usernameInput.trim().toLowerCase().replace(/^@/, '');
    const cleanPass = passwordInput.trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'Username dan Password wajib diisi!' };
    }

    const matchedUser = registeredUsers.find(
      (u) => u.username.toLowerCase() === cleanUser && u.password === cleanPass
    );

    const isDefaultGordi =
      (cleanUser === 'gordiarafah' || cleanUser === 'gordi') &&
      (cleanPass === 'arafahgordi' || cleanPass === 'admin');

    if (matchedUser || isDefaultGordi) {
      setIsAuthenticated(true);
      const activeMitra = matchedUser ? matchedUser.namaMitra : 'GORDI ARAFAH';
      setCurrentUsername(activeMitra);

      if (matchedUser) {
        setProfile((prev) => ({
          ...prev,
          namaMitra: matchedUser.namaMitra,
          username: `@${matchedUser.username}`,
          noWhatsapp: matchedUser.whatsapp || prev.noWhatsapp,
          inisialLogo: matchedUser.namaMitra.slice(0, 2).toUpperCase(),
        }));
      }

      try {
        sessionStorage.setItem(`${STORAGE_PREFIX}session_auth`, 'true');
        sessionStorage.setItem(`${STORAGE_PREFIX}logged_username`, cleanUser);
      } catch (e) {
        console.error(e);
      }
      return { success: true };
    }

    return {
      success: false,
      message: 'Username atau Password salah! Periksa kembali atau daftar akun baru.',
    };
  };

  const register = (accountData: {
    username: string;
    password: string;
    namaMitra: string;
    whatsapp?: string;
  }): { success: boolean; message: string } => {
    const cleanUser = accountData.username.trim().toLowerCase().replace(/^@/, '');
    const cleanPass = accountData.password.trim();
    const cleanMitra = accountData.namaMitra.trim().toUpperCase();
    const cleanWA = accountData.whatsapp?.trim() || '';

    if (cleanUser.length < 3) {
      return { success: false, message: 'Username minimal 3 karakter.' };
    }
    if (/\s/.test(cleanUser)) {
      return { success: false, message: 'Username tidak boleh mengandung spasi.' };
    }
    if (!cleanMitra) {
      return { success: false, message: 'Nama Mitra atau Nama Lengkap wajib diisi.' };
    }
    if (cleanPass.length < 4) {
      return { success: false, message: 'Password minimal 4 karakter.' };
    }

    const exists = registeredUsers.some((u) => u.username.toLowerCase() === cleanUser);
    if (exists) {
      return {
        success: false,
        message: `Username "${cleanUser}" sudah terdaftar. Silakan pilih username lain atau masuk ke akun Anda.`,
      };
    }

    const newUser: UserAccount = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: cleanUser,
      password: cleanPass,
      namaMitra: cleanMitra,
      whatsapp: cleanWA,
      createdAt: Date.now(),
    };

    setRegisteredUsers((prev) => [newUser, ...prev]);

    return {
      success: true,
      message: `Pendaftaran berhasil! Akun "${cleanUser}" siap digunakan. Silakan masuk.`,
    };
  };

  const logout = async () => {
    setIsAuthenticated(false);
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    setFirebaseUser(null);
    try {
      sessionStorage.removeItem(`${STORAGE_PREFIX}session_auth`);
      sessionStorage.removeItem(`${STORAGE_PREFIX}logged_username`);
    } catch (e) {
      console.error(e);
    }
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsSyncing(true);
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        setFirebaseUser(result.user);
        setIsAuthenticated(true);
        sessionStorage.setItem(`${STORAGE_PREFIX}session_auth`, 'true');
        if (result.user.displayName) {
          setCurrentUsername(result.user.displayName);
        }
        return { success: true };
      }
      return { success: false, message: 'Login Google dibatalkan.' };
    } catch (err: unknown) {
      console.error('Google Sign In error:', err);
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Gagal masuk dengan Google.',
      };
    } finally {
      setIsSyncing(false);
    }
  };

  const updateProfile = (data: Partial<MitraProfile>) => {
    setProfile((prev) => {
      const merged = { ...prev, ...data };
      if (firebaseUser) {
        setDoc(doc(db, 'users', firebaseUser.uid, 'profile', 'main'), {
          ...merged,
          userId: firebaseUser.uid,
        }, { merge: true }).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/profile/main`)
        );
      }
      return merged;
    });
  };

  const addTransaction = async (txData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
    const hari = txData.hari || getHari(txData.tanggal);
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      hari,
      createdAt: Date.now(),
    };

    // Optimistically update local state
    setTransactions((prev) => [newTx, ...prev]);

    const uid = await ensureAuthenticatedUid();

    // 1. Direct write to Firestore transactions collection
    try {
      await setDoc(doc(db, 'users', uid, 'transactions', newTx.id), cleanForFirestore({
        ...newTx,
        userId: uid,
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/transactions/${newTx.id}`);
    }

    // 2. Auto update contacts count in Firestore
    if (txData.nama) {
      const cleanCustomer = txData.nama.trim().toUpperCase();
      const existing = contacts.find((c) => c.nama.trim().toUpperCase() === cleanCustomer);
      if (existing) {
        const updatedContact = { ...existing, totalTransaksi: (existing.totalTransaksi || 0) + 1 };
        setContacts((prev) => prev.map((c) => (c.id === existing.id ? updatedContact : c)));
        try {
          await setDoc(
            doc(db, 'users', uid, 'contacts', existing.id),
            cleanForFirestore({
              ...updatedContact,
              userId: uid,
            }),
            { merge: true }
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/contacts/${existing.id}`);
        }
      } else {
        const newContact: Contact = {
          id: `c_${Date.now()}`,
          nama: cleanCustomer,
          whatsapp: '',
          totalTransaksi: 1,
        };
        setContacts((prev) => [...prev, newContact]);
        try {
          await setDoc(doc(db, 'users', uid, 'contacts', newContact.id), cleanForFirestore({
            ...newContact,
            userId: uid,
          }));
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `users/${uid}/contacts/${newContact.id}`);
        }
      }
    }

    return newTx;
  };

  const updateTransaction = async (id: string, updateData: Partial<Transaction>): Promise<void> => {
    const merged = { ...updateData };
    if (updateData.tanggal) {
      merged.hari = getHari(updateData.tanggal);
    }

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...merged } : t))
    );

    const uid = await ensureAuthenticatedUid();
    try {
      await updateDoc(doc(db, 'users', uid, 'transactions', id), cleanForFirestore({
        ...merged,
        userId: uid,
      }));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/transactions/${id}`);
    }
  };

  const deleteTransaction = async (id: string): Promise<void> => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    const uid = await ensureAuthenticatedUid();
    try {
      await deleteDoc(doc(db, 'users', uid, 'transactions', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/transactions/${id}`);
    }
  };

  const markTransactionLunas = async (id: string): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    const uid = await ensureAuthenticatedUid();

    const targetTx = transactions.find((t) => t.id === id);
    const txCustomer = targetTx ? targetTx.nama.trim().toUpperCase() : '';

    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'Lunas', tanggalBayar: today } : t))
    );

    try {
      await updateDoc(doc(db, 'users', uid, 'transactions', id), cleanForFirestore({
        status: 'Lunas',
        tanggalBayar: today,
        userId: uid,
      }));

      if (txCustomer) {
        const remainingUnpaid = transactions.filter(
          (t) => t.id !== id && t.nama.trim().toUpperCase() === txCustomer && t.status === 'Belum Bayar'
        );
        if (remainingUnpaid.length === 0) {
          const matchingInvoices = invoices.filter(
            (inv) => inv.customer.trim().toUpperCase() === txCustomer && inv.status === 'Belum'
          );
          setInvoices((prevInv) =>
            prevInv.map((inv) =>
              inv.customer.trim().toUpperCase() === txCustomer && inv.status === 'Belum'
                ? { ...inv, status: 'Lunas' }
                : inv
            )
          );
          for (const inv of matchingInvoices) {
            await updateDoc(doc(db, 'users', uid, 'invoices', inv.id), cleanForFirestore({
              status: 'Lunas',
            })).catch((err) => console.warn('Invoice sync update error:', err));
          }
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/transactions/${id}`);
    }
  };

  const markCustomerTransactionsLunas = async (customerName: string): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    const targetName = customerName.trim().toUpperCase();
    const uid = await ensureAuthenticatedUid();

    // 1. Lunaskan di state lokal
    setTransactions((prev) =>
      prev.map((t) =>
        t.nama.trim().toUpperCase() === targetName && t.status === 'Belum Bayar'
          ? { ...t, status: 'Lunas', tanggalBayar: today }
          : t
      )
    );

    setInvoices((prev) =>
      prev.map((inv) =>
        inv.customer.trim().toUpperCase() === targetName && inv.status === 'Belum'
          ? { ...inv, status: 'Lunas' }
          : inv
      )
    );

    // 2. Commit batch ke Firestore
    const unpaidTxs = transactions.filter(
      (t) => t.nama.trim().toUpperCase() === targetName && t.status === 'Belum Bayar'
    );
    const unpaidInvs = invoices.filter(
      (inv) => inv.customer.trim().toUpperCase() === targetName && inv.status === 'Belum'
    );

    if (unpaidTxs.length > 0 || unpaidInvs.length > 0) {
      const batch = writeBatch(db);
      unpaidTxs.forEach((tx) => {
        batch.update(doc(db, 'users', uid, 'transactions', tx.id), cleanForFirestore({
          status: 'Lunas',
          tanggalBayar: today,
        }));
      });
      unpaidInvs.forEach((inv) => {
        batch.update(doc(db, 'users', uid, 'invoices', inv.id), cleanForFirestore({
          status: 'Lunas',
        }));
      });
      try {
        await batch.commit();
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/transactions (batch lunas)`);
      }
    }
  };

  const generateInvoiceNumber = (tanggalStr?: string): string => {
    const date = tanggalStr ? new Date(tanggalStr) : new Date();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const prefix = `INV-${mm}${yyyy}-`;

    let maxSeq = 0;
    invoices.forEach((inv) => {
      if (inv.nomorInvoice && inv.nomorInvoice.startsWith(prefix)) {
        const seqPart = inv.nomorInvoice.substring(prefix.length);
        const seqNum = parseInt(seqPart, 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }
    });

    const nextSeq = String(maxSeq + 1).padStart(3, '0');
    return `${prefix}${nextSeq}`;
  };

  const addInvoice = async (invData: Omit<Invoice, 'id' | 'createdAt'>): Promise<Invoice> => {
    const newInvoice: Invoice = {
      ...invData,
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };
    setInvoices((prev) => [newInvoice, ...prev]);

    // Save/update customer contact
    if (invData.customer) {
      setContacts((prev) => {
        const existing = prev.find((c) => c.nama.trim().toUpperCase() === invData.customer.trim().toUpperCase());
        if (existing) {
          return prev.map((c) =>
            c.id === existing.id
              ? { ...c, whatsapp: invData.whatsapp || c.whatsapp, totalTransaksi: (c.totalTransaksi || 0) + 1 }
              : c
          );
        } else {
          return [
            ...prev,
            {
              id: `c_${Date.now()}`,
              nama: invData.customer.trim().toUpperCase(),
              whatsapp: invData.whatsapp || '',
              totalTransaksi: 1,
            },
          ];
        }
      });
    }

    // Unhide customer if a new invoice is explicitly added
    if (invData.customer) {
      const custKey = `cust_${invData.customer.trim().toUpperCase()}`;
      setDeletedInvoiceKeys((prev) =>
        prev.filter((k) => k !== custKey && k !== newInvoice.nomorInvoice && k !== newInvoice.id)
      );
    }

    const uid = await ensureAuthenticatedUid();
    setDoc(doc(db, 'users', uid, 'invoices', newInvoice.id), cleanForFirestore({
      ...newInvoice,
      userId: uid,
    })).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `users/${uid}/invoices/${newInvoice.id}`)
    );

    return newInvoice;
  };

  const updateInvoice = async (id: string, updateData: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...updateData } : i)));
    const uid = await ensureAuthenticatedUid();
    updateDoc(doc(db, 'users', uid, 'invoices', id), cleanForFirestore(updateData)).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/invoices/${id}`)
    );
  };

  const deleteInvoice = async (
    id: string,
    options?: {
      nomorInvoice?: string;
      customerName?: string;
      deleteRelatedTransactions?: boolean;
      rawTxIds?: string[];
    }
  ) => {
    // 1. Remove from invoices state
    setInvoices((prev) =>
      prev.filter(
        (i) =>
          i.id !== id &&
          (!options?.nomorInvoice || i.nomorInvoice !== options.nomorInvoice)
      )
    );

    // 2. Track in deletedInvoiceKeys so any synchronized list hides it
    const keysToAdd = [id];
    if (options?.nomorInvoice) keysToAdd.push(options.nomorInvoice);
    if (options?.customerName) {
      keysToAdd.push(`cust_${options.customerName.trim().toUpperCase()}`);
    }
    const updatedDeletedKeys = Array.from(new Set([...deletedInvoiceKeys, ...keysToAdd]));
    setDeletedInvoiceKeys(updatedDeletedKeys);

    const uid = await ensureAuthenticatedUid();
    try {
      await deleteDoc(doc(db, 'users', uid, 'invoices', id));
      await setDoc(
        doc(db, 'users', uid, 'settings', 'main'),
        cleanForFirestore({ deletedInvoiceKeys: updatedDeletedKeys, userId: uid }),
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/invoices/${id}`);
    }

    // 3. If requested, also remove related unpaid transactions
    if (options?.deleteRelatedTransactions) {
      if (options.rawTxIds && options.rawTxIds.length > 0) {
        const idSet = new Set(options.rawTxIds);
        setTransactions((prev) => prev.filter((t) => !idSet.has(t.id)));
        options.rawTxIds.forEach((txId) => {
          deleteDoc(doc(db, 'users', uid, 'transactions', txId)).catch((err) =>
            handleFirestoreError(err, OperationType.DELETE, `users/${uid}/transactions/${txId}`)
          );
        });
      } else if (options.customerName) {
        const targetName = options.customerName.trim().toUpperCase();
        setTransactions((prev) =>
          prev.filter(
            (t) => !(t.nama.trim().toUpperCase() === targetName && t.status === 'Belum Bayar')
          )
        );
      }
    }
  };

  const markInvoiceLunas = async (id: string) => {
    let customerName = '';
    const targetInvoice = invoices.find((i) => i.id === id);
    if (targetInvoice) {
      customerName = targetInvoice.customer;
    } else if (id.startsWith('synced_inv_')) {
      customerName = id.replace('synced_inv_', '');
    }

    const uid = await ensureAuthenticatedUid();

    // 1. Perbarui status invoice di state invoices menjadi Lunas
    setInvoices((prev) => {
      const match = prev.find(
        (i) =>
          i.id === id ||
          (customerName &&
            i.customer.trim().toUpperCase() === customerName.trim().toUpperCase() &&
            i.status === 'Belum')
      );
      if (match) {
        const updated = prev.map((i) =>
          i.id === match.id || (customerName && i.customer.trim().toUpperCase() === customerName.trim().toUpperCase())
            ? { ...i, status: 'Lunas' as const }
            : i
        );
        if (match.id && !match.id.startsWith('synced_inv_')) {
          updateDoc(doc(db, 'users', uid, 'invoices', match.id), cleanForFirestore({ status: 'Lunas' })).catch(
            (err) => handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/invoices/${match.id}`)
          );
        }
        return updated;
      }
      return prev;
    });

    // 2. Sinkronkan ke Fitur Belum Bayar: Lunaskan semua transaksi berstatus Belum Bayar untuk pelanggan ini
    if (customerName) {
      const today = new Date().toISOString().split('T')[0];
      const targetName = customerName.trim().toUpperCase();
      setTransactions((prev) =>
        prev.map((tx) => {
          if (tx.nama.trim().toUpperCase() === targetName && tx.status === 'Belum Bayar') {
            const updatedTx = { ...tx, status: 'Lunas' as const, tanggalBayar: today };
            updateDoc(doc(db, 'users', uid, 'transactions', tx.id), cleanForFirestore({
              status: 'Lunas',
              tanggalBayar: today,
            })).catch((err) =>
              handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/transactions/${tx.id}`)
            );
            return updatedTx;
          }
          return tx;
        })
      );
    }
  };

  const addAccount = async (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !accounts.includes(trimmed)) {
      const updated = [...accounts, trimmed].sort();
      setAccounts(updated);
      const uid = await ensureAuthenticatedUid();
      setDoc(
        doc(db, 'users', uid, 'settings', 'main'),
        cleanForFirestore({ accounts: updated, userId: uid }),
        { merge: true }
      ).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/settings/main`)
      );
    }
  };

  const deleteAccount = async (name: string) => {
    const updated = accounts.filter((a) => a !== name);
    setAccounts(updated);
    const uid = await ensureAuthenticatedUid();
    setDoc(
      doc(db, 'users', uid, 'settings', 'main'),
      cleanForFirestore({ accounts: updated, userId: uid }),
      { merge: true }
    ).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}/settings/main`)
    );
  };

  const addTransactionType = async (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !transactionTypes.includes(trimmed)) {
      const updated = [...transactionTypes, trimmed].sort();
      setTransactionTypes(updated);
      const uid = await ensureAuthenticatedUid();
      setDoc(
        doc(db, 'users', uid, 'settings', 'main'),
        cleanForFirestore({ transactionTypes: updated, userId: uid }),
        { merge: true }
      ).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}/settings/main`)
      );
    }
  };

  const deleteTransactionType = async (name: string) => {
    const updated = transactionTypes.filter((t) => t !== name);
    setTransactionTypes(updated);
    const uid = await ensureAuthenticatedUid();
    setDoc(
      doc(db, 'users', uid, 'settings', 'main'),
      cleanForFirestore({ transactionTypes: updated, userId: uid }),
      { merge: true }
    ).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}/settings/main`)
    );
  };

  const addOrUpdateContact = async (contact: Omit<Contact, 'id'> & { id?: string }) => {
    const uid = await ensureAuthenticatedUid();
    setContacts((prev) => {
      if (contact.id) {
        const updated = prev.map((c) => (c.id === contact.id ? { ...c, ...contact } : c));
        setDoc(
          doc(db, 'users', uid, 'contacts', contact.id),
          cleanForFirestore({ ...contact, id: contact.id, userId: uid }),
          { merge: true }
        ).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, `users/${uid}/contacts/${contact.id}`)
        );
        return updated;
      } else {
        const newContact: Contact = {
          id: `c_${Date.now()}`,
          nama: contact.nama.trim().toUpperCase(),
          whatsapp: contact.whatsapp.trim(),
          totalTransaksi: contact.totalTransaksi || 0,
        };
        setDoc(doc(db, 'users', uid, 'contacts', newContact.id), cleanForFirestore({
          ...newContact,
          userId: uid,
        })).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, `users/${uid}/contacts/${newContact.id}`)
        );
        return [...prev, newContact];
      }
    });
  };

  const deleteContact = async (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    const uid = await ensureAuthenticatedUid();
    deleteDoc(doc(db, 'users', uid, 'contacts', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `users/${uid}/contacts/${id}`)
    );
  };

  const syncNow = async () => {
    const uid = await ensureAuthenticatedUid();
    try {
      setIsSyncing(true);
      const batch = writeBatch(db);

      // 1. Profile
      batch.set(doc(db, 'users', uid, 'profile', 'main'), cleanForFirestore({ ...profile, userId: uid }), { merge: true });

      // 2. Settings
      batch.set(
        doc(db, 'users', uid, 'settings', 'main'),
        cleanForFirestore({ id: 'main', userId: uid, accounts, transactionTypes, deletedInvoiceKeys }),
        { merge: true }
      );

      // 3. Transactions
      transactions.forEach((tx) => {
        batch.set(doc(db, 'users', uid, 'transactions', tx.id), cleanForFirestore({ ...tx, userId: uid }), { merge: true });
      });

      // 4. Invoices
      invoices.forEach((inv) => {
        batch.set(doc(db, 'users', uid, 'invoices', inv.id), cleanForFirestore({ ...inv, userId: uid }), { merge: true });
      });

      // 5. Contacts
      contacts.forEach((c) => {
        batch.set(doc(db, 'users', uid, 'contacts', c.id), cleanForFirestore({ ...c, userId: uid }), { merge: true });
      });

      await batch.commit();
      setLastSyncTime(new Date());
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}/batch_sync`);
    } finally {
      setIsSyncing(false);
    }
  };

  const resetToDefaultData = () => {
    setProfile(DEFAULT_PROFILE);
    setAccounts(DEFAULT_ACCOUNTS);
    setTransactionTypes(DEFAULT_TRANSACTION_TYPES);
    setContacts(DEFAULT_CONTACTS);
    setTransactions(DEFAULT_TRANSACTIONS);
    setInvoices(DEFAULT_INVOICES);
    setDeletedInvoiceKeys([]);
    try {
      localStorage.removeItem(`${STORAGE_PREFIX}profile_${userKey}`);
      localStorage.removeItem(`${STORAGE_PREFIX}transactions_${userKey}`);
      localStorage.removeItem(`${STORAGE_PREFIX}invoices_${userKey}`);
      localStorage.removeItem(`${STORAGE_PREFIX}deleted_invoices_${userKey}`);
      localStorage.removeItem(`${STORAGE_PREFIX}accounts_${userKey}`);
      localStorage.removeItem(`${STORAGE_PREFIX}transaction_types_${userKey}`);
      localStorage.removeItem(`${STORAGE_PREFIX}contacts_${userKey}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        profile,
        updateProfile,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        markTransactionLunas,
        markCustomerTransactionsLunas,
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        deletedInvoiceKeys,
        markInvoiceLunas,
        accounts,
        addAccount,
        deleteAccount,
        transactionTypes,
        addTransactionType,
        deleteTransactionType,
        contacts,
        addOrUpdateContact,
        deleteContact,
        activeTab,
        setActiveTab,
        selectedYear,
        setSelectedYear,
        selectedMonth,
        setSelectedMonth,
        generateInvoiceNumber,
        currentUsername,
        setCurrentUsername,
        resetToDefaultData,
        isFirestoreConnected,
        isAuthenticated,
        firebaseUser,
        loginWithGoogle,
        syncNow,
        isSyncing,
        lastSyncTime,
        login,
        logout,
        register,
        registeredUsers,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
