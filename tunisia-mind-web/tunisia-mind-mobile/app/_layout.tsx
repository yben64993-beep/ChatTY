import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider, useAppContext } from '../context/AppContext';
import { Alert } from 'react-native';

SplashScreen.preventAutoHideAsync().catch(() => {});

function InnerLayout() {
  const { triggerNewChat, setShowSettings } = useAppContext();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => (
          <Sidebar 
            {...props} 
            onNewChat={triggerNewChat}
            onSettings={() => setShowSettings(true)}
            onArchives={() => Alert.alert('الأرشيف', 'سيتم تفعيل هذه الميزة في التحديث القادم.')}
            onSavedImages={() => Alert.alert('الصور المحفوظة', 'سيتم تفعيل هذه الميزة في التحديث القادم.')}
            onAIWebsites={() => Alert.alert('مواقع بالذكاء الاصطناعي', 'سيتم تفعيل هذه الميزة في التحديث القادم.')}
          />
        )}
        screenOptions={{
          header: (props) => <Header {...props} />,
          drawerPosition: 'right',
          drawerStyle: {
            width: '80%',
          },
        }}
      >
        <Drawer.Screen 
          name="index" 
          options={{
            title: 'MindTY Chat',
          }} 
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppProvider>
      <InnerLayout />
    </AppProvider>
  );
}
