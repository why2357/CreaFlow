<template>
  <div class="login-container white-input-inner">
    <div class="left-box">
      <div class="logo-container">
        <div class="logo-icon">
          <img class="icon" src="../assets/images/logo.png" alt="Logo" />
        </div>
        <div class="logo-text">CREAFLOW</div>
      </div>
      <div class="subtitle-container"></div>
    </div>
    <div class="right-box">
      <div class="single-acct-login-box">
        <div class="tab-box">
          <div @click="handleTabChange('sms')" :class="`tab-box-item ${loginType === 'sms' ? 'active' : ''}`">
            <span class="tab-text">验证码登录</span>
          </div>
          <!-- <div @click="handleTabChange('qrcode')" :class="`tab-box-item ${loginType === 'qrcode' ? 'active' : ''}`">
            <span class="tab-text">扫码登录</span>
          </div> -->
        </div>

        <div class="loginContent">
          <!-- 短信验证码登录 -->
          <el-form
            v-if="loginType === 'sms'"
            ref="smsFormRef"
            :model="loginForm"
            :rules="smsRules"
            class="login-form"
            label-position="top"
          >
            <el-form-item style="margin-bottom: 20px" prop="phoneNumber" label="手机">
              <el-input
                v-model="loginForm.phoneNumber"
                type="text"
                size="large"
                clearable
                auto-complete="off"
                placeholder="输入手机号"
                maxlength="11"
              >
                <template #prefix>
                  <svg-icon icon-class="icon-phone" no-theme no-prefix />
                </template>
              </el-input>
            </el-form-item>

            <el-form-item style="margin-bottom: 32px" prop="smsCode" label="验证码">
              <el-input
                v-model="loginForm.smsCode"
                size="large"
                auto-complete="off"
                placeholder="输入验证码"
                style="width: calc(100% - 95px)"
                maxlength="6"
                @keyup.enter="handleLogin"
              >
                <template #prefix>
                  <svg-icon icon-class="icon-code" no-theme no-prefix />
                </template>
              </el-input>
              <div class="phone-code">
                <span v-if="canGetVerifyCode" class="code-get" @click="handleGetSmsCode">发送验证码</span>
                <span v-else class="code-send">{{ countDown }}s</span>
              </div>
            </el-form-item>

            <el-form-item style="width: 100%">
              <el-button
                :loading="loading"
                size="large"
                type="primary"
                style="width: 100%"
                @click.prevent="handleLogin"
              >
                <span v-if="!loading">登录</span>
                <span v-else>登录中...</span>
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 扫码登录 -->
          <div v-else class="qrcode-login">
            <div class="qrcode-container">
              <div v-if="qrcodeLoading" class="qrcode-loading">
                <el-icon class="is-loading">
                  <Loading />
                </el-icon>
                <p>加载中...</p>
              </div>
              <div v-else-if="qrcodeExpired" class="qrcode-expired">
                <el-icon><RefreshRight /></el-icon>
                <p>二维码已失效</p>
                <el-button type="primary" size="small" @click="refreshQrcode">刷新二维码</el-button>
              </div>
              <div v-else class="qrcode-image">
                <canvas ref="qrcodeCanvas"></canvas>
              </div>
            </div>
            <div class="qrcode-tip">
              <svg-icon icon-class="wechat" style="width: 20px; height: 20px; margin-right: 8px" />
              <span>微信扫码登录</span>
            </div>
          </div>
          <!-- <div class="switch-login-tip">
            <span style="color: #333">您可以切换使用 </span>
            <span @click="handleTabChange(loginType === 'sms' ? 'qrcode' : 'sms')" class="link-text">
              {{ loginType === 'sms' ? '扫码登录' : '验证码登录' }}
            </span>
          </div> -->
          <div v-if="loginType === 'sms'" style="width: 86%; font-size: 13px; color: #333">
            <el-checkbox v-model="privacyChecked" style="margin-right: 5px; transform: translate(0, 3px)" />
            <span style="color: #333">我已阅读并同意网站的</span>
            <span @click="openPrivacyDoc('service')" class="link-text"> 服务协议 </span>
            <span style="color: #333">和</span>
            <span @click="openPrivacyDoc('privacy')" class="link-text"> 隐私政策 </span>
          </div>

          <!-- 切换登录方式提示 -->
        </div>
      </div>
    </div>

    <!-- 绑定手机号弹窗 -->
    <el-dialog v-model="showBindPhoneDialog" title="请绑定手机号" width="400px" :close-on-click-modal="false">
      <el-form ref="bindPhoneFormRef" :model="bindPhoneForm" :rules="bindPhoneRules" label-position="top">
        <el-form-item label="手机号" prop="phoneNumber">
          <el-input v-model="bindPhoneForm.phoneNumber" placeholder="+86 请输入手机号" size="large" maxlength="11">
            <template #prefix>
              <span style="color: #999">+86</span>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="验证码" prop="smsCode">
          <div style="display: flex; gap: 10px">
            <el-input
              v-model="bindPhoneForm.smsCode"
              placeholder="请输入验证码"
              size="large"
              maxlength="6"
              style="flex: 1"
            >
              <template #prefix>
                <span style="color: #999">#</span>
              </template>
            </el-input>
            <el-button
              size="large"
              :disabled="!canGetBindVerifyCode"
              @click="handleGetBindSmsCode"
              style="min-width: 100px"
            >
              {{ canGetBindVerifyCode ? '发送验证码' : `${bindCountDown}s` }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button size="large" style="width: 100%" type="primary" @click="handleBindPhone" :loading="bindLoading">
          绑定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { bindPhoneForQrcode, checkQrcodeStatus, generateQrcodeKey, sendPhoneCode } from '@/api/login';
  import { LoginData } from '@/api/types';
  import { useUserStore } from '@/store/modules/user';
  import { Loading, RefreshRight } from '@element-plus/icons-vue';
  import { to } from 'await-to-js';
  import { ElMessage, type FormInstance, type FormRules } from 'element-plus';
  import QRCode from 'qrcode';
  import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

  const router = useRouter();
  const userStore = useUserStore();

  // 登录类型
  type LoginType = 'sms' | 'qrcode';
  const loginType = ref<LoginType>('sms');

  // 表单引用
  const smsFormRef = ref<FormInstance>();
  const bindPhoneFormRef = ref<FormInstance>();

  // 表单数据
  const loginForm = ref<LoginData>({
    phoneNumber: '',
    password: '',
    smsCode: ''
  });

  // 绑定手机号表单数据
  const bindPhoneForm = ref({
    phoneNumber: '',
    smsCode: ''
  });

  // 短信登录表单验证规则
  const smsRules: FormRules = {
    phoneNumber: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
    ],
    smsCode: [
      { required: true, message: '请输入验证码', trigger: 'blur' },
      { len: 6, message: '验证码长度为6位', trigger: 'blur' }
    ]
  };

  // 绑定手机号验证规则
  const bindPhoneRules: FormRules = {
    phoneNumber: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
    ],
    smsCode: [
      { required: true, message: '请输入验证码', trigger: 'blur' },
      { len: 6, message: '验证码长度为6位', trigger: 'blur' }
    ]
  };

  // 加载状态
  const loading = ref(false);
  const bindLoading = ref(false);

  // 隐私协议勾选状态
  const privacyChecked = ref(true);

  // 短信验证码相关
  const canGetVerifyCode = ref(true);
  const countDown = ref(60);
  let countDownTimer: ReturnType<typeof setInterval> | null = null;

  // 绑定手机号验证码相关
  const canGetBindVerifyCode = ref(true);
  const bindCountDown = ref(60);
  let bindCountDownTimer: ReturnType<typeof setInterval> | null = null;

  // 二维码相关
  const qrcodeCanvas = ref<HTMLCanvasElement>();
  const qrcodeLoading = ref(false);
  const qrcodeExpired = ref(false);
  const qrcodeKey = ref('');
  const qrcodeUrl = ref('');
  let qrcodePollingTimer: ReturnType<typeof setInterval> | null = null;
  let qrcodeExpireTimer: ReturnType<typeof setTimeout> | null = null;

  // 绑定手机号弹窗
  const showBindPhoneDialog = ref(false);
  const tempQrcodeLoginData = ref<any>(null);

  // 切换登录方式
  const handleTabChange = (type: LoginType) => {
    loginType.value = type;

    // 清空表单验证
    smsFormRef.value?.clearValidate();

    // 如果切换到二维码登录，生成二维码
    if (type === 'qrcode') {
      nextTick(() => {
        generateQrcode();
      });
    } else {
      // 停止二维码轮询
      stopQrcodePolling();
    }
  };

  // 生成二维码
  const generateQrcode = async () => {
    qrcodeLoading.value = true;
    qrcodeExpired.value = false;

    try {
      // 调用后端接口生成二维码key
      const [err, res] = await to(generateQrcodeKey());

      if (err || !res || res.code !== 200) {
        qrcodeLoading.value = false;
        return;
      }

      // 获取二维码信息
      const qrcodeData = res.data as any;
      qrcodeKey.value = qrcodeData.qrcodeKey;
      qrcodeUrl.value = qrcodeData.qrcodeUrl;

      // 生成二维码
      if (qrcodeCanvas.value) {
        await QRCode.toCanvas(qrcodeCanvas.value, qrcodeUrl.value, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });
      }

      // 开始轮询检查扫码状态
      startQrcodePolling();

      // 设置二维码过期时间（从后端获取或默认5分钟）
      const expireTime = qrcodeData.expireTime || 5 * 60 * 1000;
      qrcodeExpireTimer = setTimeout(() => {
        qrcodeExpired.value = true;
        stopQrcodePolling();
      }, expireTime);
    } catch (error) {
      console.error('生成二维码失败:', error);
    } finally {
      qrcodeLoading.value = false;
    }
  };

  // 刷新二维码
  const refreshQrcode = () => {
    generateQrcode();
  };

  // 开始轮询检查扫码状态
  const startQrcodePolling = () => {
    stopQrcodePolling();

    qrcodePollingTimer = setInterval(async () => {
      try {
        // 调用后端接口检查扫码状态
        const [err, res] = await to(checkQrcodeStatus(qrcodeKey.value));

        if (err || !res || res.code !== 200) {
          return;
        }

        const statusData = res.data as any;

        // 状态可能有：waiting(等待扫码)、scanned(已扫码)、confirmed(已确认)、expired(已过期)
        if (statusData.status === 'expired') {
          qrcodeExpired.value = true;
          stopQrcodePolling();
          return;
        }

        // 检查是否扫码成功
        if (statusData.status === 'confirmed') {
          if (statusData.needBindPhone) {
            // 需要绑定手机号
            tempQrcodeLoginData.value = statusData;
            showBindPhoneDialog.value = true;
            stopQrcodePolling();
          } else {
            // 直接登录成功
            stopQrcodePolling();
            await handleQrcodeLoginSuccess(statusData);
          }
        }
      } catch (error) {
        console.error('检查扫码状态失败:', error);
      }
    }, 2000); // 每2秒轮询一次
  };

  // 停止二维码轮询
  const stopQrcodePolling = () => {
    if (qrcodePollingTimer) {
      clearInterval(qrcodePollingTimer);
      qrcodePollingTimer = null;
    }
    if (qrcodeExpireTimer) {
      clearTimeout(qrcodeExpireTimer);
      qrcodeExpireTimer = null;
    }
  };

  // 处理扫码登录成功
  const handleQrcodeLoginSuccess = async (_data: any) => {
    try {
      // 保存token等信息
      // await userStore.setToken(_data.token);
      // await userStore.getInfo();

      ElMessage.success('登录成功');
      await router.push({ path: '/index' });
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  // 获取短信验证码
  const handleGetSmsCode = async () => {
    // 先验证手机号
    if (!loginForm.value.phoneNumber) {
      ElMessage.warning('请先输入手机号');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(loginForm.value.phoneNumber)) {
      ElMessage.warning('请输入正确的手机号');
      return;
    }

    try {
      const [err, res] = await to(
        sendPhoneCode({
          phoneNumber: loginForm.value.phoneNumber
        })
      );

      if (err || !res) {
        return;
      }

      if (res.code === 200) {
        ElMessage.success(res.msg || '验证码已发送');
        startCountDown();
      } else {
        ElMessage.warning(res.msg || '发送验证码失败');
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
    }
  };

  // 获取绑定手机号验证码
  const handleGetBindSmsCode = async () => {
    // 先验证手机号
    if (!bindPhoneForm.value.phoneNumber) {
      ElMessage.warning('请先输入手机号');
      return;
    }

    if (!/^1[3-9]\d{9}$/.test(bindPhoneForm.value.phoneNumber)) {
      ElMessage.warning('请输入正确的手机号');
      return;
    }

    try {
      const [err, res] = await to(
        sendPhoneCode({
          phoneNumber: bindPhoneForm.value.phoneNumber
        })
      );

      if (err || !res) {
        return;
      }

      if (res.code === 200) {
        ElMessage.success(res.msg || '验证码已发送');
        startBindCountDown();
      } else {
        ElMessage.warning(res.msg || '发送验证码失败');
      }
    } catch (error) {
      console.error('发送验证码失败:', error);
    }
  };

  // 开始倒计时
  const startCountDown = () => {
    canGetVerifyCode.value = false;
    countDown.value = 60;

    // 保存手机号和时间戳到 localStorage
    localStorage.setItem(
      'smsData',
      JSON.stringify({
        phoneNumber: loginForm.value.phoneNumber,
        timestamp: Date.now()
      })
    );

    if (countDownTimer) {
      clearInterval(countDownTimer);
    }

    countDownTimer = setInterval(() => {
      countDown.value--;
      if (countDown.value <= 0) {
        stopCountDown();
      }
    }, 1000);
  };

  // 停止倒计时
  const stopCountDown = () => {
    if (countDownTimer) {
      clearInterval(countDownTimer);
      countDownTimer = null;
    }
    canGetVerifyCode.value = true;
    countDown.value = 60;
    localStorage.removeItem('smsData');
  };

  // 开始绑定手机号倒计时
  const startBindCountDown = () => {
    canGetBindVerifyCode.value = false;
    bindCountDown.value = 60;

    if (bindCountDownTimer) {
      clearInterval(bindCountDownTimer);
    }

    bindCountDownTimer = setInterval(() => {
      bindCountDown.value--;
      if (bindCountDown.value <= 0) {
        stopBindCountDown();
      }
    }, 1000);
  };

  // 停止绑定手机号倒计时
  const stopBindCountDown = () => {
    if (bindCountDownTimer) {
      clearInterval(bindCountDownTimer);
      bindCountDownTimer = null;
    }
    canGetBindVerifyCode.value = true;
    bindCountDown.value = 60;
  };

  // 登录处理
  const handleLogin = async () => {
    // 检查隐私协议
    if (!privacyChecked.value) {
      ElMessage.warning('请先同意服务协议和隐私政策');
      return;
    }

    // 获取当前表单引用
    const formRef = smsFormRef.value;

    // 表单验证
    const valid = await formRef?.validate().catch(() => false);
    if (!valid) {
      return;
    }

    loading.value = true;

    try {
      // 构建登录参数
      const loginParams: LoginData = {
        phoneNumber: loginForm.value.phoneNumber,
        smsCode: loginForm.value.smsCode,
        grantType: 'sms'
      };

      // 调用登录接口
      const [err] = await to(userStore.login(loginParams));

      if (err) {
        loading.value = false;
        return;
      }

      // 登录成功，清除短信数据
      stopCountDown();

      ElMessage.success('登录成功');
      // 跳转到工作台
      await router.push({ path: '/index' });
    } catch (error) {
      console.error('登录失败:', error);
    } finally {
      loading.value = false;
    }
  };

  // 绑定手机号
  const handleBindPhone = async () => {
    // 表单验证
    const valid = await bindPhoneFormRef.value?.validate().catch(() => false);
    if (!valid) {
      return;
    }

    bindLoading.value = true;

    try {
      // 调用绑定手机号接口
      const [err, res] = await to(
        bindPhoneForQrcode({
          qrcodeKey: qrcodeKey.value,
          phoneNumber: bindPhoneForm.value.phoneNumber,
          smsCode: bindPhoneForm.value.smsCode
        })
      );

      if (err || !res || res.code !== 200) {
        bindLoading.value = false;
        return;
      }

      ElMessage.success('绑定成功');

      // 绑定成功后，完成登录
      await handleQrcodeLoginSuccess(res.data);

      // 关闭弹窗
      showBindPhoneDialog.value = false;
      stopBindCountDown();

      // 清空绑定表单
      bindPhoneForm.value = {
        phoneNumber: '',
        smsCode: ''
      };
    } catch (error) {
      console.error('绑定手机号失败:', error);
    } finally {
      bindLoading.value = false;
    }
  };

  // 打开隐私协议
  const openPrivacyDoc = (type: 'service' | 'privacy') => {
    const text = type === 'service' ? '服务协议' : '隐私政策';
    ElMessage.info(`${text}功能暂未实现`);
  };

  // 页面加载时恢复倒计时状态
  onMounted(() => {
    const smsDataStr = localStorage.getItem('smsData');
    if (!smsDataStr) {
      return;
    }

    try {
      const smsData = JSON.parse(smsDataStr);
      const { phoneNumber, timestamp } = smsData;

      if (phoneNumber && timestamp) {
        loginForm.value.phoneNumber = phoneNumber;

        // 计算已过去的时间
        const timePassed = Math.floor((Date.now() - timestamp) / 1000);
        const remainingTime = 60 - timePassed;

        if (remainingTime > 0) {
          // 还在倒计时中，恢复倒计时
          canGetVerifyCode.value = false;
          countDown.value = remainingTime;

          countDownTimer = setInterval(() => {
            countDown.value--;
            if (countDown.value <= 0) {
              stopCountDown();
            }
          }, 1000);
        } else {
          // 倒计时已结束，清除数据
          stopCountDown();
        }
      }
    } catch (error) {
      console.error('恢复倒计时状态失败:', error);
      stopCountDown();
    }
  });

  // 组件卸载时清理定时器
  onBeforeUnmount(() => {
    if (countDownTimer) {
      clearInterval(countDownTimer);
    }
    if (bindCountDownTimer) {
      clearInterval(bindCountDownTimer);
    }
    stopQrcodePolling();
  });
</script>

<style scoped lang="scss">
  :deep(.el-form-item--default) {
    margin-bottom: 12px;
  }
  .login-container {
    display: flex;
    width: 100%;
    height: 100vh;

    .left-box {
      display: flex;
      flex: 1;
      background: url('../assets/images/home.png');
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center;
      position: relative;

      .logo-container {
        display: flex;
        align-items: center;
        margin-bottom: 40px;
        position: absolute;
        left: 10px;
        margin-top: 25px;

        .logo-icon {
          display: flex;
          align-items: center;
          justify-content: center;

          .icon {
            width: 120px;
            height: 94px;
          }
        }

        .logo-text {
          color: #333;
          font-size: 30px;
          font-weight: 600;
          line-height: 30px; /* 100% */
        }
      }

      .subtitle-container {
        color: white;
        font-size: 24px;
        font-weight: 300;
      }
    }

    .right-box {
      display: flex;
      justify-content: center;
      align-items: center;
      /* 在1280px屏幕上为400px，使用calc实现比例自适应 */
      width: 37.5%;
      // min-width: 400px;
      // max-width: 600px;
      background: white;
      box-shadow: -2px 0 8px rgb(0 0 0 / 10%);

      .single-acct-login-box {
        width: 90%;
        padding: 20px;

        .tab-box {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 50px;
          width: 100%;

          .tab-box-item {
            padding: 12px 24px;
            color: #4e5969;
            font-size: 20px;
            font-weight: 500;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;

            &.active {
              color: #1d2129;
              font-size: 24px;
              font-weight: 600;

              &::after {
                content: '';
                position: absolute;
                bottom: -2px;
                left: 50%;
                transform: translateX(-50%);
                width: 75px;
                height: 4px;
                background: #0360fc;
                border-radius: 2px;
              }
            }

            &:hover {
              color: #667eea;
            }
          }
        }

        .loginContent {
          min-height: 420px;
          display: flex;
          flex-direction: column;

          .login-form {
            :deep(.el-form-item__label) {
              color: #333;
              font-weight: 500;
              margin-bottom: 8px;
            }

            :deep(.el-input__wrapper) {
              border-radius: 8px;
            }

            :deep(.el-button--primary) {
              background: #667eea;
              border-color: #667eea;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 500;

              &:hover {
                background: #5568d3;
                border-color: #5568d3;
              }
            }

            .phone-code {
              width: 90px;
              margin-left: 5px;

              .code-get {
                display: inline-block;
                width: 100%;
                height: 40px;
                color: #5252ff;
                font-size: 14px;
                line-height: 40px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s;
                border-radius: 4px;
                border: 1px solid #eee;
                background: #fff;
              }

              .code-send {
                display: inline-block;
                width: 100%;
                height: 40px;
                color: #999;
                font-size: 13px;
                line-height: 40px;
                text-align: center;
                background: #f5f5f5;
                border-radius: 8px;
              }
            }
          }

          .qrcode-login {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 40px 20px;

            .qrcode-container {
              width: 220px;
              height: 220px;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 1px solid #e5e5e5;
              border-radius: 12px;
              background: #fafafa;
              margin-bottom: 20px;

              .qrcode-loading,
              .qrcode-expired {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                color: #999;

                .el-icon {
                  font-size: 32px;
                }

                p {
                  margin: 0;
                  font-size: 14px;
                }
              }

              .qrcode-image {
                padding: 10px;

                canvas {
                  display: block;
                }
              }
            }

            .qrcode-tip {
              display: flex;
              align-items: center;
              color: #666;
              font-size: 14px;
            }
          }

          .link-text {
            color: #5252ff;
            cursor: pointer;
          }

          .switch-login-tip {
            font-size: 13px;

            .link-text {
              color: #5252ff;
              font-weight: 500;
              transition: all 0.3s;
            }
          }
        }
      }
    }
  }

  @media (max-width: 1024px) {
    .login-container {
      .right-box {
        .single-acct-login-box {
          .tab-box {
            margin-bottom: 40px;

            .tab-box-item {
              font-size: 18px;

              &.active {
                font-size: 22px;
              }
            }
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    .login-container {
      .left-box {
        display: none;
      }

      .right-box {
        width: 100%;
        max-width: 100%;

        .single-acct-login-box {
          width: 85%;
          top: -50px;

          .tab-box {
            margin-bottom: 30px;
          }

          .loginContent {
            min-height: 380px;

            .qrcode-login {
              padding: 30px 20px;

              .qrcode-container {
                width: 200px;
                height: 200px;
              }
            }
          }
        }
      }
    }
  }

  @media (max-width: 480px) {
    .login-container {
      .right-box {
        .single-acct-login-box {
          width: 90%;
          padding: 15px;
          top: -30px;

          .tab-box {
            margin-bottom: 25px;

            .tab-box-item {
              font-size: 16px;

              &.active {
                font-size: 20px;

                &::after {
                  width: 60px;
                  height: 3px;
                }
              }
            }
          }

          .loginContent {
            min-height: 350px;

            .login-form {
              :deep(.el-form-item__label) {
                font-size: 14px;
              }

              :deep(.el-button--large) {
                font-size: 15px;
              }

              .phone-code {
                width: 85px;

                .code-get,
                .code-send {
                  height: 38px;
                  line-height: 38px;
                  font-size: 13px;
                }
              }
            }

            .qrcode-login {
              padding: 20px 15px;

              .qrcode-container {
                width: 180px;
                height: 180px;
                margin-bottom: 15px;
              }

              .qrcode-tip {
                font-size: 13px;
              }
            }
          }
        }
      }
    }
  }

  // 绑定手机号弹窗样式
  :deep(.el-dialog) {
    border-radius: 12px;

    .el-dialog__header {
      padding: 20px 20px 10px;
      border-bottom: 1px solid #f0f0f0;

      .el-dialog__title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
    }

    .el-dialog__body {
      padding: 30px 20px;
    }

    .el-dialog__footer {
      padding: 0 20px 20px;
    }

    .el-input__wrapper {
      border-radius: 8px;
    }

    .el-button--large {
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
    }

    .el-button--primary {
      background: #667eea;
      border-color: #667eea;

      &:hover {
        background: #5568d3;
        border-color: #5568d3;
      }
    }
  }
</style>
