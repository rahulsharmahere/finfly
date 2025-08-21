import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';

const Footer = () => {
  return (
    <View style={styles.footer}>
      <Text style={styles.text}>
        Designed and Made by{' '}
        <Text
          style={styles.link}
          onPress={() => Linking.openURL('https://rahulsharmahere.com')}
        >
          Rahul Sharma
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f8f8f8',
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    color: '#333',
  },
  link: {
    color: '#007bff',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default Footer;
