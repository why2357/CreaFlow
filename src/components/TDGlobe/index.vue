<template>
  <div ref="chart" style="width: 100%; height: 100%" />
</template>

<script setup lang="ts">
  import * as echarts from 'echarts';
  import 'echarts-gl';
  import earthBg from '../../assets/echarts/world_topo_bathy_200401.jpg';
  import starfield from '../../assets/echarts/starfield.jpg';
  import texture from '../../assets/echarts/texture.png';

  interface CountryData {
    name: string; // 城市名称
    value: [number, number, number]; // 经度、纬度和服务器数量
  }

  const chart = ref(null);
  let chartInstance; // 新建一个变量来保存ECharts实例
  const countryData: CountryData[] = [
    // 这里填入你的数据，例如：
    { name: '中国', value: [116.407394, 39.904211, 3000] },
    { name: '新加坡', value: [103.851959, 1.293333, 5000] },
    { name: '澳大利亚', value: [149.1244, -35.2809, 2000] },
    { name: '美国', value: [-77.036871, 38.895112, 4000] },
    { name: '瑞典', value: [18.068611, 59.329325, 1000] },
    { name: '巴西', value: [-47.929719, -15.780065, 3000] },
    { name: '墨西哥', value: [-99.133208, 19.432608, 3000] }
    // ... 其他城市数据
  ];

  onMounted(() => {
    // 配置散点图的颜色与数量之间的关系
    const colorValue = (val: number) => {
      // 假设数量范围在0到500之间，你可以根据需要调整范围和颜色
      if (val <= 1000) return '#FFEDA0';
      if (val <= 2000) return '#FFA500';
      if (val <= 3000) return '#FF8C00';
      if (val <= 4000) return '#FF7F50';
      return '#FF4500';
    };
    chartInstance = echarts.init(chart.value!);
    chartInstance.setOption({
      // 这里放echarts 的 option 配置
      globe: {
        baseTexture: earthBg, // 地球的纹理，可以是在线图片路径，也可以是本地图片路径
        heightTexture: earthBg, // 地形高度的纹理，用于实现地形的立体效果
        displacementScale: 0.04, // 地形的高度
        shading: 'realistic', // 主要负责着色效果
        environment: starfield, // 地球的背景，可以设置为星空、云层等
        realisticMaterial: {
          roughness: 0.9 // 材质的粗糙度
        },
        postEffect: {
          // 后期处理特效，对地球的全局效果
          enable: true
        },
        light: {
          // 光照效果
          main: {
            intensity: 5, // 光照强度
            shadow: true // 是否开启阴影
          },
          ambientCubemap: {
            texture: texture, // 环境光贴图
            exposure: 2 // 曝光度
          }
        }
      },
      series: [
        {
          name: '全球云手机',
          type: 'scatter3D', // 3D散点图
          coordinateSystem: 'globe',
          showEffectOn: 'render', // 特效出现时机
          blendMode: 'lighter', // 混合模式
          // symbolSize: 15,  // 图中点的大小
          symbolSize: function (val: any) {
            // 根据数量调整散点大小
            return val[2] / 600;
          },
          label: {
            show: true, // 显示标签
            formatter: function (params: {
              data: {
                value: any;
                name: any;
              };
            }) {
              // 格式化标签内容，这里假设params.data.name包含国家名称
              return params.data.name + '-' + params.data.value[2];
            },
            textStyle: {
              color: '#fff', // 文本颜色
              backgroundColor: 'rgba(0,0,0,0.5)', // 背景颜色
              borderRadius: 4, // 边框圆角
              padding: [3, 5] // 内边距
            },
            position: 'right' // 标签位置
          },
          data: countryData.map((item) => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: colorValue(item.value[2]) // 根据数量设置颜色
            }
          })) //数据格式
        }
      ]
    });
  });
</script>

<style></style>
