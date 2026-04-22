<template>
  <div class="min-h-screen bg-slate-100 antialiased text-slate-900 font-sans">
    
    <nav class="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <div class="w-8 h-8 bg-gradient-to-tr from-blue-700 to-indigo-500 rounded-lg flex items-center justify-center text-white shadow-md">
            <span class="text-lg font-black italic">L</span>
          </div>
          <span class="text-xl font-black tracking-tighter text-slate-800">STOCK<span class="text-blue-600">PRO</span></span>
        </div>

        <div class="group relative flex items-center bg-slate-100 rounded-xl px-4 py-1.5 border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all shadow-inner">
          <label class="text-[10px] font-bold text-slate-400 uppercase mr-3">Ticker</label>
          <el-select v-model="currentSymbol" class="custom-select" size="small">
            <el-option v-for="s in SYMBOLS" :key="s" :label="s" :value="s" />
          </el-select>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div class="mb-8">
        <h2 class="text-3xl font-extrabold text-slate-800 tracking-tight">Market Dashboard</h2>
        <p class="text-slate-500 text-sm mt-1 font-medium">查看实时 K 线指标及多维度技术分析报告</p>
      </div>

      <StockChart :symbol="currentSymbol" />
    </main>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import StockChart from './components/StockChart.vue';

const SYMBOLS = ["ONDS", "AXTI", "AVAV", "BE", "RKLB", "AAPL", "NVTS"];
const currentSymbol = ref("NVTS.US");
</script>

<style>
/* 稍微优化一下 Element Plus 在 Tailwind 里的违和感 */
.custom-select {
  --el-select-input-focus-border-color: transparent;
  --el-border-color: transparent;
  --el-fill-control-bg: transparent;
  width: 120px;
}
.custom-select .el-input__wrapper {
  background-color: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
}
.custom-select .el-input__inner {
  font-weight: 800 !important;
  color: #1e293b !important;
}
</style>