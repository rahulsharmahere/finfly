import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { storeCredentials, validateFireflyToken } from '../services/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');

  const handleLogin = async () => {
    const valid = await validateFireflyToken({ url, token });
    if (valid) {
      await storeCredentials({ url, token });
      navigation.replace('Dashboard');
    } else {
      Alert.alert('Invalid Credentials', 'Please check your URL and token.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Firefly III URL:</Text>
      <TextInput style={styles.input} value={url} onChangeText={setUrl} placeholder="https://demo.firefly-iii.org" />
      <Text style={styles.label}>Access Token:</Text>
      <TextInput style={styles.input} value={token} onChangeText={setToken} placeholder="Token" secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  label: { fontSize: 16, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 16, borderRadius: 8 }
});