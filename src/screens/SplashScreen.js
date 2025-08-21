// src/screens/SplashScreen.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const credentials = await EncryptedStorage.getItem('credentials');
        const { host, token } = JSON.parse(credentials || '{}');

        if (host && token) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Dashboard' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        }
      } catch (error) {
        console.log('Auth check failed:', error);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    };

    checkAuth();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
