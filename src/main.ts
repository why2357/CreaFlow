import { createApp } from 'vue';
// global css
import '@/assets/styles/index.scss';
import 'element-plus/theme-chalk/dark/css-vars.css';
import 'uno.css';

// App、router、store
import App from './App.vue';
import router from './router';
import store from './store';

// 自定义指令
import directive from './directive';

// 注册插件
import { download } from '@/utils/request';
import plugins from './plugins/index'; // plugins

// 预设动画
import animate from './animate';

// svg图标
import ElementIcons from '@/plugins/svgicon';
import 'virtual:svg-icons-register';

// permission control
import usePermissionStore from '@/store/modules/permission';
import './permission';

import { getConfigKey, updateConfigByKey } from '@/api/system/config';
import { useDict } from '@/utils/dict';
import { addDateRange, handleTree, parseTime, selectDictLabel, selectDictLabels, verification } from '@/utils/sskj';

// 国际化
import i18n from '@/lang/index';

const app = createApp(App);
// 全局方法挂载
app.config.globalProperties.useDict = useDict;
app.config.globalProperties.getConfigKey = getConfigKey;
app.config.globalProperties.updateConfigByKey = updateConfigByKey;
app.config.globalProperties.download = download;
app.config.globalProperties.parseTime = parseTime;
app.config.globalProperties.handleTree = handleTree;
app.config.globalProperties.addDateRange = addDateRange;
app.config.globalProperties.selectDictLabel = selectDictLabel;
app.config.globalProperties.selectDictLabels = selectDictLabels;
app.config.globalProperties.verification = verification;
app.config.globalProperties.animate = animate;

app.use(ElementIcons);
app.use(router);
app.use(store);
app.use(i18n);
app.use(plugins);
// 自定义指令
directive(app);

// 初始化静态菜单
const permissionStore = usePermissionStore();
permissionStore.initStaticMenus();

app.mount('#app');
