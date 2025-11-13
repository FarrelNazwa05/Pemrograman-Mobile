import React from 'react';
import { NavigationContainer } from '@react-navigation/native';

import { RootStackNavigator } from './src/providers/RooteStackNavigator';
import { AuthProvider } from './src/providers/AuthProvider';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
      <RootStackNavigator />  
    </NavigationContainer>
    </AuthProvider>
  );
}