<template>
  <div ref="mapChart" style="width: 100%; height: 100%;"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import china from '@/assets/echarts/china.json';

interface CityData {
  name: string; // 城市名称
  value: [number, number, number]; // 经度、纬度和服务器数量
}

const chinaMapJson: any = china;
const mapChart = ref<HTMLElement | null>(null);
const cityData: CityData[] = [
  { name: '北京', value: [116.4074, 39.9042, 678] },
  { name: '上海', value: [121.4824, 31.2212, 550] },
  { name: '广东', value: [113.2336, 23.1602, 723] }, // 广东的省会城市是广州
  { name: '江苏', value: [118.7833, 32.0617, 845] }, // 江苏的省会城市是南京
  { name: '山西', value: [112.5627, 37.8735, 503] }, // 山西的省会城市是太原
  { name: '贵州', value: [106.7134, 26.5783, 931] }, // 贵州的省会城市是贵阳
  { name: '山东', value: [117.0014, 36.6512, 812] }, // 山东的省会城市是济南
  { name: '河南', value: [113.6524, 34.7631, 764] }, // 河南的省会城市是郑州
  { name: '河北', value: [114.5148, 38.0428, 599] }, // 河北的省会城市是石家庄
  { name: '江西', value: [115.8921, 28.6765, 888] }, // 江西的省会城市是南昌
  { name: '湖南', value: [112.9823, 28.1941, 637] }, // 湖南的省会城市是长沙
  { name: '广西', value: [108.3278, 22.8240, 789] }, // 广西的省会城市是南宁
  { name: '四川', value: [104.0651, 30.6563, 567] }  // 四川的省会城市是成都
];

onMounted(() => {
  if (mapChart.value) {
    echarts.registerMap('china', chinaMapJson);
    const myChart = echarts.init(mapChart.value);

    // 配置散点图的颜色与数量之间的关系
    const colorValue = (val: number) => {
      // 假设数量范围在0到500之间，你可以根据需要调整范围和颜色
      if (val <= 200) return '#E0F9D7';
      if (val <= 400) return '#90EE90';
      if (val <= 500) return '#22C122';
      if (val <= 800) return '#008000';
      return '#004D00';
    };

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}: ${params.value[2]}`;
        },
      },
      geo: {
        map: 'china', // 指定地图类型
        zoom: 1.5, // 缩放级别，这里假设为2，实际值需要根据你的需求调整
        center: [108.55, 34.32], // 中心点坐标，这里是中国地理中心的经纬度
        roam: true, // 是否开启鼠标缩放和平移漫游
        label: {
          emphasis: {
            show: false, // 不显示省份标签
          },
        },
        itemStyle: {
          areaColor: '#323c48',
          borderColor: '#404a59',
        },
        emphasis: {
          label: {
            show: true,
          },
          itemStyle: {
            areaColor: '#2a333d',
          },
        },
      },
      series: [
        {
          name: '服务器数量',
          type: 'effectScatter',
          coordinateSystem: 'geo',
          rippleEffect: { // 涟漪特效相关配置
            brushType: 'fill', // 涟漪款式，推荐这个，另一个有点丑
            color: '#ADD8E6', // 涟漪颜色
            scale: 5, // 波纹缩放比例
          },
          data: cityData.map(item => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: colorValue(item.value[2]), // 根据数量设置颜色
            },
          })),
          symbolSize: function (val: any) {
            // 根据数量调整散点大小
            return val[2] / 100;
          },
          encode: {
            value: 2, // 指定value字段为数组中的第三个元素（服务器数量）
          },
          label: {
            // formatter: '{b}',
            formatter: function (params: { data: {
                value: any; name: any;
              }; }) {
              // 格式化标签内容，这里假设params.data.name包含国家名称
              return params.data.name + '-' + params.data.value[2];
            },
            position: 'right',
            show: false, // 是否显示标签
          },
          emphasis: {
            label: {
              show: true,
            },
          },
        },
      ],
    };

    myChart.setOption(option);

    // 当前显示的省份索引
    let currentIndex = 0;

    // 定时器，每两秒更新一次标签
    const timer = setInterval(function () {
      // 清除之前设置的标签显示
      cityData.forEach(function (item) {
        myChart.setOption({
          series: [{
            data: cityData.map(function (dataItem) {
              if (dataItem.name === item.name) {
                return {
                  name: dataItem.name,
                  value: dataItem.value,
                  label: {
                    show: false // 确保其他省份的标签不显示
                  }
                };
              }
              return dataItem;
            })
          }]
        });
      });

      // 设置当前省份的标签为显示
      myChart.setOption({
        series: [{
          data: cityData.map(function (item) {
            if (item.name === cityData[currentIndex].name) {
              return {
                name: item.name,
                value: item.value,
                label: {
                  show: true // 设置当前省份的标签为显示
                }
              };
            }
            return item;
          })
        }]
      });

      // 更新索引，如果到达最后一个省份则回到第一个
      currentIndex = (currentIndex + 1) % cityData.length;
    }, 2000); // 每两秒更新一次
  }
});

</script>

<style scoped>
/* 在这里添加你的样式 */
</style>
