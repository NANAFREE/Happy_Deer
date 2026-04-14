import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeRouter } from '@/hooks/useSafeRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getRecordStats, getAllRecords } from '../../src/database/db';
import { CYBER_THEME } from '../../src/utils/theme';
import { formatDuration } from '../../src/utils/timeUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  color?: string;
}

function StatCard({ label, value, subLabel, color = CYBER_THEME.primary }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subLabel && <Text style={styles.statSubLabel}>{subLabel}</Text>}
    </View>
  );
}

interface BarChartProps {
  data: { label: string; value: number; maxValue: number }[];
  title: string;
}

function BarChart({ data, title }: BarChartProps) {
  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.barContainer}>
        {data.map((item, index) => {
          const height = item.maxValue > 0 ? (item.value / item.maxValue) * 100 : 0;
          return (
            <View key={index} style={styles.barItem}>
              <View style={styles.barWrapper}>
                <LinearGradient
                  colors={CYBER_THEME.gradientPrimary as [string, string]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={[styles.bar, { height: `${Math.max(height, 5)}%` }]}
                />
              </View>
              <Text style={styles.barLabel}>{item.label}</Text>
              <Text style={styles.barValue}>{item.value}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface WeekdayChartProps {
  data: { weekday: string; count: number }[];
}

const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function WeekdayChart({ data }: WeekdayChartProps) {
  const getCount = (dayIndex: string) => {
    const item = data.find(d => d.weekday === dayIndex);
    return item?.count || 0;
  };

  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>按星期分布</Text>
      <View style={styles.weekdayContainer}>
        {[...Array(7)].map((_, i) => {
          const count = getCount(String(i));
          const height = maxCount > 0 ? (count / maxCount) * 80 : 5;
          return (
            <View key={i} style={styles.weekdayItem}>
              <View style={styles.weekdayBarWrapper}>
                <LinearGradient
                  colors={CYBER_THEME.gradientPrimary as [string, string]}
                  start={{ x: 0, y: 1 }}
                  end={{ x: 0, y: 0 }}
                  style={[styles.weekdayBar, { height: Math.max(height, 4) }]}
                />
              </View>
              <Text style={styles.weekdayLabel}>{WEEKDAY_NAMES[i]}</Text>
              <Text style={styles.weekdayCount}>{count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface HeatmapData {
  date: string;
  count: number;
}

interface HeatmapProps {
  data: HeatmapData[];
}

function Heatmap({ data }: HeatmapProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const today = new Date();
  const days: { date: string; count: number; dayOfWeek: number }[] = [];

  // 生成最近14天的数据
  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const item = data.find(d => d.date === dateStr);
    days.push({
      date: dateStr,
      count: item?.count || 0,
      dayOfWeek: date.getDay(),
    });
  }

  const getColor = (count: number) => {
    if (count === 0) return CYBER_THEME.cardBackground;
    const intensity = Math.min(count / maxCount, 1);
    if (intensity > 0.75) return CYBER_THEME.primary;
    if (intensity > 0.5) return 'rgba(0,240,255,0.6)';
    if (intensity > 0.25) return 'rgba(0,240,255,0.3)';
    return 'rgba(0,240,255,0.15)';
  };

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>最近14天</Text>
      <View style={styles.heatmapContainer}>
        {days.map((day, index) => (
          <View key={index} style={styles.heatmapItem}>
            <View
              style={[
                styles.heatmapCell,
                { backgroundColor: getColor(day.count) },
                day.count > 0 && styles.heatmapCellActive,
              ]}
            />
            <Text style={styles.heatmapLabel}>
              {index % 2 === 0 ? day.date.slice(5) : ''}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.heatmapLegend}>
        <Text style={styles.legendText}>少</Text>
        <View style={[styles.legendCell, { backgroundColor: 'rgba(0,240,255,0.15)' }]} />
        <View style={[styles.legendCell, { backgroundColor: 'rgba(0,240,255,0.3)' }]} />
        <View style={[styles.legendCell, { backgroundColor: 'rgba(0,240,255,0.6)' }]} />
        <View style={[styles.legendCell, { backgroundColor: CYBER_THEME.primary }]} />
        <Text style={styles.legendText}>多</Text>
      </View>
    </View>
  );
}

interface ScatterData {
  index: number;
  interval: number;
  date: string;
}

interface ScatterPlotProps {
  data: ScatterData[];
}

function ScatterPlot({ data }: ScatterPlotProps) {
  const maxInterval = Math.max(...data.map(d => d.interval), 1);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>间隔时间趋势</Text>
      <View style={styles.scatterContainer}>
        <View style={styles.scatterGrid}>
          {data.map((item, index) => {
            const x = (index / (data.length - 1 || 1)) * 100;
            const y = (item.interval / maxInterval) * 100;
            return (
              <View
                key={index}
                style={[
                  styles.scatterDot,
                  {
                    left: `${x}%`,
                    bottom: `${y}%`,
                  },
                ]}
              >
                <LinearGradient
                  colors={CYBER_THEME.gradientPrimary as [string, string]}
                  style={styles.scatterDotGradient}
                />
              </View>
            );
          })}
        </View>
        <View style={styles.scatterAxis}>
          <Text style={styles.scatterAxisLabel}>时间</Text>
          <Text style={[styles.scatterAxisLabel, { textAlign: 'right' }]}>间隔</Text>
        </View>
        {data.length > 0 && (
          <View style={styles.scatterLabels}>
            <Text style={styles.scatterMinLabel}>
              {formatDuration(Math.min(...data.map(d => d.interval)))}
            </Text>
            <Text style={styles.scatterMaxLabel}>
              {formatDuration(maxInterval)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface LineChartProps {
  data: { label: string; value: number }[];
  title: string;
}

function LineChart({ data, title }: LineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.lineChartContainer}>
        {/* 背景网格线 */}
        {[0, 1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              styles.gridLine,
              {
                bottom: `${(i / 4) * 100}%`,
              },
            ]}
          />
        ))}
        {/* 折线 */}
        <View style={styles.lineWrapper}>
          {data.map((item, index) => {
            const x = (index / (data.length - 1 || 1)) * 100;
            const y = (item.value / maxValue) * 100;
            const nextItem = data[index + 1];
            const nextX = nextItem ? ((index + 1) / (data.length - 1)) * 100 : x;
            const nextY = nextItem ? (nextItem.value / maxValue) * 100 : y;

            return (
              <React.Fragment key={index}>
                {/* 点 */}
                <View
                  style={[
                    styles.lineDot,
                    {
                      left: `${x}%`,
                      bottom: `${y}%`,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={CYBER_THEME.gradientPrimary as [string, string]}
                    style={styles.lineDotGradient}
                  />
                </View>
                {/* 线段 */}
                {index < data.length - 1 && (
                  <View
                    style={[
                      styles.lineSegment,
                      {
                        left: `${x}%`,
                        bottom: `${y}%`,
                        width: `${nextX - x}%`,
                        height: `${Math.abs(nextY - y)}%`,
                        transform: nextY > y ? [{ translateY: 0 }] : [{ translateY: -100 }],
                      },
                    ]}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
        {/* X轴标签 */}
        <View style={styles.lineChartLabels}>
          {data.map((item, index) => (
            <Text key={index} style={styles.lineChartLabel}>
              {item.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

interface HourDistributionProps {
  data: { hour: number; count: number }[];
}

function HourDistribution({ data }: HourDistributionProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const getCount = (hour: number) => {
    const item = data.find(d => d.hour === hour);
    return item?.count || 0;
  };

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>24小时分布</Text>
      <View style={styles.hourContainer}>
        <View style={styles.hourChart}>
          {hours.map(hour => {
            const count = getCount(hour);
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const isHourActive = hour >= 6 && hour <= 22;
            return (
              <View key={hour} style={styles.hourItem}>
                <View style={styles.hourBarWrapper}>
                  <LinearGradient
                    colors={[
                      isHourActive ? CYBER_THEME.primary : CYBER_THEME.secondary,
                      isHourActive ? CYBER_THEME.secondary : 'rgba(191,0,255,0.5)',
                    ] as [string, string]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 0, y: 0 }}
                    style={[
                      styles.hourBar,
                      { height: `${Math.max(height, 3)}%` },
                      count > 0 && styles.hourBarActive,
                    ]}
                  />
                </View>
                {hour % 3 === 0 && (
                  <Text style={styles.hourLabel}>{hour}</Text>
                )}
              </View>
            );
          })}
        </View>
        <Text style={styles.hourAxisLabel}>小时</Text>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const router = useSafeRouter();
  const [stats, setStats] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, recordsData] = await Promise.all([
        getRecordStats(),
        getAllRecords(),
      ]);
      setStats(statsData);
      setRecords(recordsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  // 准备周数据
  const weekdayData = stats?.byWeekday?.map((item: any) => ({
    weekday: item.weekday,
    count: item.count,
  })) || [];

  // 准备热力图数据
  const heatmapData = stats?.dailyStats?.map((item: any) => ({
    date: item.date,
    count: item.count,
  })) || [];

  // 准备散点图数据（最近20条记录的间隔时间）
  const scatterData: ScatterData[] = records
    .slice(0, 20)
    .reverse()
    .map((record, index) => ({
      index,
      interval: record.intervalTime || 0,
      date: record.date,
    }))
    .filter(d => d.interval > 0);

  // 准备折线图数据（最近7天每日数量）
  const lineChartData = stats?.dailyStats
    ?.slice(0, 7)
    .reverse()
    .map((item: any) => ({
      label: item.date.slice(5),
      value: item.count,
    })) || [];

  // 准备24小时分布数据
  const hourDistributionData = (() => {
    const hourCounts: Record<number, number> = {};
    records.forEach(record => {
      const hour = parseInt(record.time.split(':')[0], 10);
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    return Object.entries(hourCounts).map(([hour, count]) => ({
      hour: parseInt(hour, 10),
      count,
    }));
  })();

  if (loading || !stats) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={CYBER_THEME.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>数据分析</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={CYBER_THEME.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>数据分析</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* 概览卡片 */}
        <View style={styles.overviewSection}>
          <LinearGradient
            colors={['rgba(0,240,255,0.1)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.overviewGradient}
          >
            <View style={styles.overviewContent}>
              <Ionicons name="analytics" size={32} color={CYBER_THEME.primary} />
              <Text style={styles.overviewTitle}>数据概览</Text>
            </View>
          </LinearGradient>
        </View>

        {/* 统计卡片 */}
        <View style={styles.statsGrid}>
          <StatCard
            label="总记录数"
            value={stats.totalCount}
            subLabel="条"
            color={CYBER_THEME.primary}
          />
          <StatCard
            label="近7天"
            value={stats.last7Days}
            subLabel="条"
            color={CYBER_THEME.secondary}
          />
          <StatCard
            label="近30天"
            value={stats.last30Days}
            subLabel="条"
            color={CYBER_THEME.success}
          />
          <StatCard
            label="平均间隔"
            value={stats.avgInterval > 0 ? formatDuration(Math.round(stats.avgInterval)) : '--'}
            color={CYBER_THEME.accent}
          />
        </View>

        {/* 间隔统计 */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.halfCard]}>
            <Text style={styles.statLabel}>最短间隔</Text>
            <Text style={[styles.statValue, { fontSize: 20, color: CYBER_THEME.success }]}>
              {stats.minInterval > 0 ? formatDuration(stats.minInterval) : '--'}
            </Text>
          </View>
          <View style={[styles.statCard, styles.halfCard]}>
            <Text style={styles.statLabel}>最长间隔</Text>
            <Text style={[styles.statValue, { fontSize: 20, color: CYBER_THEME.accent }]}>
              {stats.maxInterval > 0 ? formatDuration(stats.maxInterval) : '--'}
            </Text>
          </View>
        </View>

        {/* 热力图 */}
        <Heatmap data={heatmapData} />

        {/* 星期分布 */}
        <WeekdayChart data={weekdayData} />

        {/* 散点图 - 间隔时间趋势 */}
        {scatterData.length > 0 && <ScatterPlot data={scatterData} />}

        {/* 折线图 - 每日数量趋势 */}
        {lineChartData.length > 0 && <LineChart data={lineChartData} title="每日数量" />}

        {/* 24小时分布 */}
        {hourDistributionData.length > 0 && <HourDistribution data={hourDistributionData} />}

        {/* 月度趋势 */}
        {stats.byMonth && stats.byMonth.length > 0 && (
          <BarChart
            title="月度趋势"
            data={stats.byMonth.slice(0, 6).map((item: any) => ({
              label: item.month.split('-')[1] + '月',
              value: item.count,
              maxValue: Math.max(...stats.byMonth.slice(0, 6).map((i: any) => i.count), 1),
            }))}
          />
        )}

        {/* 空状态提示 */}
        {stats.totalCount === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={CYBER_THEME.textMuted} />
            <Text style={styles.emptyText}>还没有记录数据</Text>
            <Text style={styles.emptySubText}>点击首页按钮开始记录吧</Text>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: CYBER_THEME.textSecondary,
    fontSize: 14,
  },
  overviewSection: {
    marginBottom: 16,
  },
  overviewGradient: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CYBER_THEME.border,
    overflow: 'hidden',
  },
  overviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  overviewTitle: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: CYBER_THEME.textPrimary,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginBottom: 12,
  },
  statCard: {
    width: '47%',
    marginHorizontal: '1.5%',
    marginBottom: 12,
    backgroundColor: CYBER_THEME.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CYBER_THEME.border,
    padding: 16,
  },
  halfCard: {
    width: '47%',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -6,
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 11,
    color: CYBER_THEME.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  statSubLabel: {
    fontSize: 12,
    color: CYBER_THEME.textMuted,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: CYBER_THEME.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CYBER_THEME.border,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 12,
    color: CYBER_THEME.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    width: 24,
    height: 80,
    backgroundColor: CYBER_THEME.background,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: CYBER_THEME.textMuted,
    marginTop: 6,
  },
  barValue: {
    fontSize: 11,
    color: CYBER_THEME.textSecondary,
    marginTop: 2,
  },
  weekdayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  weekdayItem: {
    alignItems: 'center',
  },
  weekdayBarWrapper: {
    width: 32,
    height: 80,
    backgroundColor: CYBER_THEME.background,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  weekdayBar: {
    width: '100%',
    borderRadius: 4,
    minHeight: 4,
  },
  weekdayLabel: {
    fontSize: 10,
    color: CYBER_THEME.textMuted,
    marginTop: 6,
  },
  weekdayCount: {
    fontSize: 11,
    color: CYBER_THEME.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  heatmapContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  heatmapItem: {
    alignItems: 'center',
    width: `${100 / 7}%`,
    marginBottom: 8,
  },
  heatmapCell: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginBottom: 4,
  },
  heatmapCellActive: {
    borderWidth: 1,
    borderColor: CYBER_THEME.primary,
  },
  heatmapLabel: {
    fontSize: 9,
    color: CYBER_THEME.textMuted,
  },
  heatmapLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendText: {
    fontSize: 10,
    color: CYBER_THEME.textMuted,
    marginHorizontal: 8,
  },
  legendCell: {
    width: 16,
    height: 16,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: CYBER_THEME.textSecondary,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    color: CYBER_THEME.textMuted,
    marginTop: 8,
  },
  // 散点图样式
  scatterContainer: {
    height: 180,
    position: 'relative',
    marginTop: 8,
  },
  scatterGrid: {
    position: 'absolute',
    left: 30,
    right: 30,
    top: 10,
    bottom: 30,
  },
  scatterDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    transform: [{ translateX: -5 }, { translateY: 5 }],
  },
  scatterDotGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 5,
  },
  scatterAxis: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  scatterAxisLabel: {
    fontSize: 10,
    color: CYBER_THEME.textMuted,
    flex: 1,
  },
  scatterLabels: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  scatterMinLabel: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    fontSize: 10,
    color: CYBER_THEME.secondary,
  },
  scatterMaxLabel: {
    position: 'absolute',
    right: 10,
    top: 10,
    fontSize: 10,
    color: CYBER_THEME.primary,
  },
  // 折线图样式
  lineChartContainer: {
    height: 180,
    position: 'relative',
    marginTop: 8,
  },
  gridLine: {
    position: 'absolute',
    left: 30,
    right: 10,
    height: 1,
    backgroundColor: 'rgba(0,240,255,0.1)',
  },
  lineWrapper: {
    position: 'absolute',
    left: 30,
    right: 10,
    top: 5,
    bottom: 25,
  },
  lineSegment: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    minWidth: 1,
    backgroundColor: CYBER_THEME.primary,
  },
  lineDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    transform: [{ translateX: -4 }, { translateY: 4 }],
  },
  lineDotGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  lineChartLabels: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  lineChartLabel: {
    fontSize: 9,
    color: CYBER_THEME.textMuted,
  },
  // 24小时分布样式
  hourContainer: {
    marginTop: 8,
  },
  hourChart: {
    flexDirection: 'row',
    height: 120,
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  hourItem: {
    flex: 1,
    alignItems: 'center',
  },
  hourBarWrapper: {
    width: '100%',
    height: 100,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  hourBar: {
    width: 6,
    borderRadius: 3,
    minHeight: 3,
  },
  hourBarActive: {
    borderWidth: 1,
    borderColor: CYBER_THEME.primary,
  },
  hourLabel: {
    fontSize: 9,
    color: CYBER_THEME.textMuted,
    marginTop: 4,
  },
  hourAxisLabel: {
    fontSize: 10,
    color: CYBER_THEME.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
});
