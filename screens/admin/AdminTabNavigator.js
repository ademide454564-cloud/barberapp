import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { View, StyleSheet } from 'react-native';

// Tab Screens
import AppointmentsTab from './tabs/AppointmentsTab';
import VisitsTab from './tabs/VisitsTab';
import NewActionTab from './tabs/NewActionTab';
import CustomersTab from './tabs/CustomersTab';
import MoreTab from './tabs/MoreTab';

const Tab = createBottomTabNavigator();

export default function AdminTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.inactive,
        tabBarStyle: {
          backgroundColor: Colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 65,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Randevular"
        component={AppointmentsTab}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons
              name="calendar-clock"
              size={focused ? 28 : 24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Ziyaretler"
        component={VisitsTab}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons
              name="receipt-text"
              size={focused ? 28 : 24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Yeni"
        component={NewActionTab}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.newButtonContainer}>
              <View style={[styles.newButton, focused && styles.newButtonFocused]}>
                <MaterialCommunityIcons
                  name="plus"
                  size={32}
                  color={Colors.textWhite}
                />
              </View>
            </View>
          ),
          tabBarLabel: '',
        }}
      />
      <Tab.Screen
        name="Müşteriler"
        component={CustomersTab}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons
              name="account-group"
              size={focused ? 28 : 24}
              color={color}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Diğer"
        component={MoreTab}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <MaterialCommunityIcons
              name="dots-horizontal-circle"
              size={focused ? 28 : 24}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  newButtonContainer: {
    position: 'absolute',
    top: -25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  newButtonFocused: {
    backgroundColor: Colors.primary,
    transform: [{ scale: 1.1 }],
  },
});
