/* eslint-disable react-hooks/refs */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  ImageBackground,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../../src/contexts/AppContext';
import { getElapsedSeconds, formatDuration, isBeyondThreshold } from '../../src/utils/timeUtils';
import { CYBER_THEME, getThemeByIndex } from '../../src/utils/theme';
import { isCurrentSessionRecord } from '../../src/database/db';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_SIZE = Math.min(SCREEN_WIDTH * 0.6, 220);

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    isDbReady,
    latestRecord,
    records,
    sessionRecordAdded,
    addNewRecord,
    undoLastRecord,
    settings,
    isDrawerOpen,
    setDrawerOpen,
    getCurrentButtonText,
  } = useAppContext();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const pulseAnimRef = useRef(new Animated.Value(1));
  const scaleAnimRef = useRef(new Animated.Value(1));
  const glowAnimRef = useRef(new Animated.Value(0));
  
  // Keep refs stable for event handlers
  const pulseAnim = pulseAnimRef.current;
  const scaleAnim = scaleAnimRef.current;
  const glowAnim = glowAnimRef.current;

  // 计算时间差
  useEffect(() => {
    const updateElapsed = () => {
      const elapsed = getElapsedSeconds(latestRecord);
      setElapsedSeconds(elapsed);
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [latestRecord]);

  // 检查是否可以撤销
  useEffect(() => {
    const checkUndoAvailable = async () => {
      if (latestRecord) {
        const canUndoRecord = await isCurrentSessionRecord(latestRecord.id);
        setCanUndo(canUndoRecord);
      } else {
        setCanUndo(false);
      }
    };

    checkUndoAvailable();
  }, [latestRecord]);

  // 脉冲动画
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // 点击处理
  const handleButtonPress = useCallback(async () => {
    // 缩放动画
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // 发光动画
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    if (isDbReady) {
      await addNewRecord();
    }
  }, [isDbReady, addNewRecord]);

  // 撤销上一条记录
  const handleUndo = useCallback(async () => {
    if (records.length === 0) return;
    
    const success = await undoLastRecord();
    if (success) {
      // 可以添加一个简单的反馈动画
      Animated.sequence([
        Animated.timing(glowAnimRef.current, {
          toValue: 0.5,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnimRef.current, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [records.length, undoLastRecord]);

  // 判断状态文本
  const getStatusText = (): { text: string; isReady: boolean } => {
    if (elapsedSeconds < 0) {
      return { text: '还没有记录，点击开始', isReady: false };
    }

    const beyond = isBeyondThreshold(elapsedSeconds, settings.thresholdMinutes);
    return {
      text: beyond ? '已补充完毕，随时开始' : '休息一会吧',
      isReady: beyond,
    };
  };

  const status = getStatusText();
  const currentText = getCurrentButtonText();
  const buttonTheme = getThemeByIndex(settings.currentThemeIndex);

  return (
    <View style={styles.container}>
      {/* 背景 */}
      {settings.backgroundImage ? (
        <ImageBackground
          source={{ uri: settings.backgroundImage }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay} />
        </ImageBackground>
      ) : (
        <View style={styles.defaultBackground} />
      )}

      {/* 扫描线装饰 */}
      <View style={styles.scanLines}>
        {[...Array(30)].map((_, i) => (
          <View
            key={i}
            style={{
              height: 1,
              backgroundColor: 'rgba(0,240,255,0.03)',
              marginBottom: 8,
            }}
          />
        ))}
      </View>

      {/* 顶部状态栏 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setDrawerOpen(true)}
        >
          <Ionicons name="menu-outline" size={28} color={CYBER_THEME.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>记录追踪</Text>
          <LinearGradient
            colors={buttonTheme.gradientPrimary as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.titleUnderline}
          />
        </View>
        
        <View style={{ width: 44 }} />
      </View>

      {/* 主要内容区 */}
      <View style={styles.content}>
        {/* 顶部时间显示 */}
        <View style={styles.timerSection}>
          <Text style={styles.timerLabel}>距离上一次</Text>
          <Text style={styles.timerValue}>
            {elapsedSeconds >= 0 ? formatDuration(elapsedSeconds) : '--'}
          </Text>
        </View>

        {/* 中央大按钮 */}
        <View style={styles.buttonContainer}>
          {/* 外圈光晕 */}
          <Animated.View
            style={[
              styles.glowRing,
              // eslint-disable-next-line react-hooks/refs
              {
                transform: [{ scale: Animated.multiply(pulseAnim, scaleAnim) }],
                opacity: glowAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0.8],
                }),
              },
            ]}
          />
          
          {/* 主按钮 */}
          <Animated.View
            style={[
              styles.buttonWrapper,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPressIn={() => setIsPressed(true)}
              onPressOut={() => setIsPressed(false)}
              onPress={handleButtonPress}
              disabled={sessionRecordAdded}
              style={[
                styles.touchable,
                sessionRecordAdded && styles.touchableDisabled,
              ]}
            >
              <LinearGradient
                colors={isPressed 
                  ? (['#00CCDD', '#AA00DD'] as [string, string]) 
                  : (buttonTheme.gradientPrimary as [string, string])}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.buttonGradient,
                  isPressed && styles.buttonPressed,
                ]}
              >
                <View style={styles.buttonInner}>
                  <View style={styles.buttonGlow} />
                  <Text style={styles.buttonText}>{currentText}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* 底部状态文本 */}
        <View style={styles.statusSection}>
          <LinearGradient
            colors={status.isReady 
              ? (['rgba(0,255,136,0.2)', 'transparent'] as [string, string]) 
              : (['rgba(0,240,255,0.1)', 'transparent'] as [string, string])}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.statusGradient}
          >
            <View style={styles.statusContent}>
              <View style={[
                styles.statusDot,
                { backgroundColor: status.isReady ? CYBER_THEME.success : CYBER_THEME.primary }
              ]} />
              <Text style={[
                styles.statusText,
                { color: status.isReady ? CYBER_THEME.success : CYBER_THEME.textPrimary }
              ]}>
                {status.text}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* 最新记录信息 */}
        {latestRecord && (
          <View style={styles.latestInfo}>
            <Text style={styles.latestLabel}>最近记录</Text>
            <Text style={styles.latestValue}>
              {latestRecord.date} {latestRecord.time}
            </Text>
          </View>
        )}

        {/* 撤销按钮 */}
        {records.length > 0 && (
          <TouchableOpacity
            style={styles.undoButton}
            onPress={handleUndo}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-undo-outline" size={18} color={CYBER_THEME.textSecondary} />
            <Text style={styles.undoText}>撤销</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 底部装饰线 */}
      <View style={styles.bottomDecor}>
        <LinearGradient
          colors={['transparent', 'rgba(0,240,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bottomLine}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CYBER_THEME.background,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.85)',
  },
  defaultBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: CYBER_THEME.background,
  },
  scanLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: CYBER_THEME.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CYBER_THEME.border,
  },
  titleContainer: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: CYBER_THEME.textPrimary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  titleUnderline: {
    height: 2,
    width: 40,
    marginTop: 4,
    borderRadius: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  timerSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  timerLabel: {
    fontSize: 12,
    color: CYBER_THEME.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 36,
    fontWeight: '700',
    color: CYBER_THEME.primary,
    textShadowColor: CYBER_THEME.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: BUTTON_SIZE + 60,
    height: BUTTON_SIZE + 60,
  },
  glowRing: {
    position: 'absolute',
    width: BUTTON_SIZE + 40,
    height: BUTTON_SIZE + 40,
    borderRadius: (BUTTON_SIZE + 40) / 2,
    borderWidth: 2,
    borderColor: CYBER_THEME.primary,
    backgroundColor: 'transparent',
    ...CYBER_THEME.glowShadow,
  },
  buttonWrapper: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    ...CYBER_THEME.glowShadow,
  },
  touchable: {
    flex: 1,
  },
  touchableDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    flex: 1,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.9,
  },
  buttonInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  buttonGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BUTTON_SIZE,
  },
  buttonText: {
    fontSize: 28,
    fontWeight: '800',
    color: CYBER_THEME.background,
    letterSpacing: 4,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  statusSection: {
    width: '80%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusGradient: {
    padding: 16,
    borderRadius: 12,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  latestInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  latestLabel: {
    fontSize: 11,
    color: CYBER_THEME.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  latestValue: {
    fontSize: 13,
    color: CYBER_THEME.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  undoText: {
    fontSize: 14,
    color: CYBER_THEME.textSecondary,
    marginLeft: 6,
  },
  bottomDecor: {
    paddingBottom: 20,
    paddingHorizontal: 40,
  },
  bottomLine: {
    height: 1,
  },
});
