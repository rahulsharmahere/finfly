import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import EncryptedStorage from 'react-native-encrypted-storage';
import { useUpdate } from '../context/UpdateContext';

export default function ThreeDotMenu({ assetAccounts = [], liabilityAccounts = [] }) {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [accountsMenuExpanded, setAccountsMenuExpanded] = useState(false);

  const { checkForUpdate, isChecking } = useUpdate();

  const handleLogout = async () => {
    setMenuVisible(false);
    try {
      await EncryptedStorage.removeItem('firefly_credentials');
    } catch (e) {
      console.error('Failed to clear credentials', e);
    }
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  return (
    <>
      {/* Three dot button */}
      <TouchableOpacity
        onPress={() => setMenuVisible(true)}
        style={styles.menuButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.headerIcon}>⋮</Text>
      </TouchableOpacity>

      {/* Dropdown modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalBackdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('Dashboard');
            }}
          >
            <Text style={styles.menuText}>Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('Report');
            }}
          >
            <Text style={styles.menuText}>Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setAccountsMenuExpanded(prev => !prev)}
          >
            <Text style={styles.menuText}>
              Accounts {accountsMenuExpanded ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {accountsMenuExpanded && (
            <View style={{ paddingLeft: 16 }}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Assets', { accounts: assetAccounts });
                }}
              >
                <Text style={styles.menuText}>Assets</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate('Liabilities', { accounts: liabilityAccounts });
                }}
              >
                <Text style={styles.menuText}>Liabilities</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              navigation.navigate('About');
            }}
          >
            <Text style={styles.menuText}>About</Text>
          </TouchableOpacity>

          {/* Check for Update */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setMenuVisible(false);
              checkForUpdate(); // modal handled by UpdateContext
            }}
          >
            <Text style={styles.menuText}>Check for Update</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleLogout}
          >
            <Text style={styles.menuText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {isChecking && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={{ marginTop: 8, fontSize: 16 }}>Checking for update...</Text>
          </View>
        )}
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: { paddingHorizontal: 12, paddingVertical: 8 },
  headerIcon: { color: '#fff', fontSize: 22 },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  menuContainer: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    minWidth: 160,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: { padding: 12 },
  menuText: { fontSize: 16 },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
