import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CustomersTab from './tabs/CustomersTab';
import CustomerDetailScreen from './management/CustomerDetailScreen';

const Stack = createNativeStackNavigator();

export default function CustomersStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="CustomersList" component={CustomersTab} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
    </Stack.Navigator>
  );
}
