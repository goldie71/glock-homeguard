import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Text style={styles.title}>G-LOCK</Text>
      <Text style={styles.subtitle}>HOMEGUARD</Text>
      <Text style={styles.tagline}>Facial Recognition Access Control</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e17',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#bb901e',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 8,
  },
  subtitle: {
    color: '#555',
    fontSize: 16,
    letterSpacing: 4,
    marginTop: 4,
  },
  tagline: {
    color: '#333',
    fontSize: 12,
    marginTop: 16,
  },
});
