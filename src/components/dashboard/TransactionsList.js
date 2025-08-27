import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import moment from 'moment';

const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';

export default function TransactionsList({ transactions = [], navigation }) {
  const [visibleCount, setVisibleCount] = useState(10);

  const handleShowMore = () => setVisibleCount(prev => prev + 10);

  const renderItem = ({ item }) => {
    const tx = item.attributes?.transactions?.[0] || {};
    const date = tx.date ? moment(tx.date) : null;
    const amount = parseFloat(tx.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    let accountName = '';
if (tx.type === 'withdrawal') {
  accountName = tx.source_name || tx.account?.attributes?.name || '';
} else if (tx.type === 'deposit') {
  accountName = tx.destination_name || tx.destination?.attributes?.name || '';
} else if (tx.type === 'transfer') {
  const from = tx.source_name || tx.account?.attributes?.name || '';
  const to = tx.destination_name || tx.destination?.attributes?.name || '';
  accountName = from && to ? `${from} → ${to}` : from || to || '';
};

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('TransactionEdit', { id: item.id })}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.date}>{date ? date.format('DD MMM') : 'N/A'}</Text>
          <Text style={styles.year}>{date ? date.format('YYYY') : ''}</Text>
        </View>
        <View style={{ flex: 3, marginLeft: 8 }}>
          <Text style={styles.description} numberOfLines={1}>{tx.description || 'No description'}</Text>
          {accountName ? <Text style={styles.accountName}>{accountName}</Text> : null}
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={[styles.amount, { color: tx.type === 'withdrawal' ? 'red' : 'green' }]} numberOfLines={1}>
            ₹{amount}
          </Text>
          <Text style={styles.type}>{capitalize(tx.type)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Latest Transactions</Text>
      {transactions.length === 0 ? (
        <Text>No transactions found</Text>
      ) : (
        <>
          <FlatList
            data={transactions.slice(0, visibleCount)}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            scrollEnabled={false} // parent ScrollView handles scrolling
          />
          {visibleCount < transactions.length && (
            <TouchableOpacity style={styles.showMoreButton} onPress={handleShowMore}>
              <Text style={styles.showMoreText}>Show More</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 12 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  item: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 0.5, borderColor: '#ccc', alignItems: 'center' },
  date: { fontWeight: 'bold' },
  year: { fontSize: 12, color: '#666' },
  description: { fontWeight: '600' },
  accountName: { fontSize: 12, color: '#555', marginTop: 2 },
  amount: { fontWeight: 'bold', minWidth: 80, textAlign: 'right' },
  type: { fontSize: 12, color: '#666', marginTop: 2 },
  showMoreButton: { padding: 10, alignItems: 'center', marginTop: 8, backgroundColor: '#2196F3', borderRadius: 8 },
  showMoreText: { color: '#fff', fontWeight: 'bold' },
});
