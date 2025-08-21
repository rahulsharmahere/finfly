import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  Alert,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { getCredentials, saveCredentials } from '../utils/storage';
import Footer from '../components/Footer';

const LoginScreen = ({ navigation }) => {
  const [host, setHost] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    autoLogin();
  }, []);

  const autoLogin = async () => {
    try {
      const stored = await getCredentials();
      if (stored?.host && stored?.token) {
        const normalizedHost = stored.host.replace(/\/+$/, '');
        const res = await fetch(`${normalizedHost}/api/v1/about`, {
          headers: {
            Authorization: `Bearer ${stored.token}`,
            Accept: 'application/json'
          }
        });
        if (res.ok) {
          navigation.replace('DashboardScreen');
          return;
        }
      }
    } catch (e) {
      console.log('Auto-login failed:', e.message);
    }
    setLoading(false);
  };

  const handlePaste = async () => {
    const text = await Clipboard.getString();
    setToken(text);
  };

  const handleLogin = async () => {
    if (!host?.trim() || !token?.trim()) {
  Alert.alert('Missing Fields', 'Please enter both Host URL and PAT');
  return;
}

const normalizedHost = host.trim().replace(/\/+$/, '');

    try {
      const res = await fetch(`${normalizedHost}/api/v1/about`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });

      if (!res.ok) {
        const text = await res.text();
        console.log('Invalid response:', text);
        throw new Error('Invalid credentials or host');
      }

      await saveCredentials(normalizedHost, token);
      navigation.replace('Dashboard');
    } catch (error) {
      console.log('Login error:', error.message);
      Alert.alert('Login Failed', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text>Checking credentials...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Firefly III Host</Text>
      <TextInput
        style={styles.input}
        placeholder="https://your-firefly-url.com"
        value={host}
        onChangeText={setHost}
        autoCapitalize="none"
        keyboardType="url"
      />

      <Text style={styles.label}>Personal Access Token (PAT)</Text>
      <View style={styles.patContainer}>
        <TextInput
          style={styles.patInput}
          placeholder="Enter your token"
          value={token}
          onChangeText={setToken}
          secureTextEntry
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
          <Text style={styles.pasteText}>Paste</Text>
        </TouchableOpacity>
      </View>

      <Button title="Login" onPress={handleLogin} />

      <Footer />
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
    padding: 10,
    borderRadius: 8
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5
  },
  patContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 20
  },
  patInput: {
    flex: 1,
    padding: 10
  },
  pasteButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#eee',
    borderLeftWidth: 1,
    borderColor: '#ccc'
  },
  pasteText: {
    fontWeight: 'bold'
  }
});
