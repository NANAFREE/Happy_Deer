import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider } from '../components/Provider';
import { View } from 'react-native';
import { useAppContext } from '../src/contexts/AppContext';
import DrawerContent from '../components/Drawer';

import '../global.css';

LogBox.ignoreLogs([
  "TurboModuleRegistry.getEnforcing(...): 'RNMapsAirModule' could not be found",
  // 添加其它想暂时忽略的错误或警告信息
]);

function RootLayoutContent() {
  const { isDrawerOpen } = useAppContext();

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          animation: 'none',
          gestureEnabled: false,
          gestureDirection: 'horizontal',
          headerShown: false
        }}
      >
        <Stack.Screen name="index" options={{ title: "" }} />
        <Stack.Screen name="analytics" options={{ title: "" }} />
        <Stack.Screen name="settings" options={{ title: "" }} />
        <Stack.Screen name="import-export" options={{ title: "" }} />
        <Stack.Screen name="developer" options={{ title: "" }} />
      </Stack>
      
      {/* 全局侧栏 */}
      {isDrawerOpen && <DrawerContent />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <Provider>
      <StatusBar style="light" />
      <RootLayoutContent />
      <Toast />
    </Provider>
  );
}
