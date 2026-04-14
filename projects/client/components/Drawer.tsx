import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
  ImageBackground,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter } from '../hooks/useSafeRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppContext } from '../src/contexts/AppContext';
import { CYBER_THEME } from '../src/utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  isActive?: boolean;
}

function MenuItem({ icon, label, onPress, isActive }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, isActive && styles.menuItemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, isActive && styles.menuIconActive]}>
        <Ionicons
          name={icon as any}
          size={22}
          color={isActive ? CYBER_THEME.primary : CYBER_THEME.textSecondary}
        />
      </View>
      <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
        {label}
      </Text>
      {isActive && (
        <View style={styles.activeIndicator} />
      )}
    </TouchableOpacity>
  );
}

export default function DrawerContent() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const { setDrawerOpen, records, settings } = useAppContext();
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(-DRAWER_WIDTH);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
    ]).start();
  }, []);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerOpen(false);
    });
  };

  const navigateTo = (path: string) => {
    handleClose();
    setTimeout(() => {
      router.push(path);
    }, 300);
  };

  return (
    <View style={styles.container}>
      {/* 遮罩层 */}
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={styles.overlayPress} onPress={handleClose} />
      </Animated.View>

      {/* 抽屉内容 */}
      <Animated.View
        style={[
          styles.drawer,
          {
            paddingTop: insets.top,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        {/* 背景图片层 */}
        {settings.sidebarBackground ? (
          <ImageBackground
            source={{ uri: settings.sidebarBackground }}
            style={styles.drawerBackground}
            resizeMode="cover"
          >
            <View style={styles.drawerOverlay} />
          </ImageBackground>
        ) : null}

        {/* 内容层 */}
        <View style={styles.content}>
          {/* 头部 */}
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={['#00F0FF', '#BF00FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradient}
              >
                <Ionicons name="finger-print" size={32} color={CYBER_THEME.background} />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>记录追踪</Text>
            <Text style={styles.statsText}>
              共 {records.length} 条记录
            </Text>
          </View>

          {/* 渐变分隔线 */}
          <LinearGradient
            colors={['transparent', 'rgba(0,240,255,0.15)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.divider}
          />

          {/* 菜单项 */}
          <View style={styles.menu}>
            <MenuItem
              icon="home-outline"
              label="首页"
              onPress={() => navigateTo('/')}
            />
            <MenuItem
              icon="analytics-outline"
              label="数据分析"
              onPress={() => navigateTo('/analytics')}
            />
            {settings.developerMode && (
              <MenuItem
                icon="code-outline"
                label="开发者模式"
                onPress={() => navigateTo('/developer')}
              />
            )}
            <MenuItem
              icon="settings-outline"
              label="设置"
              onPress={() => navigateTo('/settings')}
            />
          </View>

          {/* 底部信息 */}
          <View style={styles.footer}>
            <LinearGradient
              colors={['#00F0FF', '#BF00FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.footerLine}
            />
            <Text style={styles.footerText}>v1.0.0</Text>
            <Text style={styles.footerSubtext}>记录每一次成长</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  overlayPress: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: CYBER_THEME.background,
    borderRightWidth: 1,
    borderRightColor: CYBER_THEME.border,
  },
  drawerBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,15,0.85)',
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: CYBER_THEME.textPrimary,
    letterSpacing: 2,
    marginBottom: 4,
  },
  statsText: {
    fontSize: 12,
    color: CYBER_THEME.textSecondary,
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  menu: {
    flex: 1,
    paddingHorizontal: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  menuItemActive: {
    backgroundColor: 'rgba(0,240,255,0.08)',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: CYBER_THEME.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuIconActive: {
    backgroundColor: 'rgba(0,240,255,0.15)',
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: CYBER_THEME.textSecondary,
    flex: 1,
  },
  menuLabelActive: {
    color: CYBER_THEME.primary,
    fontWeight: '600',
  },
  activeIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: CYBER_THEME.primary,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerLine: {
    height: 2,
    width: 60,
    borderRadius: 1,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: CYBER_THEME.textMuted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: CYBER_THEME.textMuted,
    letterSpacing: 1,
  },
});
