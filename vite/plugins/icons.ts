import Icons from 'unplugin-icons/vite';

export default () => {
  return Icons({
    // 禁用自动安装图标库以避免 ES 模块兼容性问题
    autoInstall: false
  });
};
