import { createApp } from 'vue'
// import './style.css'
import './index.css'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// import './output.css'
import App from './App.vue'

const app = createApp(App)

app.use(ElementPlus)
app.mount('#app')
