import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, SafeAreaView } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Plus, Box, Image as ImageIcon, Wand2, Gear, LogOut, Crown, MessageSquare } from 'lucide-react-native';

export default function Sidebar({ navigation, onNewChat, onSettings, onArchives, onSavedImages, onAIWebsites }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.newChatBtn} onPress={() => { onNewChat(); navigation.closeDrawer(); }}>
          <Plus size={20} color="#fff" />
          <Text style={styles.btnText}>محادثة جديدة</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => { onArchives(); navigation.closeDrawer(); }}>
          <Box size={20} color="#fff" />
          <Text style={styles.btnText}>الأرشيف</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => { onSavedImages(); navigation.closeDrawer(); }}>
          <ImageIcon size={20} color="#fff" />
          <Text style={styles.btnText}>الصور المحفوظة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.aiWebsitesBtn} onPress={() => { onAIWebsites(); navigation.closeDrawer(); }}>
          <Wand2 size={20} color="#fff" />
          <Text style={styles.btnText}>مواقع بالذكاء الاصطناعي</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.sectionLabel}>اليوم</Text>
        <ScrollView style={styles.historyList}>
          {/* Mock history items to match the UI */}
          <HistoryItem title="محادثة جديدة" active />
          <HistoryItem title="كيف أصمم تطبيق؟" />
          <HistoryItem title="أهم معالم تونس" />
        </ScrollView>
      </View>

      <View style={styles.footer}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://api.dicebear.com/7.x/initials/svg?seed=U' }} 
              style={styles.avatar} 
            />
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.userName}>مستخدم MindTY</Text>
          <Crown size={16} color="#fbbf24" style={{ marginLeft: 5 }} />
        </View>
        
        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.footerBtn} onPress={() => { onSettings(); navigation.closeDrawer(); }}>
            <Gear size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerBtn}>
            <LogOut size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

function HistoryItem({ title, active }) {
  return (
    <TouchableOpacity style={[styles.historyItem, active && styles.historyItemActive]}>
      <MessageSquare size={16} color={active ? "#fff" : "#8E8E93"} />
      <Text style={[styles.historyText, active && styles.historyTextActive]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717', // Match website sidebar bg
  },
  header: {
    padding: 15,
  },
  newChatBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#10b981', // Match website primary
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  secondaryBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#262626',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  aiWebsitesBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    // Add gradient feel via style if possible
  },
  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 10,
  },
  historySection: {
    flex: 1,
    paddingHorizontal: 15,
  },
  sectionLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'right',
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
  },
  historyItemActive: {
    backgroundColor: '#262626',
  },
  historyText: {
    color: '#8E8E93',
    fontSize: 14,
    marginRight: 10,
  },
  historyTextActive: {
    color: '#fff',
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#262626',
  },
  userInfo: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    position: 'relative',
    marginLeft: 10,
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#171717',
  },
  userName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footerActions: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  footerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#262626',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
