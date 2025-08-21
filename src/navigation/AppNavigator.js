// AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import WithdrawScreen from '../screens/WithdrawScreen';
import DepositScreen from '../screens/DepositScreen';
import TransferScreen from '../screens/TransferScreen';
import TransactionEdit from '../screens/TransactionEdit';
import AppLayout from '../components/layout/AppLayout';
import AboutScreen from '../screens/AboutScreen'; // 
import SplashScreen from '../screens/SplashScreen'; // 
import LoginScreen from '../screens/LoginScreen'; // 


const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false, // cleaner look
        headerTintColor: '#000', // back arrow color (change if dark mode)
      }}
    >
      {/* Dashboard - No Back Button */}
      <Stack.Screen
        name="Dashboard"
        options={{ headerShown: false }}
      >
        {() => (
          <AppLayout>
            <DashboardScreen />
          </AppLayout>
        )}
      </Stack.Screen>

       <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="About" component={AboutScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />

      {/* Transfer */}
      <Stack.Screen
        name="Transfer"
        options={{ title: 'Transfer', headerShown: true }}
      >
        {() => (
          <AppLayout>
            <TransferScreen />
          </AppLayout>
        )}
      </Stack.Screen>

      {/* Withdraw */}
      <Stack.Screen
        name="Withdraw"
        options={{ title: 'Withdraw', headerShown: true }}
      >
        {() => (
          <AppLayout>
            <WithdrawScreen />
          </AppLayout>
        )}
      </Stack.Screen>

      {/* Deposit */}
      <Stack.Screen
        name="Deposit"
        options={{ title: 'Deposit', headerShown: true }}
      >
        {() => (
          <AppLayout>
            <DepositScreen />
          </AppLayout>
        )}
      </Stack.Screen>

      {/* Transaction Edit */}
      <Stack.Screen
        name="TransactionEdit"
        options={{ title: 'Edit Transaction', headerShown: true }}
      >
        {() => (
          <AppLayout>
            <TransactionEdit />
          </AppLayout>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
