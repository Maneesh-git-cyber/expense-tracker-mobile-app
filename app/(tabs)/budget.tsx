import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../utils/firebaseConfig';
import { collection, query, where, getDocs, setDoc, doc, onSnapshot } from 'firebase/firestore';

export default function Budget() {
  const { user } = useAuth();
  const [budget, setBudget] = useState<string>('');
  const [currentSpending, setCurrentSpending] = useState(0);
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Fetch Budget
    const fetchBudget = async () => {
      const q = query(collection(db, 'budgets'), where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const budgetData = querySnapshot.docs[0].data();
        setBudgetLimit(budgetData.amount);
        setBudget(budgetData.amount.toString());
      }
    };

    // Calculate current month spending
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const qExpenses = query(
      collection(db, 'expenses'),
      where('userId', '==', user.uid),
      where('date', '>=', startOfMonth.getTime())
    );

    const unsubscribe = onSnapshot(qExpenses, (snapshot) => {
      const total = snapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
      setCurrentSpending(total);
      setLoading(false);
    });

    fetchBudget();
    return unsubscribe;
  }, [user]);

  const handleSaveBudget = async () => {
    if (!user) return;
    const amount = parseFloat(budget);
    if (isNaN(amount)) {
      Alert.alert("Error", "Invalid amount");
      return;
    }

    try {
      // Create a unique ID based on user ID for simplicity, or just use a random ID but query by user
      // Ideally update existing if exists.
      // For now, let's assume one budget doc per user and use user.uid as doc id if possible, 
      // or query and update.
      // Let's use user.uid as doc ID for budget to make it unique 1:1
      await setDoc(doc(db, 'budgets', user.uid), {
        userId: user.uid,
        amount: amount,
        period: 'monthly'
      });
      setBudgetLimit(amount);
      Alert.alert("Success", "Budget updated");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  const remaining = budgetLimit - currentSpending;
  const progress = budgetLimit > 0 ? currentSpending / budgetLimit : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Budget</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>Set Budget Limit</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Amount"
            keyboardType="numeric"
            value={budget}
            onChangeText={setBudget}
          />
          <Button title="Save" onPress={handleSaveBudget} />
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Spent</Text>
          <Text style={[styles.statValue, { color: '#e74c3c' }]}>${currentSpending.toFixed(2)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Limit</Text>
          <Text style={styles.statValue}>${budgetLimit.toFixed(2)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Remaining</Text>
          <Text style={[styles.statValue, { color: remaining >= 0 ? '#2ecc71' : '#e74c3c' }]}>
            ${remaining.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${Math.min(progress * 100, 100)}%`, backgroundColor: progress > 1 ? '#e74c3c' : '#3498db' }]} />
      </View>
      <Text style={styles.progressText}>{(progress * 100).toFixed(1)}% Used</Text>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  label: {
    marginBottom: 10,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginRight: 10,
    borderRadius: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    width: '30%',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  progressBarContainer: {
    height: 20,
    backgroundColor: '#ddd',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
  },
  progressText: {
    textAlign: 'center',
    color: '#666',
  },
});
