import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#f5f5f5',
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      
      {/* 详情页继续保留在 Stack 里，这样点进去可以盖住底部栏 */}
      <Stack.Screen name="product/[id]" options={{ title: 'Detail', headerShown: false }} />
    </Stack>
  );
}