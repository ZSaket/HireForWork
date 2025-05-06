import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../(tabs)/hirer/HirerDashboard';
// import PaymentScreen from '@/app/screens/PaymentScreen';

const Tab = createBottomTabNavigator();

export default function HirerTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={Home} />
      {/* <Tab.Screen name="Create Job" component={CreateJob} />
      <Tab.Screen name="Profile" component={Profile} /> */}
    </Tab.Navigator>
  );
}
