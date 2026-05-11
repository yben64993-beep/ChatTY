import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { Send, Paperclip, Mic } from 'lucide-react-native';
import Markdown from 'react-native-markdown-display';
import { useAppContext } from '../context/AppContext';

const API_URL = 'http://localhost:3000/api/chat'; 

export default function ChatScreen() {
  const { newChatTrigger } = useAppContext();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (newChatTrigger > 0) {
      handleNewChat();
    }
  }, [newChatTrigger]);

  const handleNewChat = () => {
    setMessages([]);
  };

  const sendMessage = async () => {
    if (inputText.trim() === '' || isLoading) return;

    const userMessage = { id: Date.now().toString(), text: inputText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage.text,
          history: messages.slice(-5).map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
          }))
        }),
      });

      const data = await response.json();
      const botMessage = { 
        id: (Date.now() + 1).toString(), 
        text: data.answer || 'عذراً، حدث خطأ في الاتصال.', 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = { 
        id: (Date.now() + 1).toString(), 
        text: '⚠️ خطأ في الاتصال بالسيرفر.', 
        sender: 'bot' 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessage : styles.botMessage
    ]}>
      <View style={styles.avatar}>
        {item.sender === 'user' ? (
          <Image 
            source={{ uri: 'https://api.dicebear.com/7.x/initials/svg?seed=U' }} 
            style={styles.avatarImg} 
          />
        ) : (
          <Image 
            source={require('../assets/icon.png')} 
            style={styles.avatarImg} 
          />
        )}
      </View>
      <View style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.botBubble
      ]}>
        <Markdown style={markdownStyles}>{item.text}</Markdown>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>كيف يمكنني مساعدتك اليوم؟</Text>
          </View>
        )}
      />

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#10b981" />
          <Text style={styles.loadingText}>MindTY يفكر...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={styles.inputAreaWrapper}>
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.iconBtn}>
              <Paperclip size={22} color="#8E8E93" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconBtn}>
              <Mic size={22} color="#8E8E93" />
            </TouchableOpacity>

            <View style={styles.textareaWrap}>
              <TextInput
                style={styles.input}
                placeholder="اكتب رسالتك هنا..."
                placeholderTextColor="#8E8E93"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
            </View>

            <TouchableOpacity 
              style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Send size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const markdownStyles = StyleSheet.create({
  body: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
  },
  paragraph: {
    marginBottom: 0,
  },
  code_inline: {
    backgroundColor: '#38383A',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  code_block: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
  },
  fence: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 10,
    marginVertical: 5,
  },
  table: {
    borderWidth: 1,
    borderColor: '#38383A',
    borderRadius: 4,
  },
  th: {
    backgroundColor: '#2C2C2E',
    padding: 5,
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomColor: '#38383A',
  },
  td: {
    padding: 5,
  }
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '50%',
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 18,
  },
  listContent: {
    padding: 15,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row-reverse',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  userMessage: {
  },
  botMessage: {
    flexDirection: 'row',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  botBubble: {
    backgroundColor: 'transparent',
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'right',
  },
  inputAreaWrapper: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
    backgroundColor: '#000',
  },
  inputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  iconBtn: {
    padding: 8,
  },
  textareaWrap: {
    flex: 1,
    marginHorizontal: 10,
  },
  input: {
    color: '#fff',
    fontSize: 16,
    maxHeight: 120,
    textAlign: 'right',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  loadingText: {
    color: '#8E8E93',
    marginRight: 10,
    fontSize: 14,
  }
});
