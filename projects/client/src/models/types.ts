// 数据模型类型定义
export interface RecordEntry {
  id: number;
  date: string;       // 格式: 2024-09-09
  time: string;       // 格式: 02:49:03
  frequency: number;  // 频率
  lastDatetime: string | null;  // 上一次记录的日期时间
  intervalTime: number;  // 间隔时间（秒）
  remarks: string;    // 备注
  createdAt: string;  // 创建时间
  sessionId: string;  // 会话ID（用于撤销功能）
}

export interface Settings {
  id: number;
  thresholdMinutes: number;   // 阈值分钟数
  buttonText: string;          // 按钮文本（逗号分隔）
  currentThemeIndex: number;   // 当前主题索引
  backgroundImage: string | null;  // 主页背景图片URI
  sidebarBackground: string | null;  // 侧栏背景图片URI
  developerMode: boolean;      // 开发者模式
  updatedAt: string;
}

// 设置默认值
export const DEFAULT_SETTINGS: Omit<Settings, 'id' | 'updatedAt'> = {
  thresholdMinutes: 5760,      // 默认4天（4 * 24 * 60 = 5760分钟）
  buttonText: '开冲,锻炼,开始,记录',
  currentThemeIndex: 0,
  backgroundImage: null,
  sidebarBackground: null,
  developerMode: false,        // 默认关闭开发者模式
};

// 导入数据格式（兼容用户提供的格式）
export interface ImportRecord {
  ID?: string | number;
  Date?: string;
  date?: string;
  Time?: string;
  time?: string;
  Frequency?: string | number;
  frequency?: string | number;
  LastDatetime?: string;
  lastDatetime?: string;
  'Last Datetime'?: string;
  IntervalTime?: string | number;
  intervalTime?: string | number;
  'Interval Time'?: string | number;
  Remarks?: string;
  remarks?: string;
}
