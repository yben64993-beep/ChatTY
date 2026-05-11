import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Menu, Bolt, Crown } from 'lucide-react-native';

export default function Header({ navigation }) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.menuBtn} 
        onPress={() => navigation.openDrawer()}
      >
        <Menu size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.center}>
        <Image 
          source={require('../assets/logo.png')} 
          style={styles.logo} 
          defaultSource={require('../assets/icon.png')}
        />
        <Text style={styles.brandName}>MindTY</Text>
        <View style={styles.betaBadge}>
          <Text style={styles.betaText}>Beta</Text>
        </View>
      </View>

      <View style={styles.quotaPill}>
        <Bolt size={14} color="#10b981" />
        <Text style={styles.quotaText}>100</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#000',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  menuBtn: {
    padding: 5,
  },
  center: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  brandName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  betaBadge: {
    backgroundColor: '#38383A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  betaText: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: 'bold',
  },
  quotaPill: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#38383A',
  },
  quotaText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginHorizontal: 5,
  },
  progressContainer: {
    width: 30,
    height: 4,
    backgroundColor: '#38383A',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
});
