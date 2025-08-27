// src/components/AnimatedFAB.js
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const AnimatedFAB = () => {
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const toggleFAB = () => {
    if (expanded) {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setExpanded(false));
    } else {
      setExpanded(true);
      Animated.timing(fadeAnim, { toValue: 0.7, duration: 200, useNativeDriver: true }).start();
    }
  };

  const navigateTo = (screen) => {
    toggleFAB();
    navigation.navigate(screen);
  };

  return (
    <>
      {expanded && (
        <TouchableWithoutFeedback onPress={toggleFAB}>
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>
      )}

      <View style={styles.container}>
        {expanded && (
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.option} onPress={() => navigateTo('Withdraw')}>
              <Text style={styles.optionText}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => navigateTo('Deposit')}>
              <Text style={styles.optionText}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={() => navigateTo('Transfer')}>
              <Text style={styles.optionText}>Transfer</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.fab} onPress={toggleFAB}>
          <Text style={styles.fabIcon}>{expanded ? '×' : '+'}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    alignItems: 'flex-end',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabIcon: {
    fontSize: 32,
    color: '#fff',
  },
  optionsContainer: {
    marginBottom: 10,
  },
  option: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: 120,
    alignItems: 'center',
    elevation: 3,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  overlay: {
    position: 'absolute',
    width,
    height,
    backgroundColor: 'black',
    top: 0,
    left: 0,
  },
});

export default AnimatedFAB;
