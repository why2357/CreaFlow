import { createSvgIconsPlugin } from 'vite-plugin-svg-icons';
export default (path: any, isBuild: boolean) => {
  return createSvgIconsPlugin({
    // 指定需要缓存的图标文件夹
    iconDirs: [path.resolve(path.resolve(__dirname, '../../src'), 'assets/icons/svg')],
    // 指定symbolId格式
    symbolId: 'icon-[dir]-[name]',
    svgoOptions: isBuild
      ? {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  // 保留 currentColor，不要转换为具体颜色
                  convertColors: false,
                  // 不移除未知的元素和属性
                  removeUnknownsAndDefaults: false
                }
              }
            }
          ]
        }
      : false
  });
};
