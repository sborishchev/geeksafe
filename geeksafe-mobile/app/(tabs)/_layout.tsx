import { Tabs } from 'expo-router';
import CustomTabBar from '../../components/bottomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false, // We will build a custom header to match Figma
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Scan Medicine' }}
      />
      <Tabs.Screen
        name="safety"
        options={{ title: 'Safety Scan' }}
      />
    </Tabs>
  );
}