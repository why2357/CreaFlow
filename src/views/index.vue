<template>
  <div class="app-container home">
    <el-row :gutter="20">
      <el-col :sm="24" :lg="12" style="padding-left: 20px">
        <h2>全球云手机</h2>
        <div class="wrapper-tdg">
<!--          <TDGlobe />-->
        </div>
        <p><b>Web版本:</b> <span>v{{ version }}</span></p>
        <p>
          <el-tag type="danger">v{{ version }}</el-tag>
        </p>
        <p>
          <el-button type="primary" icon="Cloudy" plain @click="goTarget('https://gitee.com/dromara/Sskj-Cloud-Pro')">访问码云</el-button>
          <el-button type="primary" icon="Cloudy" plain @click="goTarget('https://github.com/dromara/Sskj-Cloud-Pro')">访问GitHub</el-button>
          <el-button type="primary" icon="Cloudy" plain @click="goTarget('https://plus-doc.dromara.org/#/sskj-vue-plus/changlog')"
          >更新日志</el-button
          >
        </p>
      </el-col>

      <el-col :sm="24" :lg="12" style="padding-left: 20px">
        <h2>国内云手机</h2>
        <div class="wrapper-tdg">
<!--          <ChinaMap />-->
        </div>
        <p><b>Server版本:</b> <span>v{{ serverVersion }}</span></p>
        <p>
          <el-tag type="danger">v{{ serverVersion }}</el-tag>
        </p>
        <p>
          <el-button type="primary" icon="Cloudy" plain @click="goTarget('https://gitee.com/dromara/Sskj-Cloud-Plus')">访问码云</el-button>
          <el-button type="primary" icon="Cloudy" plain @click="goTarget('https://github.com/dromara/Sskj-Cloud-Plus')">访问GitHub</el-button>
          <el-button type="primary" icon="Cloudy" plain @click="goTarget('https://plus-doc.dromara.org/#/sskj-cloud-plus/changlog')"
          >更新日志</el-button
          >
        </p>
      </el-col>
    </el-row>
    <el-divider />
  </div>
</template>

<script setup name="Index" lang="ts">
import { initWebSocket } from '@/utils/websocket';
import pkg from '@/../package.json';
import { getVersion} from "@/api/login";

const version = ref(pkg.version);
const serverVersion = ref('');

onMounted(() => {
  let protocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://'
  initWebSocket(protocol + window.location.host + import.meta.env.VITE_APP_BASE_API + "/resource/websocket");
  getServerVersion();
});

const goTarget = (url:string) => {
  window.open(url, '__blank')
}

const getServerVersion = () => {
  getVersion()
    .then((res) => {
      serverVersion.value = res.msg;
    });
};
</script>

<style scoped lang="scss">
.home {
  blockquote {
    padding: 10px 20px;
    margin: 0 0 20px;
    font-size: 17.5px;
    border-left: 5px solid #eee;
  }
  hr {
    margin-top: 20px;
    margin-bottom: 20px;
    border: 0;
    border-top: 1px solid #eee;
  }
  .col-item {
    margin-bottom: 20px;
  }

  ul {
    padding: 0;
    margin: 0;
  }

  font-family: "open sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  font-size: 13px;
  color: #676a6c;
  overflow-x: hidden;

  ul {
    list-style-type: none;
  }

  h4 {
    margin-top: 0px;
  }

  h2 {
    margin-top: 10px;
    font-size: 26px;
    font-weight: 100;
  }

  p {
    margin-top: 10px;

    b {
      font-weight: 700;
    }
  }

  .update-log {
    ol {
      display: block;
      list-style-type: decimal;
      margin-block-start: 1em;
      margin-block-end: 1em;
      margin-inline-start: 0;
      margin-inline-end: 0;
      padding-inline-start: 40px;
    }
  }
}

.wrapper-tdg {
  /* 限制宽度和高度，这里你可以根据需要设置具体的值 */
  width: 500px;
  height: 350px;
  /* 使用flexbox布局来居中内部组件 */
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  /* 可选：如果你需要外部容器有边距或背景色等样式，也可以在这里添加 */
  margin: 1px;
  background-color: #f5f5f5;
}
</style>
