import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MenuProvider } from "react-native-popup-menu";

import AppNavigator from "./src/navigation/AppNavigator";
import { UpdateProvider } from "./src/context/UpdateContext";
import UpdateModal from "./src/components/UpdateModal";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <MenuProvider>
        {/* ✅ Wrap with UpdateProvider */}
        <UpdateProvider owner="rahulsharmahere" repo="finfly">
          <NavigationContainer>
            <AppNavigator />
            {/* ✅ Only one UpdateModal reading the same context */}
            <UpdateModal />
          </NavigationContainer>
        </UpdateProvider>
      </MenuProvider>
    </GestureHandlerRootView>
  );
}
