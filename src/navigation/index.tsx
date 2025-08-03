import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import { getStoredCredentials, validateFireflyToken } from '../services/auth';

export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

const DashboardDrawer = () => (
  <Drawer.Navigator>
    <Drawer.Screen name="Dashboard" component={DashboardScreen} />
  </Drawer.Navigator>
);

const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState<'Login' | 'Dashboard'>('Login');

  useEffect(() => {
    const checkAuth = async () => {
      const creds = await getStoredCredentials();
      if (creds && await validateFireflyToken(creds)) {
        setInitialRoute('Dashboard');
      }
    };
    checkAuth();
  }, []);

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Dashboard" component={DashboardDrawer} />
    </Stack.Navigator>
  );
};

export default AppNavigator;