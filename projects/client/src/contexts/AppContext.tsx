import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { RecordEntry, Settings, DEFAULT_SETTINGS } from '../models/types';
import * as db from '../database/db';

interface AppContextType {
  // 数据库状态
  isDbReady: boolean;

  // 记录相关
  records: RecordEntry[];
  latestRecord: RecordEntry | null;
  sessionRecordAdded: boolean;  // 当前会话是否已添加记录
  addNewRecord: () => Promise<RecordEntry>;
  refreshRecords: () => Promise<void>;
  refreshData: () => Promise<void>;  // refreshRecords 的别名
  undoLastRecord: () => Promise<boolean>;

  // 设置相关
  settings: Settings;
  updateSettings: (newSettings: Partial<Omit<Settings, 'id'>>) => Promise<void>;

  // 侧栏状态
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;

  // 按钮文本
  getCurrentButtonText: () => string;
  cycleButtonText: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isDbReady, setIsDbReady] = useState(false);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [latestRecord, setLatestRecord] = useState<RecordEntry | null>(null);
  const [settings, setSettings] = useState<Settings>({
    id: 1,
    ...DEFAULT_SETTINGS,
    updatedAt: new Date().toISOString(),
  });
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [buttonTextIndex, setButtonTextIndex] = useState(0);
  const [sessionRecordAdded, setSessionRecordAdded] = useState(false);

  // 刷新记录
  const refreshRecords = useCallback(async () => {
    try {
      const allRecords = await db.getAllRecords();
      setRecords(allRecords);
      const latest = await db.getLatestRecord();
      setLatestRecord(latest);
    } catch (error) {
      console.error('Failed to refresh records:', error);
    }
  }, []);

  // 初始化数据库
  useEffect(() => {
    const init = async () => {
      try {
        await db.initDatabase();
        setIsDbReady(true);
        await refreshRecords();
        const loadedSettings = await db.getSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    init();
  }, [refreshRecords]);

  // 添加新记录（当前会话只能添加一条）
  const addNewRecord = useCallback(async (): Promise<RecordEntry> => {
    if (sessionRecordAdded) {
      throw new Error('当前会话只能添加一条记录');
    }

    const newRecord = await db.addRecord();
    await refreshRecords();
    setSessionRecordAdded(true);
    // 更新按钮文本索引
    const texts = settings.buttonText.split(',');
    setButtonTextIndex((prev) => (prev + 1) % texts.length);
    return newRecord;
  }, [refreshRecords, settings.buttonText, sessionRecordAdded]);

  // 更新设置
  const updateSettingsHandler = useCallback(async (newSettings: Partial<Omit<Settings, 'id'>>) => {
    await db.updateSettings(newSettings);
    const updated = await db.getSettings();
    setSettings(updated);
  }, []);

  // 获取当前按钮文本
  const getCurrentButtonText = useCallback((): string => {
    const texts = settings.buttonText.split(',').map(t => t.trim());
    return texts[buttonTextIndex] || '记录';
  }, [settings.buttonText, buttonTextIndex]);

  // 循环切换按钮文本
  const cycleButtonText = useCallback(() => {
    const texts = settings.buttonText.split(',').map(t => t.trim());
    setButtonTextIndex((prev) => (prev + 1) % texts.length);
  }, [settings.buttonText]);

  // 撤销上一条记录（仅限当前会话的记录）
  const undoLastRecord = useCallback(async (): Promise<boolean> => {
    if (records.length === 0) return false;

    try {
      const lastRecord = records[0]; // records 是按 id DESC 排序的

      // 检查是否属于当前会话
      const canUndo = await db.isCurrentSessionRecord(lastRecord.id);
      if (!canUndo) {
        return false; // 不是当前会话的记录，不能撤销
      }

      await db.deleteRecord(lastRecord.id);
      await refreshRecords();
      setSessionRecordAdded(false); // 重置会话状态
      return true;
    } catch (error) {
      console.error('Failed to undo last record:', error);
      return false;
    }
  }, [records, refreshRecords]);

  return (
    <AppContext.Provider
      value={{
        isDbReady,
        records,
        latestRecord,
        sessionRecordAdded,
        addNewRecord,
        refreshRecords,
        refreshData: refreshRecords,
        undoLastRecord,
        settings,
        updateSettings: updateSettingsHandler,
        isDrawerOpen,
        setDrawerOpen,
        getCurrentButtonText,
        cycleButtonText,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
