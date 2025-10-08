// src/screens/DepositScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
  FlatList,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getAuthConfig } from '../utils/fireflyApi';
import axios from 'axios';

export default function DepositScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [bill, setBill] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tagsList, setTagsList] = useState([]);

  const [filteredSource, setFilteredSource] = useState([]);
  const [filteredDest, setFilteredDest] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [filteredTags, setFilteredTags] = useState([]);

  useEffect(() => {
    fetchAccounts();
    fetchCategories();
    fetchTags();
  }, []);

  const fetchAccounts = async () => {
    try {
      const config = await getAuthConfig();
      const res = await axios.get('accounts', config);
      const all = res.data.data.map((item) => ({
        id: item.id,
        name: item.attributes.name,
        type: item.attributes.account_type || item.attributes.type,
        subtype: item.attributes.subtype || '',
      }));
      setAccounts(all);
    } catch (error) {
      console.error('❌ Error fetching accounts:', error.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const config = await getAuthConfig();
      const res = await axios.get('categories', config);
      setCategories(res.data.data.map((item) => item.attributes.name));
    } catch (e) {
      console.error('Failed to load categories:', e.message);
    }
  };

  const fetchTags = async () => {
    try {
      const config = await getAuthConfig();
      const res = await axios.get('tags', config);
      const names = res.data.data
        .map((item) => item?.attributes?.tag)
        .filter((tag) => typeof tag === 'string' && tag.length > 0);
      setTagsList(names);
    } catch (e) {
      console.error('Failed to load tags:', e.message);
    }
  };

  const validAccounts = accounts.filter((acc) => {
    const type = acc.type?.toLowerCase?.();
    const subtype = acc.subtype?.toLowerCase?.();
    const allowedTypes = ['asset', 'liabilities', 'liability'];
    const excludedSubtypes = ['initial-balance', 'revenue', 'expense', 'import'];
    return allowedTypes.includes(type) && !excludedSubtypes.includes(subtype);
  });

  const onSubmit = async () => {
    if (!amount || !description || !destination?.name || !date) {
      Alert.alert('Missing Fields', 'Please fill amount, description, destination, and date.');
      return;
    }
    try {
      const config = await getAuthConfig();
      const payload = {
        transactions: [
          {
            type: 'deposit',
            date: date.toISOString(),
            amount,
            description,
            ...(source?.name ? { source_name: source.name } : {}),
            destination_name: destination.name,
            category_name: category || null,
            budget_name: budget || null,
            bill_name: bill || null,
            tags: tags
              ? tags.split(',').map((t) => t.trim()).filter((t) => t.length > 0)
              : [],
            notes,
          },
        ],
      };
      await axios.post('transactions', payload, config);
      Alert.alert('Success', 'Deposit recorded!');
      resetForm();
    } catch {
      Alert.alert('Error', 'Something went wrong while submitting.');
    }
  };

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setDate(new Date());
    setSource(null);
    setDestination(null);
    setCategory('');
    setBudget('');
    setBill('');
    setTags('');
    setNotes('');
    setFilteredSource([]);
    setFilteredDest([]);
    setFilteredCategories([]);
    setFilteredTags([]);
  };

  const renderSuggestions = (data, setValue, clearSuggestions) => (
    <FlatList
      data={data}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(item, index) => item.id || index.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => {
            setValue(item);
            clearSuggestions([]);
            Keyboard.dismiss();
          }}
        >
          <Text style={styles.suggestion}>{item.name}</Text>
        </TouchableOpacity>
      )}
    />
  );

  const renderForm = () => (
    <View style={styles.container}>
      <Text style={styles.label}>Amount *</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} />

      <Text style={styles.label}>Description *</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} />

      <Text style={styles.label}>Date *</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <Text style={styles.dateInput}>{date.toDateString()}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(_, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              const updated = new Date(date);
              updated.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
              setDate(updated);
            }
          }}
        />
      )}

      <Text style={styles.label}>Time *</Text>
      <TouchableOpacity onPress={() => setShowTimePicker(true)}>
        <Text style={styles.dateInput}>
          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>
      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode="time"
          display="default"
          onChange={(_, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              const updated = new Date(date);
              updated.setHours(selectedTime.getHours(), selectedTime.getMinutes());
              setDate(updated);
            }
          }}
        />
      )}

      <Text style={styles.label}>Source Account</Text>
      <TextInput
        style={styles.input}
        value={source?.name || ''}
        onChangeText={(text) => {
          setSource({ name: text });
          if (text.trim().length > 0) {
            setFilteredSource(
              validAccounts.filter((a) =>
                a.name.toLowerCase().includes(text.toLowerCase())
              )
            );
          } else {
            setFilteredSource([]);
          }
        }}
      />
      {filteredSource.length > 0 && renderSuggestions(filteredSource, setSource, setFilteredSource)}

      <Text style={styles.label}>Destination Account *</Text>
      <TextInput
        style={styles.input}
        value={destination?.name || ''}
        onChangeText={(text) => {
          setDestination({ name: text });
          if (text.trim().length > 0) {
            setFilteredDest(
              validAccounts.filter((a) =>
                a.name.toLowerCase().includes(text.toLowerCase())
              )
            );
          } else {
            setFilteredDest([]);
          }
        }}
      />
      {filteredDest.length > 0 && renderSuggestions(filteredDest, setDestination, setFilteredDest)}

      <Text style={styles.label}>Category</Text>
      <TextInput
        style={styles.input}
        value={category}
        onChangeText={(text) => {
          setCategory(text);
          if (text.trim().length > 0) {
            setFilteredCategories(
              categories
                .filter((c) => c.toLowerCase().includes(text.toLowerCase()))
                .map((c, i) => ({ name: c, id: i.toString() }))
            );
          } else {
            setFilteredCategories([]);
          }
        }}
      />
      {filteredCategories.length > 0 &&
        renderSuggestions(filteredCategories, (val) => setCategory(val.name), setFilteredCategories)}

      <Text style={styles.label}>Budget</Text>
      <TextInput style={styles.input} value={budget} onChangeText={setBudget} />

      <Text style={styles.label}>Bill</Text>
      <TextInput style={styles.input} value={bill} onChangeText={setBill} />

      <Text style={styles.label}>Tags (comma separated)</Text>
      <TextInput
        style={styles.input}
        value={tags}
        onChangeText={(text) => {
          setTags(text);
          if (!text.trim()) {
            setFilteredTags([]);
            return;
          }
          const tagArray = text.split(',').map((t) => t.trim());
          const lastTag = tagArray[tagArray.length - 1]?.toLowerCase() || '';
          if (lastTag.length > 0) {
            setFilteredTags(
              tagsList.filter((tag) => tag.toLowerCase().includes(lastTag))
            );
          } else {
            setFilteredTags([]);
          }
        }}
      />
      {filteredTags.length > 0 && (
        <FlatList
          data={filteredTags}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                const tagArray = tags.split(',').map((t) => t.trim());
                tagArray[tagArray.length - 1] = item;
                setTags(tagArray.join(', ') + ', ');
                setFilteredTags([]);
                Keyboard.dismiss();
              }}
            >
              <Text style={styles.suggestion}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={styles.input}
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <View style={styles.buttonContainer}>
        <Button title="Submit" onPress={onSubmit} />
        <View style={{ width: 10 }} />
        <Button title="Reset" onPress={resetForm} color="gray" />
      </View>
    </View>
  );

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
        setFilteredSource([]);
        setFilteredDest([]);
        setFilteredCategories([]);
        setFilteredTags([]);
      }}
    >
      <FlatList
        data={[]}
        keyExtractor={() => 'key'}
        ListHeaderComponent={renderForm()}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  label: { marginTop: 12, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#aaa', padding: 8, borderRadius: 4, marginTop: 4 },
  dateInput: { padding: 10, backgroundColor: '#eee', marginTop: 4, borderRadius: 4 },
  suggestion: {
    padding: 8,
    backgroundColor: '#f1f1f1',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  buttonContainer: { flexDirection: 'row', marginTop: 20, justifyContent: 'center' },
});
