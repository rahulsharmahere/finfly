// AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import DashboardScreen from '../screens/DashboardScreen';
import WithdrawScreen from '../screens/WithdrawScreen';
import DepositScreen from '../screens/DepositScreen';
import TransferScreen from '../screens/TransferScreen';
import TransactionEdit from '../screens/TransactionEdit';
import AboutScreen from '../screens/AboutScreen';
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import AccountDetailScreen from '../screens/AccountDetailScreen';
import AddAssetScreen from '../screens/AddAssetScreen';
import AssetsScreen from '../screens/AssetsScreen';
import LiabilitiesScreen from '../screens/LiabilitiesScreen';
import AddLiabilitiesScreen from '../screens/AddLiabilitiesScreen';
import ReportScreen from '../screens/ReportScreen';
import ReportResultScreen from '../screens/ReportResultScreen'; // NEW

// Layout
import AppLayout from '../components/layout/AppLayout';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerBackTitleVisible: false,
        headerTintColor: '#000',
      }}
    >
      {/* Splash */}
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />

      {/* Login */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />

      {/* Dashboard */}
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

      {/* About */}
        <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ headerShown: false  }}
      />

      {/* Report Input */}
      <Stack.Screen
        name="Report"
        options={{ headerShown: false }}
      >
        {() => (
          <AppLayout>
            <ReportScreen />
          </AppLayout>
        )}
      </Stack.Screen>

      {/* Report Results */}
      <Stack.Screen
  name="ReportResultScreen"
  options={{ headerShown: false }}
>
  {({ navigation, route }) => (
    <AppLayout>
      <ReportResultScreen navigation={navigation} route={route} />
    </AppLayout>
  )}
</Stack.Screen>



      {/* Accounts */}
      <Stack.Screen
        name="AccountDetailScreen"
        component={AccountDetailScreen}
        options={{ headerShown: false  }}
      />
      <Stack.Screen
        name="Assets"
        component={AssetsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddAssetScreen"
        component={AddAssetScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Liabilities"
        component={LiabilitiesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddLiabilitiesScreen"
        component={AddLiabilitiesScreen}
        options={{ headerShown: false }}
      />

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
        options={{ title: 'Edit Transaction', headerShown: false }}
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
