import React from 'react';
import { View } from 'react-native';
import AdminTabNavigator from './admin/AdminTabNavigator';

export default function AdminScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <AdminTabNavigator />
    </View>
  );
}
