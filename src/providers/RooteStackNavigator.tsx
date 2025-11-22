import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { Note } from '../lib/notes';
import { useAuth } from '../hooks/useAuth';
import { HomeScreen } from '../screens/HomeScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { NoteFormScreen } from '../screens/NoteFormScreen';

type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  NoteForm: { note?: Note }; // note bisa undefined (buat add baru)
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStackNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen 
            name="NoteForm" 
            component={NoteFormScreen} 
            options={{ headerShown: true, title: 'Note' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}