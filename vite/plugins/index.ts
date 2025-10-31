import vue from '@vitejs/plugin-vue';
import createUnoCss from './unocss';
import createAutoImport from './auto-import';
import createComponents from './components';
// import createIcons from './icons';
import createSvgIconsPlugin from './svg-icon';
import createCompression from './compression';
import createSetupExtend from './setup-extend';
import path from 'path';

export default (viteEnv: any, isBuild = false): [] => {
  const vitePlusgins: any = [];
  vitePlusgins.push(vue());
  vitePlusgins.push(createUnoCss());
  vitePlusgins.push(createAutoImport(path));
  vitePlusgins.push(createComponents(path));
  vitePlusgins.push(createCompression(viteEnv));
  // vitePlusgins.push(createIcons()); // 暂时禁用 icons 插件以解决 ES 模块兼容性问题
  vitePlusgins.push(createSvgIconsPlugin(path, isBuild));
  vitePlusgins.push(createSetupExtend());
  return vitePlusgins;
};
