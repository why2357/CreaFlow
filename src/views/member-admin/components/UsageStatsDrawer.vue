<template>
  <el-drawer
    v-model="visible"
    :title="currentStatType === 1 ? '用量统计' : '模型统计'"
    :size="800"
    @close="handleClose"
  >
    <div class="usage-stats-container">
      <!-- 标签页和日期选择器 -->
      <div class="header-section">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="日统计" name="day" />
          <el-tab-pane label="周统计" name="week" />
          <el-tab-pane label="月统计" name="month" />
        </el-tabs>

        <div class="date-picker-section">
          <!-- 日统计：日期选择器 -->
          <el-date-picker
            v-if="activeTab === 'day'"
            v-model="selectedDatePicker"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            format="YYYY-MM-DD"
            @change="handleDatePickerChange"
          />

          <!-- 周统计：月份选择器 -->
          <el-date-picker
            v-if="activeTab === 'week'"
            v-model="weekMonthPicker"
            type="month"
            placeholder="选择月份"
            value-format="YYYY-MM"
            format="YYYY-MM"
            @change="handleWeekMonthPickerChange"
          />

          <!-- 月统计：年份选择器 -->
          <el-date-picker
            v-if="activeTab === 'month'"
            v-model="yearPicker"
            type="year"
            placeholder="选择年份"
            value-format="YYYY"
            format="YYYY"
            @change="handleYearPickerChange"
          />
        </div>
      </div>

      <!-- 统计数据展示 -->
      <div v-loading="loading" class="stats-content">
        <!-- 日统计且时间统计时显示总用量 -->
        <div v-if="activeTab === 'day' && currentStatType === 1" class="total-usage">
          <div class="label">用量</div>
          <div class="value">{{ totalPoints }}</div>
        </div>

        <!-- 月统计且时间统计时显示图表 -->
        <div v-if="activeTab === 'month' && currentStatType === 1" ref="chartRef" class="chart-container"></div>

        <!-- 统一表格展示 -->
        <div class="list-content" v-if="!(activeTab === 'day' && currentStatType === 1)">
          <div class="list-header">
            <div class="header-label">{{ currentStatType === 1 ? '日期' : '模型' }}</div>
            <div class="header-label">用量</div>
          </div>
          <div v-for="item in statsData" :key="item.id" class="list-item">
            <div class="item-date">{{ item.dimensionName || item.displayDate }}</div>
            <div class="item-points">{{ item.points }}</div>
          </div>
          <el-empty v-if="statsData.length === 0" description="暂无数据" />
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
  import { getMemberPointsStat } from '@/api/system/user';
  import { HivisionPointsReportVo } from '@/api/system/user/types';
  import * as echarts from 'echarts';
  import { computed, nextTick, ref, watch } from 'vue';

  const visible = ref(false);
  const loading = ref(false);
  const activeTab = ref<'day' | 'week' | 'month'>('day');
  const statsData = ref<HivisionPointsReportVo[]>([]);
  const currentUserId = ref<number>(0);
  const currentStatType = ref<number>(1); // 1-时间统计 2-模型统计

  // 日统计相关
  const selectedDate = ref(new Date());
  const selectedDatePicker = ref('');

  // 周统计年月
  const weekYear = ref(new Date().getFullYear());
  const weekMonth = ref(new Date().getMonth() + 1);
  const weekMonthPicker = ref('');

  // 月统计年份
  const chartYear = ref(new Date().getFullYear());
  const yearPicker = ref('');
  const chartRef = ref<HTMLElement>();
  let chartInstance: echarts.ECharts | null = null;

  // 总用量
  const totalPoints = computed(() => {
    return statsData.value.reduce((sum, item) => sum + (item.points || 0), 0);
  });

  const open = (userId: number, statType = 1) => {
    currentUserId.value = userId;
    currentStatType.value = statType;
    visible.value = true;
    activeTab.value = 'day';
    const today = new Date();
    selectedDate.value = today;
    selectedDatePicker.value = formatDate(today);
    weekYear.value = today.getFullYear();
    weekMonth.value = today.getMonth() + 1;
    weekMonthPicker.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    chartYear.value = today.getFullYear();
    yearPicker.value = String(today.getFullYear());
    loadData();
  };

  const handleClose = () => {
    visible.value = false;
    statsData.value = [];
    activeTab.value = 'day';
    if (chartInstance) {
      chartInstance.dispose();
      chartInstance = null;
    }
  };

  const handleTabChange = () => {
    loadData();
  };

  const loadData = async () => {
    if (!currentUserId.value) return;

    loading.value = true;
    try {
      let dateParam: string;
      let timeType: number;

      if (activeTab.value === 'day') {
        // 日统计：传天 格式：YYYY-MM-DD (例: 2025-11-21)
        dateParam = formatDate(selectedDate.value);
        timeType = 1;
      } else if (activeTab.value === 'week') {
        // 周统计：传年月 格式：YYYY-MM (例: 2025-11)
        const weekDate = new Date(weekYear.value, weekMonth.value - 1, 1);
        dateParam = formatYearMonth(weekDate);
        timeType = 2;
      } else {
        // 月统计：传年份 格式：YYYY (例: 2025)
        dateParam = String(chartYear.value);
        timeType = 3;
      }

      const res = await getMemberPointsStat({
        userId: currentUserId.value,
        statType: currentStatType.value, // 1-时间统计 2-模型统计
        timeType,
        startStatTime: dateParam,
        endStatTime: dateParam
      });

      statsData.value = res.data || [];

      // 如果是月统计，渲染图表
      if (activeTab.value === 'month') {
        await nextTick();
        renderChart();
      }
    } catch (error) {
      console.error('Load stats data failed:', error);
    } finally {
      loading.value = false;
    }
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatYearMonth = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const handleDatePickerChange = (value: string) => {
    if (value) {
      selectedDate.value = new Date(value);
      loadData();
    }
  };

  const handleWeekMonthPickerChange = (value: string) => {
    if (value) {
      const [year, month] = value.split('-');
      weekYear.value = parseInt(year);
      weekMonth.value = parseInt(month);
      loadData();
    }
  };

  const handleYearPickerChange = (value: string) => {
    if (value) {
      chartYear.value = parseInt(value);
      loadData();
    }
  };

  const renderChart = () => {
    if (!chartRef.value) return;

    if (chartInstance) {
      chartInstance.dispose();
    }

    chartInstance = echarts.init(chartRef.value);

    // 准备12个月的数据
    const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const monthData = new Array(12).fill(0);

    statsData.value.forEach((item) => {
      if (item.month && item.month >= 1 && item.month <= 12) {
        monthData[item.month - 1] = item.points || 0;
      }
    });

    const option: echarts.EChartsOption = {
      grid: {
        top: 30,
        right: 30,
        bottom: 30,
        left: 50
      },
      xAxis: {
        type: 'category',
        data: monthLabels,
        axisLine: {
          lineStyle: {
            color: '#E5E7EB'
          }
        },
        axisLabel: {
          color: '#6B7280'
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#6B7280'
        },
        splitLine: {
          lineStyle: {
            color: '#E5E7EB',
            type: 'dashed'
          }
        }
      },
      series: [
        {
          data: monthData,
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: {
            color: '#FF6B9D',
            width: 3
          },
          itemStyle: {
            color: '#FF6B9D'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 107, 157, 0.3)' },
              { offset: 1, color: 'rgba(255, 107, 157, 0.05)' }
            ])
          }
        }
      ]
    };

    chartInstance.setOption(option);
  };

  watch(
    () => visible.value,
    (val) => {
      if (!val && chartInstance) {
        chartInstance.dispose();
        chartInstance = null;
      }
    }
  );

  defineExpose({
    open
  });
</script>

<style scoped lang="scss">
  .usage-stats-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .header-section {
    position: relative;
    margin-bottom: 20px;

    :deep(.el-tabs__header) {
      margin-bottom: 0;
    }

    :deep(.el-tabs__nav-wrap::after) {
      display: none;
    }

    .date-picker-section {
      position: absolute;
      top: 8px;
      right: 0;
      z-index: 10;
    }
  }

  .stats-content {
    flex: 1;
    overflow-y: auto;
  }

  .total-usage {
    text-align: center;
    margin-bottom: 30px;

    .label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 8px;
    }

    .value {
      font-size: 48px;
      font-weight: 600;
      color: #111827;
    }
  }

  .chart-container {
    width: 100%;
    height: 300px;
    margin-bottom: 30px;
  }

  .list-content {
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 20px;
      background-color: #f9fafb;
      border-bottom: 2px solid #e5e7eb;
      font-weight: 600;

      .header-label {
        font-size: 14px;
        color: #6b7280;
      }
    }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;

      .item-date {
        font-size: 14px;
        color: #374151;
      }

      .item-points {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
      }
    }
  }
</style>
