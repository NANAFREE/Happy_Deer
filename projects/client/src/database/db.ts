import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordEntry, Settings, DEFAULT_SETTINGS } from '../models/types';

// 检测是否为 Web 环境
const isWeb = typeof window !== 'undefined' && !('sqlite' in window);

// Web 环境使用 AsyncStorage 持久化
const STORAGE_KEY = 'clicktracker_data';
const SETTINGS_KEY = 'clicktracker_settings';
const SESSION_KEY = 'clicktracker_session_id';

// 当前会话ID（用于撤销功能）
let currentSessionId = '';

// 生成新会话ID
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 初始化会话
async function initSession(): Promise<void> {
  currentSessionId = generateSessionId();
  if (isWeb) {
    await AsyncStorage.setItem(SESSION_KEY, currentSessionId);
  }
}

// 获取当前会话ID
async function getCurrentSessionId(): Promise<string> {
  if (isWeb) {
    return await AsyncStorage.getItem(SESSION_KEY) || currentSessionId;
  }
  return currentSessionId;
}

// 内存存储（Web 环境，仅作运行时缓存）
let memoryDb: {
  records: RecordEntry[];
  settings: Settings;
} | null = null;

// 从 AsyncStorage 加载数据
async function loadFromStorage(): Promise<void> {
  if (!isWeb) return;
  
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const settings = await AsyncStorage.getItem(SETTINGS_KEY);
    
    memoryDb = {
      records: data ? JSON.parse(data) : [],
      settings: settings ? JSON.parse(settings) : {
        id: 1,
        ...DEFAULT_SETTINGS,
        updatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error('Failed to load from storage:', error);
    memoryDb = {
      records: [],
      settings: {
        id: 1,
        ...DEFAULT_SETTINGS,
        updatedAt: new Date().toISOString(),
      },
    };
  }
}

// 保存到 AsyncStorage
async function saveToStorage(): Promise<void> {
  if (!isWeb || !memoryDb) return;
  
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryDb.records));
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(memoryDb.settings));
  } catch (error) {
    console.error('Failed to save to storage:', error);
  }
}

let db: SQLite.SQLiteDatabase | null = null;

// 初始化内存数据库（Web 环境）
async function initMemoryDb(): Promise<void> {
  if (!memoryDb) {
    await loadFromStorage();
  }
}

// 初始化数据库
export async function initDatabase(): Promise<void> {
  // 初始化会话ID
  await initSession();
  
  if (isWeb) {
    await initMemoryDb();
    return;
  }
  
  db = await SQLite.openDatabaseAsync('clicktracker.db');
  
  // 创建记录表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      frequency INTEGER DEFAULT 1,
      lastDatetime TEXT,
      intervalTime INTEGER DEFAULT 0,
      remarks TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now', 'localtime')),
      sessionId TEXT
    );
  `);

  // 创建设置表
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      thresholdMinutes INTEGER DEFAULT 5760,
      buttonText TEXT DEFAULT '开冲,锻炼,开始,记录',
      currentThemeIndex INTEGER DEFAULT 0,
      backgroundImage TEXT,
      sidebarBackground TEXT,
      developerMode INTEGER DEFAULT 0,
      updatedAt TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 确保 developerMode 字段存在（数据库迁移）
  try {
    await db.execAsync(`ALTER TABLE settings ADD COLUMN developerMode INTEGER DEFAULT 0;`);
  } catch (error) {
    // 字段已存在，忽略错误
  }

  // 确保设置记录存在
  const settings = await db.getFirstAsync<Settings>('SELECT * FROM settings WHERE id = 1');
  if (!settings) {
    await db.runAsync(
      'INSERT INTO settings (id, thresholdMinutes, buttonText, currentThemeIndex) VALUES (1, ?, ?, ?)',
      [DEFAULT_SETTINGS.thresholdMinutes, DEFAULT_SETTINGS.buttonText, DEFAULT_SETTINGS.currentThemeIndex]
    );
  }
}

// 获取数据库实例
function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// ==================== 记录相关操作 ====================

// 添加新记录
export async function addRecord(): Promise<RecordEntry> {
  const sessionId = await getCurrentSessionId();

  if (isWeb) {
    await initMemoryDb();
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // 计算间隔时间（只有>=1条记录时才计算）
    let intervalTime = 0;
    if (memoryDb!.records.length >= 1) {
      const lastRecord = memoryDb!.records[0]; // 最新的
      const lastDateTime = new Date(`${lastRecord.date}T${lastRecord.time}`);
      intervalTime = Math.floor((now.getTime() - lastDateTime.getTime()) / 1000);
    }

    const newRecord: RecordEntry = {
      id: memoryDb!.records.length + 1,
      date,
      time,
      frequency: 1,
      lastDatetime: now.toISOString(),
      intervalTime,
      remarks: '',
      createdAt: now.toISOString(),
      sessionId,
    };
    memoryDb!.records.unshift(newRecord); // 最新的在前面
    await saveToStorage();
    return newRecord;
  }

  const database = getDatabase();
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  // 获取上次记录
  const lastRecord = await database.getFirstAsync<{ date: string; time: string }>(
    'SELECT date, time FROM records ORDER BY id DESC LIMIT 1'
  );

  const intervalTime = lastRecord
    ? Math.floor((now.getTime() - new Date(`${lastRecord.date}T${lastRecord.time}`).getTime()) / 1000)
    : 0;

  const result = await database.runAsync(
    'INSERT INTO records (date, time, lastDatetime, intervalTime, sessionId) VALUES (?, ?, ?, ?, ?)',
    [date, time, now.toISOString(), intervalTime, sessionId]
  );

  return {
    id: result.lastInsertRowId,
    date,
    time,
    frequency: 1,
    lastDatetime: now.toISOString(),
    intervalTime,
    remarks: '',
    createdAt: now.toISOString(),
    sessionId,
  };
}

// 获取所有记录
export async function getAllRecords(): Promise<RecordEntry[]> {
  if (isWeb) {
    await initMemoryDb();

    // 每次都从存储重新加载，确保数据一致性
    await loadFromStorage();

    console.log('[DB] getAllRecords 返回', memoryDb!.records.length, '条记录');
    return memoryDb!.records;
  }

  const database = getDatabase();
  const records = await database.getAllAsync<RecordEntry>('SELECT * FROM records ORDER BY id DESC');
  return records;
}

// 获取最新记录
export async function getLatestRecord(): Promise<RecordEntry | null> {
  if (isWeb) {
    await initMemoryDb();

    // 每次都从存储重新加载，确保数据一致性
    await loadFromStorage();

    return memoryDb!.records.length > 0 ? memoryDb!.records[0] : null;
  }

  const database = getDatabase();
  const record = await database.getFirstAsync<RecordEntry>(
    'SELECT * FROM records ORDER BY id DESC LIMIT 1'
  );
  return record || null;
}

// 检查记录是否属于当前会话（用于撤销功能）
export async function isCurrentSessionRecord(recordId: number): Promise<boolean> {
  const sessionId = await getCurrentSessionId();
  
  if (isWeb) {
    await initMemoryDb();
    const record = memoryDb!.records.find(r => r.id === recordId);
    return record?.sessionId === sessionId;
  }
  
  const database = getDatabase();
  const record = await database.getFirstAsync<{ sessionId: string }>(
    'SELECT sessionId FROM records WHERE id = ?',
    [recordId]
  );
  return record?.sessionId === sessionId;
}

// 获取记录统计
export async function getRecordStats(): Promise<{
  total: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  byWeekday: { weekday: string; count: number }[];
  dailyStats: { date: string; count: number }[];
  totalCount: number;
  last7Days: number;
  last30Days: number;
  avgInterval: number;
  minInterval: number;
  maxInterval: number;
  byMonth: { month: string; count: number }[];
}> {
  if (isWeb) {
    await initMemoryDb();

    // 每次都从存储重新加载，确保数据一致性
    await loadFromStorage();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 按星期统计
    const weekdayCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    memoryDb!.records.forEach(r => {
      const weekday = new Date(r.createdAt).getDay();
      weekdayCounts[weekday]++;
    });
    const byWeekday = Object.entries(weekdayCounts).map(([weekday, count]) => ({
      weekday,
      count,
    }));

    // 每日统计
    const dailyMap: Record<string, number> = {};
    memoryDb!.records.forEach(r => {
      dailyMap[r.date] = (dailyMap[r.date] || 0) + 1;
    });
    const dailyStats = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // 间隔统计
    const intervals = memoryDb!.records
      .filter(r => r.intervalTime > 0)
      .map(r => r.intervalTime);
    const avgInterval = intervals.length > 0
      ? intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      : 0;
    const minInterval = intervals.length > 0 ? Math.min(...intervals) : 0;
    const maxInterval = intervals.length > 0 ? Math.max(...intervals) : 0;

    // 月度统计
    const monthMap: Record<string, number> = {};
    memoryDb!.records.forEach(r => {
      const month = r.date.slice(0, 7);
      monthMap[month] = (monthMap[month] || 0) + 1;
    });
    const byMonth = Object.entries(monthMap)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => b.month.localeCompare(a.month));

    const result = {
      total: memoryDb!.records.length,
      today: memoryDb!.records.filter(r => r.date === todayStr).length,
      thisWeek: memoryDb!.records.filter(r => new Date(r.createdAt) >= weekAgo).length,
      thisMonth: memoryDb!.records.filter(r => new Date(r.createdAt) >= monthAgo).length,
      byWeekday,
      dailyStats,
      totalCount: memoryDb!.records.length,
      last7Days: memoryDb!.records.filter(r => new Date(r.createdAt) >= weekAgo).length,
      last30Days: memoryDb!.records.filter(r => new Date(r.createdAt) >= monthAgo).length,
      avgInterval,
      minInterval,
      maxInterval,
      byMonth,
    };

    console.log('[DB] getRecordStats 返回, 总记录数:', result.total);
    return result;
  }

  const database = getDatabase();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const total = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM records');
  const today = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM records WHERE date = ?',
    [todayStr]
  );
  const thisWeek = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM records WHERE createdAt >= ?',
    [weekAgo]
  );
  const thisMonth = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM records WHERE createdAt >= ?',
    [monthAgo]
  );

  // 按星期统计
  const weekdayResults = await database.getAllAsync<{ weekday: number; count: number }>(
    `SELECT CAST(strftime('%w', createdAt) AS INTEGER) as weekday, COUNT(*) as count 
     FROM records GROUP BY weekday ORDER BY weekday`
  );
  const weekdayMap = new Map(weekdayResults.map(r => [r.weekday, r.count]));
  const byWeekday = [0, 1, 2, 3, 4, 5, 6].map(weekday => ({
    weekday: String(weekday),
    count: weekdayMap.get(weekday) || 0,
  }));

  // 每日统计
  const dailyResults = await database.getAllAsync<{ date: string; count: number }>(
    `SELECT date, COUNT(*) as count FROM records GROUP BY date ORDER BY date DESC`
  );

  // 间隔统计
  const intervalResults = await database.getAllAsync<{ intervalTime: number }>(
    `SELECT intervalTime FROM records WHERE intervalTime > 0`
  );
  const intervals = intervalResults.map(r => r.intervalTime);
  const avgInterval = intervals.length > 0
    ? intervals.reduce((sum, val) => sum + val, 0) / intervals.length
    : 0;
  const minInterval = intervals.length > 0 ? Math.min(...intervals) : 0;
  const maxInterval = intervals.length > 0 ? Math.max(...intervals) : 0;

  // 月度统计
  const monthResults = await database.getAllAsync<{ month: string; count: number }>(
    `SELECT strftime('%Y-%m', createdAt) as month, COUNT(*) as count 
     FROM records GROUP BY month ORDER BY month DESC`
  );

  return {
    total: total?.count || 0,
    today: today?.count || 0,
    thisWeek: thisWeek?.count || 0,
    thisMonth: thisMonth?.count || 0,
    byWeekday,
    dailyStats: dailyResults,
    totalCount: total?.count || 0,
    last7Days: thisWeek?.count || 0,
    last30Days: thisMonth?.count || 0,
    avgInterval,
    minInterval,
    maxInterval,
    byMonth: monthResults,
  };
}

// 删除记录
export async function deleteRecord(id: number): Promise<void> {
  if (isWeb) {
    await initMemoryDb();
    memoryDb!.records = memoryDb!.records.filter(r => r.id !== id);
    await saveToStorage();
    return;
  }

  const database = getDatabase();
  await database.runAsync('DELETE FROM records WHERE id = ?', [id]);
}

// ==================== 设置相关操作 ====================

// 获取设置
export async function getSettings(): Promise<Settings> {
  if (isWeb) {
    await initMemoryDb();

    // 每次都从存储重新加载，确保数据一致性
    await loadFromStorage();

    return memoryDb!.settings;
  }

  const database = getDatabase();
  const settings = await database.getFirstAsync<Settings>('SELECT * FROM settings WHERE id = 1');
  return settings || { id: 1, ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() };
}

// 更新设置
export async function updateSettings(newSettings: Partial<Omit<Settings, 'id'>>): Promise<void> {
  if (isWeb) {
    await initMemoryDb();
    memoryDb!.settings = {
      ...memoryDb!.settings,
      ...newSettings,
      updatedAt: new Date().toISOString(),
    };
    await saveToStorage();
    return;
  }

  const database = getDatabase();
  const entries = Object.entries(newSettings);
  
  if (entries.length === 0) return;

  const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, value]) => value);
  
  await database.runAsync(
    `UPDATE settings SET ${setClause}, updatedAt = datetime('now', 'localtime') WHERE id = 1`,
    values
  );
}

// 导入记录
export async function importRecords(records: RecordEntry[]): Promise<number> {
  if (isWeb) {
    console.log('[DB] Web环境开始导入，接收到的记录数:', records.length);

    // 先从存储加载最新数据
    await loadFromStorage();
    console.log('[DB] 已从存储加载最新数据，当前记录数:', memoryDb!.records.length);

    // 找到当前最大的 ID
    const maxId = memoryDb!.records.reduce((max, record) => Math.max(max, record.id), 0);
    console.log('[DB] 当前最大ID:', maxId);

    let imported = 0;
    const recordsToImport: RecordEntry[] = [];

    for (const record of records) {
      if (record.date && record.time) {
        // 使用新的 ID，避免冲突
        recordsToImport.push({
          ...record,
          id: maxId + imported + 1,
          sessionId: '', // 导入的记录不分配当前会话ID，不允许撤销
        });
        imported++;
      }
    }

    console.log('[DB] 准备导入的记录数:', imported);

    // 批量添加到内存（新记录在前，按ID降序排列）
    memoryDb!.records = [...recordsToImport, ...memoryDb!.records];
    console.log('[DB] 合并后总记录数:', memoryDb!.records.length);

    // 保存到 AsyncStorage
    await saveToStorage();
    console.log('[DB] 已保存到 AsyncStorage');

    // 验证数据是否真的被保存
    try {
      const verify = await AsyncStorage.getItem(STORAGE_KEY);
      const verifyData = verify ? JSON.parse(verify) : [];
      console.log('[DB] 验证存储中的数据:', verifyData.length, '条记录');
    } catch (error) {
      console.error('[DB] 验证存储失败:', error);
    }

    console.log('[DB] Web环境导入完成:', imported, '条记录，总记录数:', memoryDb!.records.length);
    return imported;
  }

  const database = getDatabase();
  let imported = 0;

  for (const record of records) {
    if (record.date && record.time) {
      await database.runAsync(
        `INSERT INTO records (date, time, frequency, lastDatetime, intervalTime, remarks, sessionId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          record.date,
          record.time,
          record.frequency || 1,
          record.lastDatetime || null,
          record.intervalTime || 0,
          record.remarks || '',
          '', // 导入的记录不分配当前会话ID
        ]
      );
      imported++;
    }
  }

  return imported;
}
