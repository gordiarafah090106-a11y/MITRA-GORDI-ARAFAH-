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

export const DEFAULT_CONTACTS: Contact[] = [
  { id: 'c1', nama: 'DIQFHAN AMALDI IS', whatsapp: '082256978421', totalTransaksi: 3 },
  { id: 'c2', nama: 'GORDI ARAFAH', whatsapp: '085189186944', totalTransaksi: 4 },
  { id: 'c3', nama: 'Neil Ouraroh', whatsapp: '081274413422', totalTransaksi: 1 },
  { id: 'c4', nama: 'AHMAD', whatsapp: '0855554343525', totalTransaksi: 2 },
  { id: 'c5', nama: 'MUHAMMAD', whatsapp: '081377889900', totalTransaksi: 2 },
  { id: 'c6', nama: 'AQROM', whatsapp: '081234567890', totalTransaksi: 1 },
];

export const DEFAULT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    tanggal: '2026-09-14',
    hari: 'Senin',
    nama: 'AHMAD',
    akun: 'Dana Payment',
    jenisTransaksi: 'PLN Token',
    bayar: 25000,
    laba: 5000,
    status: 'Lunas',
    tanggalBayar: '2026-09-14',
    createdAt: 1789370000000,
  },
  {
    id: 'tx-2',
    tanggal: '2026-09-14',
    hari: 'Senin',
    nama: 'DIQFHAN AMALDI IS',
    akun: 'Bri Mo',
    jenisTransaksi: 'Pulsa',
    bayar: 15000,
    laba: 5000,
    status: 'Lunas',
    tanggalBayar: '2026-09-14',
    createdAt: 1789370500000,
  },
  {
    id: 'tx-3',
    tanggal: '2026-09-16',
    hari: 'Rabu',
    nama: 'AQROM',
    akun: 'Dana Payz',
    jenisTransaksi: 'Gopay',
    bayar: 255000,
    laba: 5000,
    status: 'Belum Bayar',
    createdAt: 1789540000000,
  },
  {
    id: 'tx-4',
    tanggal: '2026-09-16',
    hari: 'Rabu',
    nama: 'DIQFHAN AMALDI',
    akun: 'Shopeepay',
    jenisTransaksi: 'Dana',
    bayar: 305000,
    laba: 5000,
    status: 'Belum Bayar',
    createdAt: 1789540500000,
  },
  {
    id: 'tx-5',
    tanggal: '2026-09-16',
    hari: 'Rabu',
    nama: 'MUHAMMAD',
    akun: 'Bri Mo',
    jenisTransaksi: 'Dana',
    bayar: 155000,
    laba: 5000,
    status: 'Belum Bayar',
    createdAt: 1789541000000,
  },
  {
    id: 'tx-6',
    tanggal: '2026-09-16',
    hari: 'Rabu',
    nama: 'MUHAMMAD',
    akun: 'Bri Mo',
    jenisTransaksi: 'Cicilan Mobil',
    bayar: 505000,
    laba: 5000,
    status: 'Belum Bayar',
    createdAt: 1789541500000,
  },
];

export const DEFAULT_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    nomorInvoice: 'INV-092026-001',
    tanggal: '2026-09-16',
    customer: 'MUHAMMAD',
    whatsapp: '081377889900',
    metodePembayaran: 'Bri Mo',
    items: [
      { id: 'i1', jenisTransaksi: 'Dana', qty: 1, harga: 155000, total: 155000 },
      { id: 'i2', jenisTransaksi: 'Cicilan Mobil', qty: 1, harga: 505000, total: 505000 },
    ],
    subtotal: 660000,
    diskon: 0,
    total: 660000,
    terbilang: 'Enam ratus enam puluh ribu Rupiah',
    catatan: '',
    status: 'Belum',
    createdAt: 1789541500000,
  },
  {
    id: 'inv-2',
    nomorInvoice: 'INV-092026-002',
    tanggal: '2026-09-16',
    customer: 'DIQFHAN AMALDI',
    whatsapp: '082256978421',
    metodePembayaran: 'Shopeepay',
    items: [
      { id: 'i3', jenisTransaksi: 'Dana', qty: 1, harga: 305000, total: 305000 },
    ],
    subtotal: 305000,
    diskon: 0,
    total: 305000,
    terbilang: 'Tiga ratus lima ribu Rupiah',
    catatan: '',
    status: 'Belum',
    createdAt: 1789540500000,
  },
  {
    id: 'inv-3',
    nomorInvoice: 'INV-092026-003',
    tanggal: '2026-09-16',
    customer: 'AQROM',
    whatsapp: '081234567890',
    metodePembayaran: 'Dana Payz',
    items: [
      { id: 'i4', jenisTransaksi: 'Gopay', qty: 1, harga: 255000, total: 255000 },
    ],
    subtotal: 255000,
    diskon: 0,
    total: 255000,
    terbilang: 'Dua ratus lima puluh lima ribu Rupiah',
    catatan: '',
    status: 'Belum',
    createdAt: 1789540000000,
  },
];

interface AppContextType {
  profile: MitraProfile;
  updateProfile: (data: Partial<MitraProfile>) => void;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
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

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}transactions_${userKey}`);
      return saved ? JSON.parse(saved) : DEFAULT_TRANSACTIONS;
    } catch {
      return DEFAULT_TRANSACTIONS;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}invoices_${userKey}`);
      return saved ? JSON.parse(saved) : DEFAULT_INVOICES;
    } catch {
      return DEFAULT_INVOICES;
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
      return saved ? JSON.parse(saved) : DEFAULT_CONTACTS;
    } catch {
      return DEFAULT_CONTACTS;
    }
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // September (0-indexed = 8)
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(true);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Check connectivity to Cloud Firestore
  useEffect(() => {
    testConnection().then((connected) => {
      setIsFirestoreConnected(connected);
    });
  }, []);

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

        // 1. Transactions Real-time Listener
        const txCol = collection(db, 'users', uid, 'transactions');
        const unsubTx = onSnapshot(
          txCol,
          (snapshot) => {
            if (!snapshot.empty) {
              const cloudTxs = snapshot.docs.map((d) => d.data() as Transaction);
              cloudTxs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
              setTransactions(cloudTxs);
              setLastSyncTime(new Date());
            } else {
              // Seed initial local transactions if Firestore is empty
              transactions.forEach((tx) => {
                setDoc(doc(db, 'users', uid, 'transactions', tx.id), {
                  ...tx,
                  userId: uid,
                }).catch((err) =>
                  handleFirestoreError(err, OperationType.CREATE, `users/${uid}/transactions/${tx.id}`)
                );
              });
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
              const cloudInvs = snapshot.docs.map((d) => d.data() as Invoice);
              cloudInvs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
              setInvoices(cloudInvs);
              setLastSyncTime(new Date());
            } else {
              invoices.forEach((inv) => {
                setDoc(doc(db, 'users', uid, 'invoices', inv.id), {
                  ...inv,
                  userId: uid,
                }).catch((err) =>
                  handleFirestoreError(err, OperationType.CREATE, `users/${uid}/invoices/${inv.id}`)
                );
              });
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
              const cloudContacts = snapshot.docs.map((d) => d.data() as Contact);
              setContacts(cloudContacts);
              setLastSyncTime(new Date());
            } else {
              contacts.forEach((c) => {
                setDoc(doc(db, 'users', uid, 'contacts', c.id), {
                  ...c,
                  userId: uid,
                }).catch((err) =>
                  handleFirestoreError(err, OperationType.CREATE, `users/${uid}/contacts/${c.id}`)
                );
              });
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
              setDoc(profileRef, { ...profile, userId: uid }).catch((err) =>
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
              setDoc(settingsRef, {
                id: 'main',
                userId: uid,
                accounts,
                transactionTypes,
                deletedInvoiceKeys,
              }).catch((err) =>
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

  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const hari = txData.hari || getHari(txData.tanggal);
    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      hari,
      createdAt: Date.now(),
    };
    setTransactions((prev) => [newTx, ...prev]);

    if (firebaseUser) {
      setDoc(doc(db, 'users', firebaseUser.uid, 'transactions', newTx.id), {
        ...newTx,
        userId: firebaseUser.uid,
      }).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}/transactions/${newTx.id}`)
      );
    }

    // Also auto update contacts count
    if (txData.nama) {
      setContacts((prev) => {
        const found = prev.find((c) => c.nama.trim().toUpperCase() === txData.nama.trim().toUpperCase());
        if (found) {
          const updated = { ...found, totalTransaksi: (found.totalTransaksi || 0) + 1 };
          if (firebaseUser) {
            setDoc(doc(db, 'users', firebaseUser.uid, 'contacts', found.id), {
              ...updated,
              userId: firebaseUser.uid,
            }, { merge: true }).catch((err) =>
              handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}/contacts/${found.id}`)
            );
          }
          return prev.map((c) => (c.id === found.id ? updated : c));
        } else {
          const newContact: Contact = {
            id: `c_${Date.now()}`,
            nama: txData.nama.trim().toUpperCase(),
            whatsapp: '',
            totalTransaksi: 1,
          };
          if (firebaseUser) {
            setDoc(doc(db, 'users', firebaseUser.uid, 'contacts', newContact.id), {
              ...newContact,
              userId: firebaseUser.uid,
            }).catch((err) =>
              handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}/contacts/${newContact.id}`)
            );
          }
          return [...prev, newContact];
        }
      });
    }
  };

  const updateTransaction = (id: string, updateData: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const merged = { ...t, ...updateData };
          if (updateData.tanggal) {
            merged.hari = getHari(updateData.tanggal);
          }
          if (firebaseUser) {
            updateDoc(doc(db, 'users', firebaseUser.uid, 'transactions', id), {
              ...merged,
              userId: firebaseUser.uid,
            }).catch((err) =>
              handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}/transactions/${id}`)
            );
          }
          return merged;
        }
        return t;
      })
    );
  };

  const deleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (firebaseUser) {
      try {
        await deleteDoc(doc(db, 'users', firebaseUser.uid, 'transactions', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${firebaseUser.uid}/transactions/${id}`);
      }
    }
  };

  const markTransactionLunas = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    let txCustomer = '';

    setTransactions((prev) => {
      const found = prev.find((t) => t.id === id);
      if (found) txCustomer = found.nama.trim().toUpperCase();
      return prev.map((t) => (t.id === id ? { ...t, status: 'Lunas', tanggalBayar: today } : t));
    });

    if (txCustomer) {
      setTimeout(() => {
        setTransactions((currTx) => {
          const remainingUnpaid = currTx.filter(
            (t) => t.nama.trim().toUpperCase() === txCustomer && t.status === 'Belum Bayar'
          );
          if (remainingUnpaid.length === 0) {
            setInvoices((prevInv) =>
              prevInv.map((inv) =>
                inv.customer.trim().toUpperCase() === txCustomer && inv.status === 'Belum'
                  ? { ...inv, status: 'Lunas' }
                  : inv
              )
            );
          }
          return currTx;
        });
      }, 50);
    }
  };

  const markCustomerTransactionsLunas = async (customerName: string) => {
    const today = new Date().toISOString().split('T')[0];
    const targetName = customerName.trim().toUpperCase();

    // 1. Lunaskan semua transaksi belum bayar milik pelanggan ini di Fitur Belum Bayar
    setTransactions((prev) =>
      prev.map((t) =>
        t.nama.trim().toUpperCase() === targetName && t.status === 'Belum Bayar'
          ? { ...t, status: 'Lunas', tanggalBayar: today }
          : t
      )
    );

    // 2. Lunaskan semua faktur invoice milik pelanggan ini di Fitur Invoice
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.customer.trim().toUpperCase() === targetName && inv.status === 'Belum'
          ? { ...inv, status: 'Lunas' }
          : inv
      )
    );
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

    // Sinkronkan ke Fitur Belum Bayar:
    // Jika invoice baru berstatus 'Belum', pastikan item-itemnya tercatat di transaksi Belum Bayar
    if (invData.status === 'Belum' && invData.items && invData.items.length > 0) {
      const today = invData.tanggal || new Date().toISOString().split('T')[0];
      const hari = getHari(today);
      const custName = invData.customer.trim().toUpperCase();

      setTransactions((prevTx) => {
        const newTxList: Transaction[] = [];
        invData.items.forEach((item, idx) => {
          const exists = prevTx.some(
            (t) =>
              t.nama.trim().toUpperCase() === custName &&
              t.status === 'Belum Bayar' &&
              t.jenisTransaksi === item.jenisTransaksi &&
              t.bayar === item.total
          );
          if (!exists && item.total > 0) {
            newTxList.push({
              id: `tx_inv_${newInvoice.id}_${idx}`,
              tanggal: today,
              hari,
              nama: custName,
              akun: invData.metodePembayaran || 'Tunai',
              jenisTransaksi: item.jenisTransaksi,
              bayar: item.total,
              laba: 5000,
              status: 'Belum Bayar',
              createdAt: Date.now() + idx,
            });
          }
        });
        return [...newTxList, ...prevTx];
      });
    }

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

    if (firebaseUser) {
      setDoc(doc(db, 'users', firebaseUser.uid, 'invoices', newInvoice.id), {
        ...newInvoice,
        userId: firebaseUser.uid,
      }).catch((err) =>
        handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}/invoices/${newInvoice.id}`)
      );
    }

    return newInvoice;
  };

  const updateInvoice = async (id: string, updateData: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...updateData } : i)));
    if (firebaseUser) {
      updateDoc(doc(db, 'users', firebaseUser.uid, 'invoices', id), updateData).catch((err) =>
        handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}/invoices/${id}`)
      );
    }
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

    if (firebaseUser) {
      try {
        await deleteDoc(doc(db, 'users', firebaseUser.uid, 'invoices', id));
        await setDoc(
          doc(db, 'users', firebaseUser.uid, 'settings', 'main'),
          { deletedInvoiceKeys: updatedDeletedKeys, userId: firebaseUser.uid },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${firebaseUser.uid}/invoices/${id}`);
      }
    }

    // 3. If requested, also remove related unpaid transactions
    if (options?.deleteRelatedTransactions) {
      if (options.rawTxIds && options.rawTxIds.length > 0) {
        const idSet = new Set(options.rawTxIds);
        setTransactions((prev) => prev.filter((t) => !idSet.has(t.id)));
        if (firebaseUser) {
          options.rawTxIds.forEach((txId) => {
            deleteDoc(doc(db, 'users', firebaseUser.uid, 'transactions', txId)).catch((err) =>
              handleFirestoreError(err, OperationType.DELETE, `users/${firebaseUser.uid}/transactions/${txId}`)
            );
          });
        }
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
        if (firebaseUser && match.id && !match.id.startsWith('synced_inv_')) {
          updateDoc(doc(db, 'users', firebaseUser.uid, 'invoices', match.id), { status: 'Lunas' }).catch(
            (err) => handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}/invoices/${match.id}`)
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
            if (firebaseUser) {
              updateDoc(doc(db, 'users', firebaseUser.uid, 'transactions', tx.id), {
                status: 'Lunas',
                tanggalBayar: today,
              }).catch((err) =>
                handleFirestoreError(err, OperationType.UPDATE, `users/${firebaseUser.uid}/transactions/${tx.id}`)
              );
            }
            return updatedTx;
          }
          return tx;
        })
      );
    }
  };

  const addAccount = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !accounts.includes(trimmed)) {
      const updated = [...accounts, trimmed].sort();
      setAccounts(updated);
      if (firebaseUser) {
        setDoc(
          doc(db, 'users', firebaseUser.uid, 'settings', 'main'),
          { accounts: updated, userId: firebaseUser.uid },
          { merge: true }
        ).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/settings/main`)
        );
      }
    }
  };

  const deleteAccount = (name: string) => {
    const updated = accounts.filter((a) => a !== name);
    setAccounts(updated);
    if (firebaseUser) {
      setDoc(
        doc(db, 'users', firebaseUser.uid, 'settings', 'main'),
        { accounts: updated, userId: firebaseUser.uid },
        { merge: true }
      ).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/settings/main`)
      );
    }
  };

  const addTransactionType = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !transactionTypes.includes(trimmed)) {
      const updated = [...transactionTypes, trimmed].sort();
      setTransactionTypes(updated);
      if (firebaseUser) {
        setDoc(
          doc(db, 'users', firebaseUser.uid, 'settings', 'main'),
          { transactionTypes: updated, userId: firebaseUser.uid },
          { merge: true }
        ).catch((err) =>
          handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/settings/main`)
        );
      }
    }
  };

  const deleteTransactionType = (name: string) => {
    const updated = transactionTypes.filter((t) => t !== name);
    setTransactionTypes(updated);
    if (firebaseUser) {
      setDoc(
        doc(db, 'users', firebaseUser.uid, 'settings', 'main'),
        { transactionTypes: updated, userId: firebaseUser.uid },
        { merge: true }
      ).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/settings/main`)
      );
    }
  };

  const addOrUpdateContact = (contact: Omit<Contact, 'id'> & { id?: string }) => {
    setContacts((prev) => {
      if (contact.id) {
        const updated = prev.map((c) => (c.id === contact.id ? { ...c, ...contact } : c));
        if (firebaseUser) {
          setDoc(
            doc(db, 'users', firebaseUser.uid, 'contacts', contact.id),
            { ...contact, id: contact.id, userId: firebaseUser.uid },
            { merge: true }
          ).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/contacts/${contact.id}`)
          );
        }
        return updated;
      } else {
        const newContact: Contact = {
          id: `c_${Date.now()}`,
          nama: contact.nama.trim().toUpperCase(),
          whatsapp: contact.whatsapp.trim(),
          totalTransaksi: contact.totalTransaksi || 0,
        };
        if (firebaseUser) {
          setDoc(doc(db, 'users', firebaseUser.uid, 'contacts', newContact.id), {
            ...newContact,
            userId: firebaseUser.uid,
          }).catch((err) =>
            handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}/contacts/${newContact.id}`)
          );
        }
        return [...prev, newContact];
      }
    });
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (firebaseUser) {
      deleteDoc(doc(db, 'users', firebaseUser.uid, 'contacts', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `users/${firebaseUser.uid}/contacts/${id}`)
      );
    }
  };

  const syncNow = async () => {
    if (!firebaseUser) {
      await loginWithGoogle();
      return;
    }
    try {
      setIsSyncing(true);
      const uid = firebaseUser.uid;
      const batch = writeBatch(db);

      // 1. Profile
      batch.set(doc(db, 'users', uid, 'profile', 'main'), { ...profile, userId: uid }, { merge: true });

      // 2. Settings
      batch.set(
        doc(db, 'users', uid, 'settings', 'main'),
        { id: 'main', userId: uid, accounts, transactionTypes, deletedInvoiceKeys },
        { merge: true }
      );

      // 3. Transactions
      transactions.forEach((tx) => {
        batch.set(doc(db, 'users', uid, 'transactions', tx.id), { ...tx, userId: uid }, { merge: true });
      });

      // 4. Invoices
      invoices.forEach((inv) => {
        batch.set(doc(db, 'users', uid, 'invoices', inv.id), { ...inv, userId: uid }, { merge: true });
      });

      // 5. Contacts
      contacts.forEach((c) => {
        batch.set(doc(db, 'users', uid, 'contacts', c.id), { ...c, userId: uid }, { merge: true });
      });

      await batch.commit();
      setLastSyncTime(new Date());
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/batch_sync`);
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
