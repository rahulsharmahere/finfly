// src/screens/TransactionEdit.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import moment from 'moment';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getAuthConfig } from '../utils/fireflyApi';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

const transactionTypes = ['withdrawal', 'deposit', 'transfer'];

const TransactionEdit = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params || {};

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showTimePicker, setShowTimePicker] = useState(false); // NEW

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('withdrawal');
  const [sourceName, setSourceName] = useState('');
  const [destinationName, setDestinationName] = useState('');

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const fetchTransaction = async () => {
      try {
        setLoading(true);
        const config = await getAuthConfig();
        const res = await axios.get(`transactions/${id}`, config);

        if (res.data && res.data.data) {
          const tx = res.data.data;
          setTransaction(tx);

          const txAttrs =
            Array.isArray(tx.attributes?.transactions) &&
            tx.attributes.transactions.length > 0
              ? tx.attributes.transactions[0]
              : {};

          setDate(txAttrs.date ? moment(txAttrs.date).toDate() : new Date());
          setDescription(txAttrs.description || '');
          setAmount(
            txAttrs.amount ? Number(txAttrs.amount).toFixed(2) : ''
          );
          setType(txAttrs.type || 'withdrawal');
          setSourceName(txAttrs.source_name || '');
          setDestinationName(txAttrs.destination_name || '');
        } else {
          setError('Transaction not found');
        }
      } catch (err) {
        setError('Failed to load transaction details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [id]);

  const onSave = async () => {
    if (!amount || Number.isNaN(Number(amount))) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid amount.',
      });
      return;
    }

    try {
      setSaving(true);
      const config = await getAuthConfig();

      const payload = {
        transactions: [
          {
            description,
            // Combine date + time into full timestamp
            date: moment(date).format('YYYY-MM-DD HH:mm:ss'),
            amount: Number(amount).toFixed(2).toString(),
            type,
            source_name: sourceName || 'Cash account',
            destination_name: destinationName || 'Savings account',
          },
        ],
      };

      if (id) {
        await axios.put(`transactions/${id}`, payload, config);
        Toast.show({ type: 'success', text1: 'Transaction updated' });
      } else {
        await axios.post('transactions', payload, config);
        Toast.show({ type: 'success', text1: 'Transaction created' });
      }

      navigation.goBack();
    } catch (error) {
      console.error('Save error', error?.response?.data || error);
      Toast.show({ type: 'error', text1: 'Failed to save transaction' });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!id) return;

    Toast.show({ type: 'info', text1: 'Deleting transaction...' });

    (async () => {
      try {
        setDeleting(true);
        const config = await getAuthConfig();
        await axios.delete(`transactions/${id}`, config);
        Toast.show({ type: 'success', text1: 'Transaction deleted' });
        navigation.goBack();
      } catch (error) {
        console.error('Delete error', error);
        Toast.show({ type: 'error', text1: 'Failed to delete transaction' });
      } finally {
        setDeleting(false);
      }
    })();
  };

  if (loading || saving || deleting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 10 }}>
          {loading
            ? 'Loading transaction...'
            : saving
            ? 'Saving transaction...'
            : 'Deleting transaction...'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Date Picker */}
      <Text style={styles.label}>Date</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowDatePicker(true)}
      >
        <Text>{moment(date).format('YYYY-MM-DD')}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              const updatedDate = new Date(date);
              updatedDate.setFullYear(selectedDate.getFullYear());
              updatedDate.setMonth(selectedDate.getMonth());
              updatedDate.setDate(selectedDate.getDate());
              setDate(updatedDate);
            }
          }}
        />
      )}

      {/* Time Picker */}
      <Text style={styles.label}>Time</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowTimePicker(true)}
      >
        <Text>{moment(date).format('HH:mm')}</Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              const updatedDate = new Date(date);
              updatedDate.setHours(selectedTime.getHours());
              updatedDate.setMinutes(selectedTime.getMinutes());
              setDate(updatedDate);
            }
          }}
        />
      )}

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter description"
        value={description}
        onChangeText={setDescription}
      />

      {/* Amount */}
      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter amount"
        value={amount?.toString() || ''}
        keyboardType="numeric"
        onChangeText={(text) => {
          let cleanText = text.replace(/[^0-9.]/g, '');
          const dotCount = (cleanText.match(/\./g) || []).length;
          if (dotCount > 1) cleanText = cleanText.slice(0, -1);
          if (cleanText.includes('.')) {
            const [intPart, decPart] = cleanText.split('.');
            if (decPart.length > 2)
              cleanText = intPart + '.' + decPart.slice(0, 2);
          }
          setAmount(cleanText);
        }}
      />

      {/* Type */}
      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        {transactionTypes.map((t) => (
          <Button
            key={t}
            title={t.charAt(0).toUpperCase() + t.slice(1)}
            color={type === t ? '#2196F3' : '#aaa'}
            onPress={() => setType(t)}
          />
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonsRow}>
        <Button title="Save" onPress={onSave} />
        <Button
          title="Cancel"
          color="red"
          onPress={() => navigation.goBack()}
        />
      </View>

      {id && (
        <View style={styles.deleteContainer}>
          <Button
            title="Delete Transaction"
            color="red"
            onPress={onDelete}
          />
        </View>
      )}
    </ScrollView>
  );
};

export default TransactionEdit;

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: {
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    justifyContent: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  },
  deleteContainer: { marginTop: 40 },
});
