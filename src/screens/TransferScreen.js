// src/screens/TransferScreen.js
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

export default function TransferScreen() {
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
    } catch (e) {
      console.error('Error fetching accounts:', e.message || e);
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
      setTagsList(
        res.data.data
          .map((item) => item?.attributes?.tag)
          .filter((tag) => typeof tag === 'string' && tag.length > 0)
      );
    } catch (e) {
      console.error('Failed to load tags:', e.response?.data || e.message);
    }
  };

  const validAccounts = accounts.filter((acc) => {
    const type = acc.type?.toLowerCase?.() || '';
    const subtype = acc.subtype?.toLowerCase?.() || '';
    const allowedTypes = ['asset', 'liabilities', 'liability'];
    const excludedSubtypes = ['initial-balance', 'revenue', 'expense', 'import'];
    return allowedTypes.includes(type) && !excludedSubtypes.includes(subtype);
  });

  const validSourceAccounts = validAccounts;
  const validDestinationAccounts = validAccounts;

  const onSubmit = async () => {
    if (!amount || !description || !source?.name || !destination?.name || !date) {
      Alert.alert('Missing Fields', 'Please fill all required fields.');
      return;
    }

    try {
      const config = await getAuthConfig();

      const tx = {
        type: 'transfer',
        date: date.toISOString(), // full datetime
        amount,
        description,
        category_name: category || null,
        budget_name: budget || null,
        bill_name: bill || null,
        tags: tags
          ? tags
              .split(',')
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
          : [],
        notes,
      };

      if (source?.id) tx.source_id = source.id;
      if (source?.name) tx.source_name = source.name;
      if (destination?.id) tx.destination_id = destination.id;
      if (destination?.name) tx.destination_name = destination.name;

      const payload = { transactions: [tx] };
      await axios.post('transactions', payload, config);

      Alert.alert('Success', 'Transfer created!');
      resetForm();
    } catch (error) {
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

  const renderSuggestionsPlain = (items, onSelect) => {
    if (!items || items.length === 0) return null;
    return (
      <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 4, marginTop: 4 }}>
        {items.map((item, idx) => (
          <TouchableOpacity
            key={item.id ?? idx}
            onPress={() => {
              onSelect({ id: item.id ?? '', name: item.name ?? item });
              Keyboard.dismiss();
            }}
            style={{
              padding: 8,
              borderBottomWidth: idx === items.length - 1 ? 0 : 1,
              borderBottomColor: '#ddd',
            }}
          >
            <Text style={styles.suggestion}>{item.name ?? item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

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
              const newDate = new Date(date);
              newDate.setFullYear(selectedDate.getFullYear());
              newDate.setMonth(selectedDate.getMonth());
              newDate.setDate(selectedDate.getDate());
              setDate(newDate);
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
          is24Hour={true}
          display="default"
          onChange={(_, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              const newDate = new Date(date);
              newDate.setHours(selectedTime.getHours());
              newDate.setMinutes(selectedTime.getMinutes());
              setDate(newDate);
            }
          }}
        />
      )}

      {/* Source and Destination Accounts */}
      <Text style={styles.label}>Source Account *</Text>
      <TextInput
        style={styles.input}
        value={source?.name || ''}
        onChangeText={(text) => {
          setSource({ id: '', name: text });
          const filtered = validSourceAccounts.filter((a) =>
            a.name.toLowerCase().includes(text.toLowerCase())
          );
          setFilteredSource(filtered);
        }}
      />
      {renderSuggestionsPlain(filteredSource, (val) => {
        setSource({ id: val.id, name: val.name });
        setFilteredSource([]);
      })}

      <Text style={styles.label}>Destination Account *</Text>
      <TextInput
        style={styles.input}
        value={destination?.name || ''}
        onChangeText={(text) => {
          setDestination({ id: '', name: text });
          const filtered = validDestinationAccounts.filter((a) =>
            a.name.toLowerCase().includes(text.toLowerCase())
          );
          setFilteredDest(filtered);
        }}
      />
      {renderSuggestionsPlain(filteredDest, (val) => {
        setDestination({ id: val.id, name: val.name });
        setFilteredDest([]);
      })}

      {/* Other fields */}
      <Text style={styles.label}>Category</Text>
      <TextInput
        style={styles.input}
        value={category}
        onChangeText={(text) => {
          setCategory(text);
          setFilteredCategories(categories.filter((c) => c.toLowerCase().includes(text.toLowerCase())));
        }}
      />
      {filteredCategories.length > 0 &&
        renderSuggestionsPlain(filteredCategories.map((c, i) => ({ id: i.toString(), name: c })), (val) =>
          setCategory(val.name)
        )}

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
          if (!text) return setFilteredTags([]);
          const lastTag = text.split(',').pop().trim().toLowerCase();
          if (lastTag) {
            setFilteredTags(tagsList.filter((tag) => tag.toLowerCase().includes(lastTag)));
          } else {
            setFilteredTags([]);
          }
        }}
      />
      {filteredTags.length > 0 &&
        renderSuggestionsPlain(filteredTags.map((t, i) => ({ id: i.toString(), name: t })), (val) => {
          const tagArray = tags.split(',').map((t) => t.trim());
          tagArray[tagArray.length - 1] = val.name;
          setTags(tagArray.join(', ') + ', ');
          setFilteredTags([]);
        })}

      <Text style={styles.label}>Notes</Text>
      <TextInput style={styles.input} value={notes} onChangeText={setNotes} multiline numberOfLines={3} />

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
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  dateInput: {
    padding: 10,
    backgroundColor: '#eee',
    marginTop: 4,
    borderRadius: 4,
  },
  suggestion: { padding: 8, backgroundColor: '#f1f1f1', borderBottomWidth: 1, borderBottomColor: '#ddd' },
  buttonContainer: { flexDirection: 'row', marginTop: 20, justifyContent: 'center' },
});
