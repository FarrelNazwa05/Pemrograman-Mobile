// src/screens/NoteFormScreen.tsx (FIXED + CANTIK + TOMBOL SELALU KELIHATAN)

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createNote, updateNote, Note } from '../lib/notes';
import { useAuth } from '../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

type RootStackParamList = {
  Home: undefined;
  NoteForm: { note?: Note };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function NoteFormScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<any>();
  const note: Note | undefined = route.params?.note;
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShow = () => setKeyboardVisible(true);
    const keyboardDidHide = () => setKeyboardVisible(false);

    const showListener = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
    const hideListener = Keyboard.addListener('keyboardDidHide', keyboardDidHide);

    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
      navigation.setOptions({ title: 'Edit Catatan' });
    } else {
      navigation.setOptions({ title: 'Catatan Baru' });
    }
  }, [note, navigation]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Judul tidak boleh kosong');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'User tidak terautentikasi');
      return;
    }

    setLoading(true);
    try {
      if (note) {
        await updateNote(note.id, title, content);
      } else {
        await createNote(user.uid, title, content);
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Gagal menyimpan catatan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 30}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.titleInput}
          placeholder="Judul catatan..."
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#999"
          autoFocus={!note}
        />

        <TextInput
          style={styles.contentInput}
          placeholder="Mulai mengetik..."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          placeholderTextColor="#999"
        />
      </ScrollView>

      {/* Tombol Simpan SELALU di bawah & tidak ketutupan keyboard */}
      <View style={[styles.bottomBar, keyboardVisible && styles.bottomBarElevated]}>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Ionicons name="checkmark" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  titleInput: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingTop: 20,
    color: '#333',
  },
  contentInput: {
    flex: 1,
    fontSize: 18,
    lineHeight: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    color: '#333',
    minHeight: 400,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  bottomBarElevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
  },
  saveButton: {
    flexDirection: 'row',
    backgroundColor: '#4F46E5',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  saveButtonDisabled: {
    backgroundColor: '#999',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});