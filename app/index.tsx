import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

export default function Index() {
  const { user } = useAuth();

  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role === 'caregiver') return <Redirect href="/(caregiver)/dashboard" />;
  return <Redirect href="/(patient)/exercises" />;
}
