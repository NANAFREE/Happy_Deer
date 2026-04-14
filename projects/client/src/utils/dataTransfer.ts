// 数据导入导出工具
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Crypto from 'expo-crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RecordEntry, ImportRecord } from '../models/types';

// 检测是否为 Web 环境
const isWeb = Platform.OS === 'web';

// Type declarations for missing exports in expo-file-system/legacy (仅在非 Web 环境)
const documentDirectory = !isWeb ? (FileSystem as any).documentDirectory as string | null : null;
const cacheDirectory = !isWeb ? (FileSystem as any).cacheDirectory as string | null : null;
const EncodingType = { UTF8: 'utf8', Base64: 'base64' };
const readAsStringAsync = !isWeb ? (FileSystem as any).readAsStringAsync : null;
const writeAsStringAsync = !isWeb ? (FileSystem as any).writeAsStringAsync : null;

// 解析标准CSV格式
export async function parseImportData(content: string): Promise<RecordEntry[]> {
  const records: RecordEntry[] = [];

  // 生成一个唯一的会话ID用于导入的记录
  const sessionId = Crypto.randomUUID();

  // 移除BOM（Byte Order Mark）
  let contentStr = content;
  if (contentStr.charCodeAt(0) === 0xFEFF) {
    contentStr = contentStr.slice(1);
  } else if (contentStr.startsWith('\uFEFF')) {
    contentStr = contentStr.slice(1);
  } else if (contentStr.startsWith('﻿')) {
    contentStr = contentStr.slice(1);
  }

  // 按行分割（处理Windows/Unix换行符）
  const lines = contentStr.split(/\r?\n/).filter(line => line.trim());

  if (lines.length < 2) {
    return []; // 没有数据
  }

  // 解析header行
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  console.log('[Import] CSV Headers:', headers);

  // 标准化列名映射 - 使用简单的键值映射
  const headerMap: Record<string, string> = {};
  headers.forEach(h => {
    const normalized = h.trim().toLowerCase();

    if (normalized === 'id') {
      headerMap[h] = 'id';
    } else if (normalized === 'date') {
      headerMap[h] = 'date';
    } else if (normalized === 'time') {
      headerMap[h] = 'time';
    } else if (normalized === 'frequency') {
      headerMap[h] = 'frequency';
    } else if (normalized === 'lastdatetime' || normalized === 'last datetime') {
      headerMap[h] = 'lastDatetime';
    } else if (normalized === 'intervaltime' || normalized === 'interval time') {
      headerMap[h] = 'intervalTime';
    } else if (normalized === 'remarks') {
      headerMap[h] = 'remarks';
    }
  });

  console.log('[Import] HeaderMap:', headerMap);

  // 解析数据行
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const rowData: Record<string, string> = {};

    headers.forEach((header, index) => {
      const fieldName = headerMap[header];
      if (fieldName) {
        rowData[fieldName] = values[index] || '';
      }
    });

    const parsed = parseRecord(rowData, sessionId);
    if (parsed) {
      records.push(parsed);
    }
  }

  return records;
}

// 解析CSV行（处理引号包围的字段）
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // 转义的引号 ""
        current += '"';
        i++;
      } else {
        // 切换引号状态
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // 逗号分隔（不在引号内）
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function parseRecord(raw: Record<string, string>, sessionId: string): RecordEntry | null {
  try {
    const date = raw.date || '';
    const time = raw.time || '';

    if (!date || !time) {
      console.log('[Import] 跳过无效记录，缺少 date 或 time:', raw);
      return null;
    }

    // 解析日期时间
    let lastDatetime: string | null = null;
    if (raw.lastDatetime) {
      lastDatetime = raw.lastDatetime || null;
    }

    // 解析频率
    let frequency = 1;
    if (raw.frequency !== undefined && raw.frequency !== '') {
      frequency = parseInt(String(raw.frequency), 10) || 1;
    }

    // 解析间隔时间
    let intervalTime = 0;
    if (raw.intervalTime !== undefined && raw.intervalTime !== '') {
      intervalTime = parseInt(String(raw.intervalTime), 10) || 0;
    }

    // 解析备注
    let remarks = '';
    if (raw.remarks) {
      remarks = String(raw.remarks || '');
    }

    return {
      id: parseInt(String(raw.id || '0'), 10) || 0,
      date,
      time,
      frequency,
      lastDatetime,
      intervalTime,
      remarks,
      createdAt: new Date().toISOString(),
      sessionId,
    };
  } catch (error) {
    console.error('[Import] 解析记录失败:', error, raw);
    return null;
  }
}

// 导出数据为CSV格式
export function exportToCSV(records: RecordEntry[]): string {
  const header = 'ID,Date,Time,Frequency,LastDatetime,IntervalTime,Remarks\n';
  const rows = records.map(r => {
    const fields = [
      r.id,
      r.date,
      r.time,
      r.frequency,
      r.lastDatetime || '',
      r.intervalTime,
      `"${(r.remarks || '').replace(/"/g, '""')}"`
    ];
    return fields.join(',');
  }).join('\n');
  
  return header + rows;
}

// 导出数据为JSON格式
export function exportToJSON(records: RecordEntry[]): string {
  return JSON.stringify(records, null, 2);
}

// 保存文件到下载目录
export async function saveToDownloads(filename: string, content: string): Promise<string> {
  if (isWeb) {
    // Web 环境：使用 Blob 和 download 属性
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return filename;
  } else {
    // 原生环境：使用 expo-file-system
    const fileUri = documentDirectory + filename;
    await writeAsStringAsync!(fileUri, content, {
      encoding: EncodingType.UTF8,
    });
    return fileUri;
  }
}

// 分享文件
export async function shareFile(uri: string, mimeType: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType,
      dialogTitle: '分享记录数据',
    });
  }
}

// 从文件URI读取内容
export async function readFileContent(uri: string): Promise<string> {
  if (isWeb) {
    // Web 环境：使用 fetch API
    const response = await fetch(uri);
    return await response.text();
  } else {
    // 原生环境：使用 expo-file-system
    return await readAsStringAsync!(uri, {
      encoding: EncodingType.UTF8,
    });
  }
}

// 生成备份文件名
export function generateBackupFilename(format: 'csv' | 'json'): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `clicktracker_backup_${timestamp}.${format}`;
}
