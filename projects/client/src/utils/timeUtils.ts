// 格式化时间差的工具函数

// 格式化秒数为人类可读的时间差
export function formatTimeDiff(seconds: number): string {
  if (seconds < 0) return '刚刚';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts: string[] = [];
  
  if (days > 0) {
    parts.push(`${days}天`);
  }
  if (hours > 0) {
    parts.push(`${hours}小时`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes}分钟`);
  }
  
  return parts.join('');
}

// 计算两个时间点之间的时间差（秒）
export function calculateTimeDiff(date1: Date, date2: Date): number {
  return Math.floor((date1.getTime() - date2.getTime()) / 1000);
}

// 获取从上次记录到现在的时间差（秒）
export function getElapsedSeconds(latestRecord: { date: string; time: string } | null): number {
  if (!latestRecord) return -1; // 表示没有记录
  
  const recordDate = new Date(`${latestRecord.date}T${latestRecord.time}`);
  const now = new Date();
  
  return calculateTimeDiff(now, recordDate);
}

// 格式化日期时间为友好显示
export function formatDateTime(dateStr: string, timeStr: string): string {
  const date = new Date(`${dateStr}T${timeStr}`);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  
  if (diffDays === 0) {
    return `今天 ${time}`;
  } else if (diffDays === 1) {
    return `昨天 ${time}`;
  } else if (diffDays < 7) {
    return `${diffDays}天前 ${time}`;
  } else {
    return `${date.toLocaleDateString('zh-CN')} ${time}`;
  }
}

// 格式化秒数为完整时间描述（精确到分钟）
export function formatDuration(seconds: number): string {
  if (seconds < 0) return '无记录';
  if (seconds < 60) return '刚刚';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];

  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}分钟`);

  return parts.join('') || '刚刚';
}

// 判断是否超过阈值（参数为分钟数）
export function isBeyondThreshold(elapsedSeconds: number, thresholdMinutes: number): boolean {
  const thresholdSeconds = thresholdMinutes * 60;
  return elapsedSeconds >= thresholdSeconds;
}
