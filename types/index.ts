export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: number; // Timestamp
  userId: string;
}

export interface Budget {
  id: string;
  amount: number;
  period: 'weekly' | 'monthly';
  category?: string; // Optional: budget per category
  userId: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}
