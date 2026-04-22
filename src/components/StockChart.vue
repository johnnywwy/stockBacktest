<template>
    <div
        class="flex flex-col w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-6 font-sans">

        <div
            class="flex items-center justify-between px-6 py-4 bg-slate-50/50 backdrop-blur-sm border-b border-slate-200">
            <div class="flex items-center space-x-3">
                <div class="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-200">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <div>
                    <h3 class="text-lg font-bold text-slate-800 leading-tight">{{ symbol }}</h3>
                    <p class="text-xs text-slate-500 font-medium tracking-wide uppercase italic">NTP Advanced Engine</p>
                </div>
            </div>

            <div class="flex items-center px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                <span class="relative flex h-2 w-2 mr-2">
                    <span
                        class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span class="text-[10px] font-black text-emerald-700 uppercase">Live Data</span>
            </div>
        </div>

        <div class="relative p-4 bg-white">
            <div v-if="loading"
                class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[2px]">
                <div class="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                <span class="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading...</span>
            </div>

            <div ref="chartRef" class="w-full h-[600px] sm:h-[680px]"></div>
        </div>

        <div class="flex items-center justify-between px-6 py-2 bg-slate-50 border-t border-slate-100">
            <div class="flex items-center space-x-2">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter mr-2">Indicators:</span>

                <button @click="visibleSeries.boll = !visibleSeries.boll; toggleSeries()"
                    :class="visibleSeries.boll ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500 opacity-60'"
                    class="px-2 py-0.5 rounded text-[10px] font-black uppercase transition-all active:scale-90">BOLL</button>

                <button @click="visibleSeries.macd = !visibleSeries.macd; toggleSeries()"
                    :class="visibleSeries.macd ? 'bg-amber-500 text-white shadow-sm' : 'bg-slate-200 text-slate-500 opacity-60'"
                    class="px-2 py-0.5 rounded text-[10px] font-black uppercase transition-all active:scale-90">MACD</button>

                <button @click="visibleSeries.ntp = !visibleSeries.ntp; toggleSeries()"
                    :class="visibleSeries.ntp ? 'bg-fuchsia-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500 opacity-60'"
                    class="px-2 py-0.5 rounded text-[10px] font-black uppercase transition-all active:scale-90">NTP</button>

                <button @click="visibleSeries.kline = !visibleSeries.kline; toggleSeries()"
                    :class="visibleSeries.kline ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-200 text-slate-500 opacity-60'"
                    class="px-2 py-0.5 rounded text-[10px] font-black uppercase transition-all active:scale-90">K-Line</button>
            </div>

            <div class="flex space-x-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span class="hidden sm:inline">NTP Algorithm Active</span>
                <span class="text-emerald-500">● Connection Stable</span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
    symbol: { type: String, required: true }
});

const chartRef = ref(null);
const loading = ref(false);
let myChart = null;

// 指标可见性状态
const visibleSeries = ref({
    boll: true,
    macd: true,
    kline: true,
    ntp: true
});

// 缓存 NTP 标记点数据
let ntpPointsCache = [];

// --- 1. NTP 核心算法逻辑 ---
const calculateNTP = (data) => {
    const markPoints = [];
    const closes = data.map(d => d.values[1]);
    const lows = data.map(d => d.values[2]);
    const highs = data.map(d => d.values[3]);
    const dates = data.map(d => d.date);

    const check = (index, count, type) => {
        if (index < count + 4) return false;
        for (let i = 0; i < count; i++) {
            const idx = index - i;
            if (type === 'buy') {
                if (!(closes[idx] < closes[idx - 4])) return false;
            } else {
                if (!(closes[idx] > closes[idx - 4])) return false;
            }
        }
        return true;
    };

    const whiteLabel = { color: '#ffffff', fontWeight: 'bold', fontSize: 9 };

    for (let i = 15; i < closes.length; i++) {
        // 买入信号
        const buy1 = check(i, 9, 'buy');
        const buy2 = check(i, 12, 'buy');
        const pBuy1 = check(i - 1, 9, 'buy');
        const pBuy2 = check(i - 1, 12, 'buy');

        if (buy2 && !pBuy2) {
            markPoints.push({
                name: '买2',
                value: '买2',
                xAxis: dates[i],
                yAxis: lows[i] * 0.98,
                symbol: 'pin',
                symbolSize: 30,
                symbolRotate: 180, // 旋转180度，使尖头向上指向K线
                symbolOffset: [0, '15%'],
                itemStyle: { color: 'red' },
                label: { ...whiteLabel, offset: [0, 8] }

            });
        } else if (buy1 && !pBuy1) {
            markPoints.push({
                name: '买1', value: '买1', xAxis: dates[i], yAxis: lows[i],
                itemStyle: { color: 'red' },
                symbol: 'pin',
                symbolSize: 30,
                symbolRotate: 180, // 旋转180度，使尖头向上指向K线
                symbolOffset: [0, '15%'],
                label: { ...whiteLabel, offset: [0, 8] }
            });
        }

        // 卖出信号
        const sell1 = check(i, 9, 'sell');
        const sell2 = check(i, 12, 'sell');
        const pSell1 = check(i - 1, 9, 'sell');
        const pSell2 = check(i - 1, 12, 'sell');

        if (sell2 && !pSell2) {
            markPoints.push({
                name: '卖2', value: '卖2', xAxis: dates[i], yAxis: highs[i] * 1.02,
                itemStyle: { color: 'green' },
                symbolSize: 30,
                symbolRotate: 0, // 旋转180度，使尖头向上指向K线
                symbolOffset: [0, '15%'],
                label: { ...whiteLabel, offset: [0, 0] }
            });
        } else if (sell1 && !pSell1) {
            markPoints.push({
                name: '卖1', value: '卖1', xAxis: dates[i], yAxis: highs[i] * 1.02,
                itemStyle: { color: 'green' },
                symbolSize: 30,
                symbolRotate: 0, // 旋转180度，使尖头向上指向K线
                symbolOffset: [0, '15%'],
                label: { ...whiteLabel, offset: [0, 0] }
            });
        }
    }
    return markPoints;
};

// --- 2. BOLL 算法 ---
const calculateBOLL = (values) => {
    const period = 20;
    let upper = [], lower = [], mid = [];
    for (let i = 0; i < values.length; i++) {
        if (i < period - 1) { upper.push('-'); lower.push('-'); mid.push('-'); continue; }
        const slice = values.slice(i - period + 1, i + 1).map(v => v[1]);
        const ma = slice.reduce((a, b) => a + b) / period;
        const std = Math.sqrt(slice.map(x => Math.pow(x - ma, 2)).reduce((a, b) => a + b) / period);
        mid.push(ma.toFixed(3));
        upper.push((ma + 2 * std).toFixed(3));
        lower.push((ma - 2 * std).toFixed(3));
    }
    return { upper, lower, mid };
};

// --- 3. MACD 算法 ---
const calculateMACD = (values) => {
    let ema12 = 0, ema26 = 0, diff = [], dea = [], bar = [];
    let deaPrev = 0;
    values.forEach((v, i) => {
        const close = v[1];
        if (i === 0) { ema12 = ema26 = close; }
        else {
            ema12 = ema12 * 11 / 13 + close * 2 / 13;
            ema26 = ema26 * 25 / 27 + close * 2 / 27;
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

// --- 4. 联动控制函数 ---
const toggleSeries = () => {
    if (!myChart) return;
    const groups = [
        { names: ['K线'], state: visibleSeries.value.kline },
        { names: ['BOLL中轨', 'BOLL上轨', 'BOLL下轨'], state: visibleSeries.value.boll },
        { names: ['MACD', 'DIFF', 'DEA'], state: visibleSeries.value.macd }
    ];
    groups.forEach(g => {
        g.names.forEach(name => {
            myChart.dispatchAction({ type: g.state ? 'legendSelect' : 'legendUnSelect', name });
        });
    });

    // NTP 信号开关控制
    myChart.setOption({
        series: [{
            name: 'K线',
            markPoint: { data: visibleSeries.value.ntp ? ntpPointsCache : [] }
        }]
    });
};

// --- 5. 渲染函数 ---
const renderChart = (data) => {
    if (!myChart) return;
    const dates = data.map(d => d.date);
    const kValues = data.map(d => d.values);
    const boll = calculateBOLL(kValues);
    const macd = calculateMACD(kValues);
    ntpPointsCache = calculateNTP(data);

    const option = {
        animation: false,
        tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
        legend: { show: false, data: ['K线', 'BOLL中轨', 'BOLL上轨', 'BOLL下轨', 'MACD', 'DIFF', 'DEA'] },
        grid: [
            { left: '60', right: '30', height: '65%', top: '8%' },
            { left: '60', right: '30', top: '80%', height: '12%' }
        ],
        xAxis: [
            { type: 'category', data: dates, boundaryGap: false, axisLine: { lineStyle: { color: '#eee' } } },
            { type: 'category', gridIndex: 1, data: dates, boundaryGap: false, axisLabel: { show: false } }
        ],
        yAxis: [
            { scale: true, splitArea: { show: true } },
            { scale: true, gridIndex: 1, splitNumber: 2, axisLabel: { fontSize: 9 } }
        ],
        dataZoom: [
            { type: 'inside', xAxisIndex: [0, 1], start: 90, end: 100 },
            { show: true, xAxisIndex: [0, 1], type: 'slider', top: '94%', height: 20, start: 90, end: 100 }
        ],
        series: [
            {
                name: 'K线', type: 'candlestick', data: kValues,
                itemStyle: { color: '#ef4444', color0: '#10b981', borderColor: '#ef4444', borderColor0: '#10b981' },
                markPoint: {
                    symbol: 'pin',
                    symbolSize: 32,
                    data: ntpPointsCache
                }
            },
            { name: 'BOLL中轨', type: 'line', data: boll.mid, smooth: true, showSymbol: false, lineStyle: { color: '#3b82f6', width: 1 } },
            { name: 'BOLL上轨', type: 'line', data: boll.upper, smooth: true, showSymbol: false, lineStyle: { color: '#94a3b8', type: 'dashed', opacity: 0.4 } },
            { name: 'BOLL下轨', type: 'line', data: boll.lower, smooth: true, showSymbol: false, lineStyle: { color: '#94a3b8', type: 'dashed', opacity: 0.4 } },
            {
                name: 'MACD', type: 'bar', xAxisIndex: 1, yAxisIndex: 1, data: macd.bar,
                itemStyle: { color: (p) => p.data >= 0 ? '#ef4444' : '#10b981' }
            },
            { name: 'DIFF', type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: macd.diff, showSymbol: false, lineStyle: { color: '#818cf8' } },
            { name: 'DEA', type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: macd.dea, showSymbol: false, lineStyle: { color: '#fbbf24' } }
        ]
    };

    myChart.setOption(option, true);
    toggleSeries(); // 渲染后同步状态
};

// --- 6. 数据请求逻辑 ---
const loadData = async () => {
    loading.value = true;
    try {
        // 路径修复逻辑
        let folderName = props.symbol.replace('.', '_');
        if (!folderName.includes('_')) {
            folderName += '_US';
        }

        const res = await fetch(`/stockData/${folderName}/${folderName}.json`);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

        const rawData = await res.json();
        const processed = rawData.map(item => ({
            date: item.timestamp.split('T')[0],
            values: [
                parseFloat(item.open),
                parseFloat(item.close),
                parseFloat(item.low),
                parseFloat(item.high)
            ]
        }));

        await nextTick();
        if (!myChart && chartRef.value) {
            myChart = echarts.init(chartRef.value);
        }
        renderChart(processed);

    } catch (e) {
        console.error("加载出错了，检查路径:", e);
    } finally {
        setTimeout(() => { loading.value = false; }, 200);
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
/* 针对 Loading 动画 */
@keyframes reverse-spin {
    from {
        transform: rotate(360deg);
    }

    to {
        transform: rotate(0deg);
    }
}

.animate-reverse-spin {
    animation: reverse-spin 1s linear infinite;
}
</style>