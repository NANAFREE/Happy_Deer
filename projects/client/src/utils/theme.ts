// 暗黑科技风主题配色
export const CYBER_THEME = {
  // 主色调
  primary: '#00F0FF',      // 电光青
  secondary: '#BF00FF',    // 霓虹紫
  accent: '#FF003C',       // 危险红
  success: '#00FF88',      // 矩阵绿
  
  // 背景色
  background: '#0A0A0F',    // 纯黑
  cardBackground: '#12121A', // 微亮黑
  surfaceHover: '#1A1A25',
  
  // 边框色
  border: 'rgba(0,240,255,0.15)',
  borderActive: 'rgba(0,240,255,0.4)',
  
  // 文字色
  textPrimary: '#EAEAEA',
  textSecondary: '#555570',
  textMuted: '#3A3A45',
  textGlow: '#00F0FF',
  
  // 渐变
  gradientPrimary: ['#00F0FF', '#BF00FF'],
  gradientWarning: ['#FF003C', '#FF6B35'],
  
  // 阴影
  glowShadow: {
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  cardShadow: {
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
};

// 按钮主题预设
export const BUTTON_THEMES = [
  { name: '科技蓝', primary: '#00F0FF', secondary: '#0080FF' },
  { name: '霓虹紫', primary: '#BF00FF', secondary: '#FF00BF' },
  { name: '矩阵绿', primary: '#00FF88', secondary: '#00CC66' },
  { name: '烈焰红', primary: '#FF003C', secondary: '#FF6B35' },
  { name: '极光橙', primary: '#FF8800', secondary: '#FFCC00' },
];

// 根据主题索引生成动态主题
export function getThemeByIndex(index: number) {
  const themeIndex = Math.max(0, Math.min(index, BUTTON_THEMES.length - 1));
  const buttonTheme = BUTTON_THEMES[themeIndex];
  
  return {
    ...CYBER_THEME,
    primary: buttonTheme.primary,
    secondary: buttonTheme.secondary,
    gradientPrimary: [buttonTheme.primary, buttonTheme.secondary],
    glowShadow: {
      ...CYBER_THEME.glowShadow,
      shadowColor: buttonTheme.primary,
    },
    cardShadow: {
      ...CYBER_THEME.cardShadow,
      shadowColor: buttonTheme.primary,
    },
  };
}
