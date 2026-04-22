<template>
  <div class="flex flex-col w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6 font-sans">
    
    <div class="flex items-center justify-between px-6 py-4 bg-slate-50/50 backdrop-blur-sm border-b border-slate-200">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-slate-800 leading-tight">{{ symbol }}</h3>
          <p class="text-xs text-slate-500 font-medium tracking-wide uppercase">Technical Analysis</p>
        </div>
      </div>

      <div class="flex items-center px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
        <span class="relative flex h-2 w-2 mr-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span class="text-[11px] font-bold text-emerald-700 uppercase">Live Data</span>
      </div>
    </div>

    <div class="relative p-4 bg-white">
      <div v-if="loading" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px] transition-all">
        <div class="relative flex items-center justify-center">
          <div class="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div class="absolute w-6 h-6 border-4 border-slate-100 border-b-slate-400 rounded-full animate-reverse-spin"></div>
        </div>
        <span class="mt-4 text-sm font-semibold text-slate-600 animate-pulse">解析行情数据...</span>
      </div>

      <div ref="chartRef" class="w-full h-[580px] sm:h-[650px]"></div>
    </div>

    <div class="flex items-center justify-between px-6 py-3 bg-slate-50 text-[10px] sm:text-xs text-slate-400 border-t border-slate-100">
      <div class="flex space-x-4">
        <span class="flex items-center"><i class="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></i>BOLL (20, 2)</span>
        <span class="flex items-center"><i class="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></i>MACD (12, 26, 9)</span>
      </div>
      <span class="hidden sm:inline italic text-slate-300">Market Engine Active</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  symbol: { type: String, required: true }
});

const chartRef = ref(null);
const loading = ref(false);
let myChart = null;

// --- 核心计算函数 ---

const calculateBOLL = (values) => {
  const period = 20;
  let upper = [], lower = [], mid = [];
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      upper.push('-'); lower.push('-'); mid.push('-'); continue;
    }
    const slice = values.slice(i - period + 1, i + 1).map(v => v[1]); // Close price
    const ma = slice.reduce((a, b) => a + b) / period;
    const std = Math.sqrt(slice.map(x => Math.pow(x - ma, 2)).reduce((a, b) => a + b) / period);
    mid.push(ma.toFixed(3));
    upper.push((ma + 2 * std).toFixed(3));
    lower.push((ma - 2 * std).toFixed(3));
  }
  return { upper, lower, mid };
};

const calculateMACD = (values) => {
  let ema12 = 0, ema26 = 0, diff = [], dea = [], bar = [];
  let deaPrev = 0;
  values.forEach((v, i) => {
    const close = v[1];
    if (i === 0) { ema12 = ema26 = close; } 
    else {
      ema12 = ema12 * 11/13 + close * 2/13;
      ema26 = ema26 * 25/27 + close * 2/27;
    }
    const diffVal = ema12 - ema26;
    const deaVal = i === 0 ? diffVal : deaPrev * 0.8 + diffVal * 0.2;
    diff.push(diffVal.toFixed(4));
    dea.push(deaVal.toFixed(4));
    bar.push(((diffVal - deaVal) * 2).toFixed(4));
    deaPrev = deaVal;
  });
  return { diff, dea, bar };
};

// --- 渲染函数 ---

const renderChart = (processedData) => {
  if (!myChart) return;

  const dates = processedData.map(d => d.date);
  const kData = processedData.map(d => d.values);
  const boll = calculateBOLL(kData);
  const macd = calculateMACD(kData);

  const option = {
    animation: false,
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    axisPointer: { link: [{ xAxisIndex: 'all' }] },
    grid: [
      { left: '60', right: '30', height: '65%', top: '10%' },
      { left: '60', right: '30', top: '82%', height: '10%' }
    ],
    xAxis: [
      { type: 'category', data: dates, boundaryGap: false, splitLine: { show: false } },
      { type: 'category', gridIndex: 1, data: dates, boundaryGap: false, axisLabel: { show: false } }
    ],
    yAxis: [
      { scale: true, splitArea: { show: true } },
      { scale: true, gridIndex: 1, splitNumber: 2, axisLabel: { fontSize: 10 } }
    ],
    dataZoom: [
      { type: 'inside', xAxisIndex: [0, 1], start: 90, end: 100 },
      { show: true, xAxisIndex: [0, 1], type: 'slider', top: '93%', start: 90, end: 100 }
    ],
    series: [
      {
        name: 'K线', type: 'candlestick', data: kData,
        itemStyle: { color: '#ef4444', color0: '#10b981', borderColor: '#ef4444', borderColor0: '#10b981' }
      },
      { name: 'BOLL中轨', type: 'line', data: boll.mid, smooth: true, showSymbol: false, lineStyle: { opacity: 0.5, color: '#3b82f6' } },
      { name: 'BOLL上轨', type: 'line', data: boll.upper, smooth: true, showSymbol: false, lineStyle: { opacity: 0.3, type: 'dashed', color: '#94a3b8' } },
      { name: 'BOLL下轨', type: 'line', data: boll.lower, smooth: true, showSymbol: false, lineStyle: { opacity: 0.3, type: 'dashed', color: '#94a3b8' } },
      {
        name: 'MACD', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: macd.bar,
        itemStyle: { color: (p) => p.data >= 0 ? '#ef4444' : '#10b981' }
      },
      { name: 'DIFF', type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: macd.diff, showSymbol: false, lineStyle: { color: '#6366f1' } },
      { name: 'DEA', type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: macd.dea, showSymbol: false, lineStyle: { color: '#f59e0b' } }
    ]
  };
  myChart.setOption(option, true);
};

// --- 加载逻辑 ---

const loadData = async () => {
  loading.value = true;
  try {
    const symbolKey = props.symbol.replace('.', '_');
    const res = await fetch(`/stockData/${symbolKey}/${symbolKey}.json`);
    const data = await res.json();
    
    const processed = data.map(item => ({
      date: item.timestamp.split('T')[0],
      values: [
        parseFloat(item.open), 
        parseFloat(item.close), 
        parseFloat(item.low), 
        parseFloat(item.high)
      ]
    }));

    await nextTick();
    // 确保初始化
    if (!myChart && chartRef.value) {
      myChart = echarts.init(chartRef.value);
    }
    
    // 关键点：调用渲染函数！
    renderChart(processed); 
    
  } catch (e) {
    console.error("加载出错了！", e);
  } finally {
    // 动画平滑处理
    setTimeout(() => { loading.value = false; }, 400);
  }
};

watch(() => props.symbol, loadData);
onMounted(loadData);

onUnmounted(() => {
  if (myChart) myChart.dispose();
  window.removeEventListener('resize', () => myChart?.resize());
});

window.addEventListener('resize', () => myChart?.resize());
</script>

<style>
@keyframes reverse-spin {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}
.animate-reverse-spin {
  animation: reverse-spin 1s linear infinite;
}
</style>