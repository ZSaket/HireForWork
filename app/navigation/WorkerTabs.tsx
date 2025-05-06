import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import JobsAvailable from '../(tabs)/worker/Jobs';
import WorkerDashboard from '../(tabs)/worker/WorkerDashboard';
// import MyTasks from '../screens/worker/MyTasks';


const Tab = createBottomTabNavigator();

export default function WorkerTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Jobs" component={JobsAvailable} />
      {/* <Tab.Screen name="My Tasks" component={MyTasks} /> */}
      <Tab.Screen name="Profile" component={WorkerDashboard} />
    </Tab.Navigator>
  );
}
