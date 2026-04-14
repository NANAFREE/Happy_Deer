import { AuthProvider } from '../contexts/AuthContext';
import { AppProvider } from '../src/contexts/AppContext';
import { type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WebOnlyColorSchemeUpdater } from './ColorSchemeUpdater';
import { HeroUINativeProvider } from '../heroui';

function Provider({ children }: { children: ReactNode }) {
  return <WebOnlyColorSchemeUpdater>
    <AuthProvider>
      <AppProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <HeroUINativeProvider>
            {children}
          </HeroUINativeProvider>
        </GestureHandlerRootView>
      </AppProvider>
    </AuthProvider>
  </WebOnlyColorSchemeUpdater>
}

export {
  Provider,
}
