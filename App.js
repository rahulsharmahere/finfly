import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MenuProvider } from 'react-native-popup-menu';

import AppNavigator from './src/navigation/AppNavigator';
import { UpdateProvider } from './src/context/UpdateContext'; // ✅ new context

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MenuProvider>
        {/* Pass GitHub repo details here */}
        <UpdateProvider owner="rahulsharmahere" repo="finfly">
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </UpdateProvider>
      </MenuProvider>
    </GestureHandlerRootView>
  );
}
