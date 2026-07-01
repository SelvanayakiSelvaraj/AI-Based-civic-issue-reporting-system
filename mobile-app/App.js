import 'react-native-gesture-handler';
import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';

// Placeholder Screens
import LoginScreen from './screens/Auth/LoginScreen';
import RegisterScreen from './screens/Auth/RegisterScreen';
import CitizenDashboard from './screens/Citizen/DashboardScreen';
import ReportIssueScreen from './screens/Citizen/ReportIssueScreen';
import MyReportsScreen from './screens/Citizen/MyReportsScreen';
import AdminDashboard from './screens/Admin/AdminDashboardScreen';
import TaskBoard from './screens/Technician/TaskBoardScreen';

const Stack = createStackNavigator();

const normalizeRole = (role) => {
  if (!role) return null;
  const cleaned = String(role).trim();
  switch (cleaned.toLowerCase()) {
    case 'citizen':
      return 'Citizen';
    case 'admin':
      return 'Admin';
    case 'technician':
    case 'tech':
      return 'Technician';
    default:
      return null;
  }
};

const RoleErrorScreen = ({ logout }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#0f172a' }}>
    <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12 }}>Invalid user role</Text>
    <Text style={{ color: '#cbd5e1', textAlign: 'center', marginBottom: 24 }}>
      We could not determine your account type. Please log out and sign in again.
    </Text>
    <TouchableOpacity onPress={logout} style={{ backgroundColor: '#3b82f6', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12 }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Log Out</Text>
    </TouchableOpacity>
  </View>
);

const AppNav = () => {
  const { isLoading, userToken, userRole, logout } = useContext(AuthContext);
  const normalizedRole = normalizeRole(userRole);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {userToken === null ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          // Main Work Stack based on User Role
          <>
            {normalizedRole === 'Citizen' && (
              <>
                <Stack.Screen name="CitizenDashboard" component={CitizenDashboard} />
                <Stack.Screen name="ReportIssue" component={ReportIssueScreen} />
                <Stack.Screen name="MyReports" component={MyReportsScreen} />
              </>
            )}
            {normalizedRole === 'Admin' && (
              <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            )}
            {normalizedRole === 'Technician' && (
              <Stack.Screen name="TaskBoard" component={TaskBoard} />
            )}
            {normalizedRole === null && (
              <Stack.Screen name="RoleError">
                {() => <RoleErrorScreen logout={logout} />}
              </Stack.Screen>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppNav />
    </AuthProvider>
  );
}
