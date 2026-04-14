import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../../src/contexts/AppContext';
import { addRecord, getAllRecords, deleteRecord, getRecordStats } from '../../src/database/db';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CYBER_THEME } from '../../src/utils/theme';

export default function DeveloperScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const { refreshData } = useAppContext();

  const [loading, setLoading] = useState(false);
  const [recordCount, setRecordCount] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<any>(null);

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [records, statsData] = await Promise.all([
        getAllRecords(),
        getRecordStats(),
      ]);
      setRecordCount(records.length);
      setStats(statsData);

      // 获取存储信息
      const data = await AsyncStorage.getItem('clicktracker_data');
      const settings = await AsyncStorage.getItem('clicktracker_settings');
      setStorageInfo({
        data: data ? JSON.parse(data) : [],
        settings: settings ? JSON.parse(settings) : null,
        dataSize: data ? JSON.stringify(data).length : 0,
      });
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 测试添加数据
  const handleAddTestRecord = async () => {
    try {
      setLoading(true);
      await addRecord();
      await loadData();
      await refreshData();
      Alert.alert('成功', '已添加测试记录');
    } catch (error) {
      console.error('添加测试记录失败:', error);
      Alert.alert('错误', '添加失败');
    } finally {
      setLoading(false);
    }
  };

  // 批量添加测试数据
  const handleAddBatchRecords = async () => {
    try {
      setLoading(true);
      for (let i = 0; i < 10; i++) {
        await addRecord();
      }
      await loadData();
      await refreshData();
      Alert.alert('成功', '已添加 10 条测试记录');
    } catch (error) {
      console.error('批量添加失败:', error);
      Alert.alert('错误', '批量添加失败');
    } finally {
      setLoading(false);
    }
  };

  // 清空所有数据
  const handleClearAllData = async () => {
    Alert.alert(
      '确认清空',
      '确定要清空所有数据吗？此操作不可撤销！',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await AsyncStorage.clear();
              await loadData();
              await refreshData();
              Alert.alert('成功', '已清空所有数据');
            } catch (error) {
              console.error('清空数据失败:', error);
              Alert.alert('错误', '清空失败');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // 查看当前数据
  const handleViewData = async () => {
    try {
      const records = await getAllRecords();
      const dataStr = JSON.stringify(records.slice(0, 10), null, 2);
      const message = records.length > 10
        ? `前 10 条数据：\n\n${dataStr}\n\n... 还有 ${records.length - 10} 条记录`
        : dataStr;
      Alert.alert('当前数据', message);
    } catch (error) {
      console.error('查看数据失败:', error);
      Alert.alert('错误', '查看失败');
    }
  };

  // 删除最后一条记录
  const handleDeleteLastRecord = async () => {
    try {
      const records = await getAllRecords();
      if (records.length === 0) {
        Alert.alert('提示', '没有记录可删除');
        return;
      }

      const lastRecord = records[0];
      await deleteRecord(lastRecord.id);
      await loadData();
      await refreshData();
      Alert.alert('成功', '已删除最后一条记录');
    } catch (error) {
      console.error('删除记录失败:', error);
      Alert.alert('错误', '删除失败');
    }
  };

  // 刷新数据
  const handleRefresh = async () => {
    await loadData();
    await refreshData();
  };

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={CYBER_THEME.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>开发者模式</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color={CYBER_THEME.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 数据统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据统计</Text>
          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{recordCount}</Text>
              <Text style={styles.statLabel}>总记录数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{storageInfo?.dataSize || 0}</Text>
              <Text style={styles.statLabel}>存储大小（字节）</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.today || 0}</Text>
              <Text style={styles.statLabel}>今日记录</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats?.avgInterval?.toFixed(0) || 0}</Text>
              <Text style={styles.statLabel}>平均间隔（秒）</Text>
            </View>
          </View>
        </View>

        {/* 测试操作 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>测试操作</Text>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleAddTestRecord}
            disabled={loading}
          >
            <LinearGradient
              colors={['rgba(0,240,255,0.2)', 'rgba(0,240,255,0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.testButtonGradient}
            >
              <Ionicons name="add-circle-outline" size={24} color={CYBER_THEME.primary} />
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>添加测试记录</Text>
                <Text style={styles.testButtonDesc}>添加一条当前时间的记录</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleAddBatchRecords}
            disabled={loading}
          >
            <LinearGradient
              colors={['rgba(191,0,255,0.2)', 'rgba(191,0,255,0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.testButtonGradient}
            >
              <Ionicons name="list-outline" size={24} color={CYBER_THEME.secondary} />
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>批量添加（10条）</Text>
                <Text style={styles.testButtonDesc}>快速添加多条测试数据</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.testButton}
            onPress={handleDeleteLastRecord}
            disabled={loading}
          >
            <LinearGradient
              colors={['rgba(255,0,136,0.2)', 'rgba(255,0,136,0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.testButtonGradient}
            >
              <Ionicons name="trash-outline" size={24} color={CYBER_THEME.accent} />
              <View style={styles.testButtonContent}>
                <Text style={styles.testButtonTitle}>删除最后一条</Text>
                <Text style={styles.testButtonDesc}>删除最近添加的记录</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 数据管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据管理</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleViewData}
          >
            <Ionicons name="eye-outline" size={20} color={CYBER_THEME.primary} />
            <Text style={styles.actionButtonText}>查看当前数据</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleClearAllData}
          >
            <Ionicons name="warning-outline" size={20} color={CYBER_THEME.accent} />
            <Text style={[styles.actionButtonText, styles.dangerButtonText]}>清空所有数据</Text>
          </TouchableOpacity>
        </View>

        {/* 调试信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>调试信息</Text>
          <View style={styles.debugCard}>
            <Text style={styles.debugText}>
              记录数: {recordCount}
            </Text>
            <Text style={styles.debugText}>
              数据大小: {storageInfo?.dataSize || 0} bytes
            </Text>
            <Text style={styles.debugText}>
              今日记录: {stats?.today || 0}
            </Text>
            <Text style={styles.debugText}>
              平均间隔: {stats?.avgInterval?.toFixed(2) || 0} 秒
            </Text>
          </View>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={CYBER_THEME.primary} />
          <Text style={styles.loadingText}>处理中...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CYBER_THEME.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: CYBER_THEME.border,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: CYBER_THEME.textPrimary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  refreshButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: CYBER_THEME.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  statCard: {
    width: '50%',
    padding: 16,
    marginHorizontal: 4,
    marginBottom: 8,
    backgroundColor: CYBER_THEME.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CYBER_THEME.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: CYBER_THEME.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: CYBER_THEME.textMuted,
    textTransform: 'uppercase',
  },
  testButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CYBER_THEME.border,
  },
  testButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  testButtonContent: {
    flex: 1,
    marginLeft: 14,
  },
  testButtonTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: CYBER_THEME.textPrimary,
    marginBottom: 4,
  },
  testButtonDesc: {
    fontSize: 12,
    color: CYBER_THEME.textMuted,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CYBER_THEME.cardBackground,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: CYBER_THEME.border,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: CYBER_THEME.textPrimary,
  },
  dangerButton: {
    borderColor: CYBER_THEME.accent,
  },
  dangerButtonText: {
    color: CYBER_THEME.accent,
  },
  debugCard: {
    backgroundColor: CYBER_THEME.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CYBER_THEME.border,
    padding: 16,
  },
  debugText: {
    fontSize: 13,
    color: CYBER_THEME.textSecondary,
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: CYBER_THEME.textPrimary,
  },
});
