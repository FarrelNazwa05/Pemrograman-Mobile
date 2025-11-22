// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { subscribeToNotes, deleteNote, Note } from '../lib/notes';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Home: undefined;
  NoteForm: { note?: Note };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [notes, setNotes] = useState<Note[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load notes (dipakai untuk pertama + refresh)
  const loadNotes = useCallback(() => {
    if (!user?.uid) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToNotes(user.uid, (fetchedNotes) => {
      setNotes(fetchedNotes);
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  }, [user?.uid]);

  // Subscribe pertama kali
  useEffect(() => {
    const unsubscribe = loadNotes();
    return () => unsubscribe && unsubscribe();
  }, [loadNotes]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotes();
  }, [loadNotes]);

  const handleLogout = () => {
    Alert.alert('Keluar', 'Apakah kamu yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert('Error', 'Gagal logout');
          }
        },
      },
    ]);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Hapus Catatan', 'Catatan ini akan dihapus permanen.', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNote(id);
          } catch (err: any) {
            Alert.alert('Error', err.message || 'Gagal menghapus');
          }
        },
      },
    ]);
  };

  const openNoteForm = (note?: Note) => {
    navigation.navigate('NoteForm', { note });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Halo, Selamat Datang!</Text>
          <Text style={styles.username}>
            {user?.displayName
              ? `@${user.displayName}`
              : user?.email?.split('@')[0] || '@pengguna'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <Image
            source={{
              uri: user?.photoURL || 'https://i.pinimg.com/1200x/96/b8/8f/96b88fd2405d1c38ca84fa6585adfe39.jpg',
            }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Daftar Catatan */}
      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
        ListHeaderComponent={
          <>
            {/* Welcome Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>NebuNote</Text>
              <Text style={styles.cardSubtitle}>
                Catat ide, tugas, atau apapun yang penting untukmu.
              </Text>
              <TouchableOpacity style={styles.button} onPress={() => openNoteForm()}>
                <Text style={styles.buttonText}>Buat Catatan Baru</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Catatan Saya ({notes.length})</Text>
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Memuat catatan...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={72} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Belum ada catatan</Text>
              <Text style={styles.emptySubtitle}>
                Tarik ke bawah atau tekan tombol + untuk mulai mencatat
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.noteCard}
            onPress={() => openNoteForm(item)}
            activeOpacity={0.8}
          >
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle} numberOfLines={1}>
                {item.title || 'Tanpa Judul'}
              </Text>
              <Text style={styles.noteDate}>
                {item.updatedAt?.toDate?.().toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }) || 'Tanggal tidak tersedia'}
              </Text>
            </View>

            <Text style={styles.noteDescription} numberOfLines={3}>
              {item.content || 'Tidak ada konten'}
            </Text>

            <View style={styles.noteActions}>
              <TouchableOpacity
                style={styles.noteActionButton}
                onPress={() => openNoteForm(item)}
              >
                <Ionicons name="create-outline" size={20} color="#2563EB" />
                <Text style={styles.noteActionText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.noteActionButton}
                onPress={() => confirmDelete(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
                <Text style={[styles.noteActionText, styles.deleteText]}>Hapus</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => openNoteForm()} activeOpacity={0.8}>
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 NebuNote. All rights reserved.</Text>
      </View>
    </SafeAreaView>
  );
}

// === STYLES LENGKAP & CANTIK ===
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  username: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  logoutButton: {
    padding: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 30,
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#E0E7FF',
    marginBottom: 20,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 10,
  },
  noteDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  noteDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
  },
  noteActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  noteActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteText: {
    color: '#EF4444',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#4F46E5',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});