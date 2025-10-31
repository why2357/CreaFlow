import zhCN from 'element-plus/es/locale/lang/zh-cn';
import enUS from 'element-plus/es/locale/lang/en';

export const useAppStore = defineStore('app', () => {
  // 侧边栏始终保持打开状态
  const sidebar = reactive({
    opened: true,
    withoutAnimation: false,
    hide: false
  });
  const device = ref<string>('desktop');
  const size = useStorage('size', 'default');

  // 语言
  const language = useStorage('language', 'zh_CN');
  const languageObj: any = {
    en_US: enUS,
    zh_CN: zhCN
  };
  const locale = computed(() => {
    return languageObj[language.value];
  });

  const toggleSideBar = (withoutAnimation: boolean) => {
    // 禁用侧边栏切换功能，始终保持打开
    return false;
  };

  const closeSideBar = ({ withoutAnimation }: any): void => {
    // 禁用侧边栏关闭功能，始终保持打开
    return;
  };
  const toggleDevice = (d: string): void => {
    device.value = d;
  };
  const setSize = (s: string): void => {
    size.value = s;
  };
  const toggleSideBarHide = (status: boolean): void => {
    sidebar.hide = status;
  };

  const changeLanguage = (val: string): void => {
    language.value = val;
  };

  return {
    device,
    sidebar,
    language,
    locale,
    size,
    changeLanguage,
    toggleSideBar,
    closeSideBar,
    toggleDevice,
    setSize,
    toggleSideBarHide
  };
});

export default useAppStore;
