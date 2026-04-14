import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { getAllRecords, importRecords } from '../../src/database/db';
import { readFileContent, saveToDownloads, exportToCSV, exportToJSON, generateBackupFilename, shareFile } from '../../src/utils/dataTransfer';
import { parseImportData } from '../../src/utils/dataTransfer';
import { CYBER_THEME } from '../../src/utils/theme';
import { RecordEntry } from '../../src/models/types';

type ExportFormat = 'csv' | 'json';

export default function ImportExportScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  // 导出数据
  const handleExport = useCallback(async (format: ExportFormat) => {
    try {
      setLoading(true);

      const records = await getAllRecords();
      if (records.length === 0) {
        Alert.alert('提示', '没有可导出的数据');
        return;
      }

      const content = format === 'csv' ? exportToCSV(records) : exportToJSON(records);
      const filename = generateBackupFilename(format);

      const fileUri = await saveToDownloads(filename, content);

      await shareFile(fileUri, format === 'csv' ? 'text/csv' : 'application/json');
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('错误', '导出失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // 导入数据
  const handleImport = useCallback(async () => {
    try {
      setImporting(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/json', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const file = result.assets[0];
      console.log('[Import] 选择的文件:', file.name, file.uri);

      const content = await readFileContent(file.uri);
      console.log('[Import] 文件内容长度:', content.length);

      // 解析数据
      let records: RecordEntry[] = [];

      if (file.name.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          records = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          Alert.alert('错误', 'JSON 格式解析失败');
          return;
        }
      } else {
        // 尝试解析 CSV 或用户提供的文本格式
        records = await parseImportData(content);
      }

      console.log('[Import] 解析到的记录数:', records.length);
      if (records.length > 0) {
        console.log('[Import] 第一条记录:', records[0]);
      }

      if (records.length === 0) {
        Alert.alert('提示', '未找到有效数据，请检查文件格式');
        return;
      }

      // 确认导入
      Alert.alert(
        '确认导入',
        `发现 ${records.length} 条记录，是否导入？\n\n注意：这将追加到现有数据中。`,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '导入',
            onPress: async () => {
              try {
                console.log('[Import] 开始导入记录...');
                const count = await importRecords(records);
                console.log('[Import] 导入完成，实际导入:', count, '条记录');

                Alert.alert(
                  '成功',
                  `已导入 ${count} 条记录\n\n请在"数据分析"页面查看`,
                  [
                    {
                      text: '查看',
                      onPress: () => router.push('/analytics'),
                    },
                    { text: '确定' },
                  ]
                );
              } catch (error) {
                console.error('[Import] 导入错误:', error);
                Alert.alert('错误', `导入失败：${error instanceof Error ? error.message : '请检查数据格式'}`);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('[Import] 导入过程错误:', error);
      Alert.alert('错误', `读取文件失败：${error instanceof Error ? error.message : '请重试'}`);
    } finally {
      setImporting(false);
    }
  }, [router]);

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={CYBER_THEME.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>导入导出</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 导出部分 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <Ionicons name="download-outline" size={24} color={CYBER_THEME.primary} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>导出数据</Text>
              <Text style={styles.sectionSubtitle}>将记录备份为文件</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>选择导出格式</Text>
            
            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleExport('csv')}
              disabled={loading}
            >
              <View style={styles.exportOptionContent}>
                <Ionicons name="document-text-outline" size={28} color={CYBER_THEME.primary} />
                <View style={styles.exportOptionText}>
                  <Text style={styles.exportOptionTitle}>CSV 格式</Text>
                  <Text style={styles.exportOptionDesc}>兼容 Excel 和大多数应用</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={CYBER_THEME.textMuted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.exportOption}
              onPress={() => handleExport('json')}
              disabled={loading}
            >
              <View style={styles.exportOptionContent}>
                <Ionicons name="code-slash-outline" size={28} color={CYBER_THEME.secondary} />
                <View style={styles.exportOptionText}>
                  <Text style={styles.exportOptionTitle}>JSON 格式</Text>
                  <Text style={styles.exportOptionDesc}>保留完整数据结构</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={CYBER_THEME.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 导入部分 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: 'rgba(0,255,136,0.1)' }]}>
              <Ionicons name="download-outline" size={24} color={CYBER_THEME.success} />
            </View>
            <View>
              <Text style={styles.sectionTitle}>导入数据</Text>
              <Text style={styles.sectionSubtitle}>从备份文件恢复记录</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>支持格式</Text>
            
            <View style={styles.formatList}>
              <View style={styles.formatItem}>
                <View style={[styles.formatDot, { backgroundColor: CYBER_THEME.primary }]} />
                <Text style={styles.formatText}>CSV 文件 (.csv)</Text>
              </View>
              <View style={styles.formatItem}>
                <View style={[styles.formatDot, { backgroundColor: CYBER_THEME.secondary }]} />
                <Text style={styles.formatText}>JSON 文件 (.json)</Text>
              </View>
              <View style={styles.formatItem}>
                <View style={[styles.formatDot, { backgroundColor: CYBER_THEME.success }]} />
                <Text style={styles.formatText}>纯文本格式（兼容你的数据）</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.importButton}
              onPress={handleImport}
              disabled={importing}
            >
              {importing ? (
                <ActivityIndicator color={CYBER_THEME.background} />
              ) : (
                <>
                  <Ionicons name="folder-open-outline" size={20} color={CYBER_THEME.background} />
                  <Text style={styles.importButtonText}>选择文件导入</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.importHint}>
              导入数据会追加到现有记录中，不会覆盖已有数据
            </Text>
          </View>
        </View>

        {/* 格式说明 */}
        <View style={styles.infoSection}>
          <LinearGradient
            colors={['rgba(0,240,255,0.1)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.infoGradient}
          >
            <Ionicons name="information-circle-outline" size={20} color={CYBER_THEME.primary} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>格式说明</Text>
              <Text style={styles.infoText}>
                系统支持导入你提供的文本格式数据，会自动解析以下字段：
                ID、Date、Time、Frequency、Last Datetime、Interval Time、Remarks
              </Text>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={CYBER_THEME.primary} />
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,240,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: CYBER_THEME.textPrimary,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: CYBER_THEME.textMuted,
  },
  card: {
    backgroundColor: CYBER_THEME.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CYBER_THEME.border,
    padding: 16,
  },
  cardTitle: {
    fontSize: 12,
    color: CYBER_THEME.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  exportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  exportOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportOptionText: {
    marginLeft: 14,
  },
  exportOptionTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: CYBER_THEME.textPrimary,
    marginBottom: 2,
  },
  exportOptionDesc: {
    fontSize: 12,
    color: CYBER_THEME.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: CYBER_THEME.border,
    marginVertical: 8,
  },
  formatList: {
    marginBottom: 16,
  },
  formatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  formatDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  formatText: {
    fontSize: 13,
    color: CYBER_THEME.textSecondary,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CYBER_THEME.success,
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 12,
  },
  importButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: '600',
    color: CYBER_THEME.background,
    letterSpacing: 1,
  },
  importHint: {
    fontSize: 11,
    color: CYBER_THEME.textMuted,
    textAlign: 'center',
  },
  infoSection: {
    marginTop: 8,
  },
  infoGradient: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CYBER_THEME.border,
    padding: 16,
    flexDirection: 'row',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: CYBER_THEME.primary,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    color: CYBER_THEME.textSecondary,
    lineHeight: 18,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
