import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  Platform,
  Image,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter } from '../../hooks/useSafeRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAppContext } from '../../src/contexts/AppContext';
import { CYBER_THEME, BUTTON_THEMES } from '../../src/utils/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const { settings, updateSettings } = useAppContext();

  const [thresholdMinutes, setThresholdMinutes] = useState(settings.thresholdMinutes);
  const [buttonText, setButtonText] = useState(settings.buttonText);
  const [localSettings, setLocalSettings] = useState(settings);

  // 监听 settings 变化
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    if (isNaN(thresholdMinutes) || thresholdMinutes < 1) {
      Alert.alert('错误', '请输入有效的分钟数');
      return;
    }

    await updateSettings({
      thresholdMinutes: Math.round(thresholdMinutes),
      buttonText: buttonText.trim(),
    });
    Alert.alert('成功', '设置已保存');
  };

  const pickImage = async (type: 'main' | 'sidebar' = 'main') => {
    // 请求相册权限
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('权限不足', '需要相册权限来选择背景图片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      if (type === 'sidebar') {
        await updateSettings({
          sidebarBackground: result.assets[0].uri,
        });
      } else {
        await updateSettings({
          backgroundImage: result.assets[0].uri,
        });
      }
    }
  };

  const removeBackground = async (type: 'main' | 'sidebar' = 'main') => {
    if (type === 'sidebar') {
      await updateSettings({
        sidebarBackground: null,
      });
    } else {
      await updateSettings({
        backgroundImage: null,
      });
    }
  };

  const selectThemeColor = async (index: number) => {
    await updateSettings({
      currentThemeIndex: index,
    });
  };

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={CYBER_THEME.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>设置</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 阈值设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>提醒阈值</Text>
          <View style={styles.card}>
            <Text style={styles.label}>间隔时间</Text>
            <Text style={styles.hint}>超过此时间后显示&quot;已补充完毕&quot;</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderValue}>{thresholdMinutes} 分钟</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10080}  // 7天 = 10080分钟
                step={1}
                value={thresholdMinutes}
                onValueChange={setThresholdMinutes}
                minimumTrackTintColor={CYBER_THEME.primary}
                maximumTrackTintColor={CYBER_THEME.border}
                thumbTintColor={CYBER_THEME.primary}
              />
            </View>
          </View>
        </View>

        {/* 按钮文本设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>按钮文本</Text>
          <View style={styles.card}>
            <Text style={styles.label}>自定义文本（逗号分隔）</Text>
            <Text style={styles.hint}>每次点击会随机切换显示</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={buttonText}
              onChangeText={setButtonText}
              placeholder="开冲,锻炼,开始,记录"
              placeholderTextColor={CYBER_THEME.textMuted}
              multiline
            />
          </View>
        </View>

        {/* 主题颜色设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>按钮主题</Text>
          <View style={styles.card}>
            <View style={styles.themeGrid}>
              {BUTTON_THEMES.map((theme, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.themeItem,
                    settings.currentThemeIndex === index && styles.themeItemActive,
                  ]}
                  onPress={() => selectThemeColor(index)}
                >
                  <LinearGradient
                    colors={[theme.primary, theme.secondary]}
                    style={styles.themeGradient}
                  />
                  <Text style={styles.themeName}>{theme.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* 背景图片设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>背景图片</Text>
          <View style={styles.card}>
            {/* 主页背景 */}
            <View style={styles.bgSection}>
              <Text style={styles.bgSectionTitle}>主页背景</Text>
              {settings.backgroundImage ? (
                <View style={styles.bgPreview}>
                  <Image
                    source={{ uri: settings.backgroundImage }}
                    style={styles.bgImage}
                    resizeMode="cover"
                  />
                  <View style={styles.bgOverlay}>
                    <TouchableOpacity style={styles.bgButton} onPress={() => pickImage('main')}>
                      <Ionicons name="image-outline" size={20} color={CYBER_THEME.textPrimary} />
                      <Text style={styles.bgButtonText}>更换</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.bgButton, styles.bgButtonDanger]}
                      onPress={() => removeBackground('main')}
                    >
                      <Ionicons name="trash-outline" size={20} color={CYBER_THEME.accent} />
                      <Text style={[styles.bgButtonText, { color: CYBER_THEME.accent }]}>移除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.bgEmpty} onPress={() => pickImage('main')}>
                  <Ionicons name="image-outline" size={40} color={CYBER_THEME.textMuted} />
                  <Text style={styles.bgEmptyText}>点击选择主页背景图片</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 侧栏背景 */}
            <View style={[styles.bgSection, styles.bgSectionSeparator]}>
              <Text style={styles.bgSectionTitle}>侧栏背景</Text>
              {settings.sidebarBackground ? (
                <View style={styles.bgPreview}>
                  <Image
                    source={{ uri: settings.sidebarBackground }}
                    style={styles.bgImage}
                    resizeMode="cover"
                  />
                  <View style={styles.bgOverlay}>
                    <TouchableOpacity style={styles.bgButton} onPress={() => pickImage('sidebar')}>
                      <Ionicons name="image-outline" size={20} color={CYBER_THEME.textPrimary} />
                      <Text style={styles.bgButtonText}>更换</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.bgButton, styles.bgButtonDanger]}
                      onPress={() => removeBackground('sidebar')}
                    >
                      <Ionicons name="trash-outline" size={20} color={CYBER_THEME.accent} />
                      <Text style={[styles.bgButtonText, { color: CYBER_THEME.accent }]}>移除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.bgEmpty} onPress={() => pickImage('sidebar')}>
                  <Ionicons name="image-outline" size={40} color={CYBER_THEME.textMuted} />
                  <Text style={styles.bgEmptyText}>点击选择侧栏背景图片</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* 保存按钮 */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <LinearGradient
            colors={CYBER_THEME.gradientPrimary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveGradient}
          >
            <Text style={styles.saveText}>保存设置</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* 作者信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          <View style={styles.card}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: 'rgba(191,0,255,0.1)' }]}>
                  <Ionicons name="person-outline" size={22} color={CYBER_THEME.primary} />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>作者</Text>
                  <Text style={styles.menuItemSubtitle}>owofile</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 数据管理 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>数据管理</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/import-export')}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: 'rgba(0,240,255,0.1)' }]}>
                  <Ionicons name="swap-horizontal-outline" size={22} color={CYBER_THEME.primary} />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>导入/导出数据</Text>
                  <Text style={styles.menuItemSubtitle}>备份或恢复记录</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={CYBER_THEME.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 开发者模式 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>开发者</Text>
          <View style={styles.card}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.menuIcon, { backgroundColor: 'rgba(191,0,255,0.1)' }]}>
                  <Ionicons name="code-outline" size={22} color={CYBER_THEME.secondary} />
                </View>
                <View style={styles.menuItemText}>
                  <Text style={styles.menuItemTitle}>开发者模式</Text>
                  <Text style={styles.menuItemSubtitle}>启用测试和调试功能</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.switch,
                  localSettings.developerMode && styles.switchActive,
                ]}
                onPress={() => setLocalSettings({ ...localSettings, developerMode: !localSettings.developerMode })}
              >
                <View
                  style={[
                    styles.switchKnob,
                    localSettings.developerMode && styles.switchKnobActive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
  sectionTitle: {
    fontSize: 12,
    color: CYBER_THEME.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingLeft: 4,
  },
  card: {
    backgroundColor: CYBER_THEME.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CYBER_THEME.border,
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: CYBER_THEME.textPrimary,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 12,
    color: CYBER_THEME.textMuted,
  },
  label: {
    fontSize: 14,
    color: CYBER_THEME.textPrimary,
    fontWeight: '500',
    marginBottom: 4,
  },
  hint: {
    fontSize: 12,
    color: CYBER_THEME.textMuted,
    marginBottom: 12,
  },
  sliderContainer: {
    paddingVertical: 8,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '600',
    color: CYBER_THEME.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: CYBER_THEME.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: CYBER_THEME.primary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  unit: {
    marginLeft: 12,
    fontSize: 14,
    color: CYBER_THEME.textSecondary,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  themeItem: {
    width: '30%',
    marginHorizontal: '1.5%',
    marginBottom: 12,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: CYBER_THEME.background,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeItemActive: {
    borderColor: CYBER_THEME.primary,
  },
  themeGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  themeName: {
    fontSize: 11,
    color: CYBER_THEME.textSecondary,
    textAlign: 'center',
  },
  bgSection: {
    marginBottom: 12,
  },
  bgSectionSeparator: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: CYBER_THEME.border,
  },
  bgSectionTitle: {
    fontSize: 14,
    color: CYBER_THEME.textPrimary,
    fontWeight: '500',
    marginBottom: 8,
  },
  bgPreview: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  bgImage: {
    width: '100%',
    height: 150,
  },
  bgOverlay: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: CYBER_THEME.background,
  },
  bgButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 6,
    backgroundColor: CYBER_THEME.cardBackground,
  },
  bgButtonDanger: {
    backgroundColor: 'rgba(255,0,60,0.1)',
  },
  bgButtonText: {
    marginLeft: 6,
    fontSize: 13,
    color: CYBER_THEME.textPrimary,
    fontWeight: '500',
  },
  bgEmpty: {
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: CYBER_THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgEmptyText: {
    marginTop: 8,
    fontSize: 13,
    color: CYBER_THEME.textMuted,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
    ...CYBER_THEME.glowShadow,
  },
  saveGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: CYBER_THEME.background,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: CYBER_THEME.background,
    borderWidth: 1,
    borderColor: CYBER_THEME.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: CYBER_THEME.primary,
    borderColor: CYBER_THEME.primary,
  },
  switchKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: CYBER_THEME.textMuted,
  },
  switchKnobActive: {
    backgroundColor: CYBER_THEME.background,
    marginLeft: 'auto',
  },
});
