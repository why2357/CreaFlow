<template>
  <div class="login-container">
    <div class="login-card">
      <div class="single-acct-login-box">
        <div class="header">
          <div class="logo">CreaFlow</div>
          <div class="subtitle">欢迎回来，开启你的创作之旅</div>
        </div>
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
          <div v-if="loginType === 'sms'" class="login-form">
            <div class="input-group">
              <label class="input-label">手机号码</label>
              <div class="input-wrapper" :class="{ error: phoneError }">
                <input
                  v-model="loginForm.phoneNumber"
                  type="tel"
                  placeholder="请输入手机号"
                  maxlength="11"
                  @blur="validatePhone"
                  @input="phoneError = ''"
                />
              </div>
              <span class="error-message">{{ phoneError || '&nbsp;' }}</span>
            </div>

            <div class="input-group">
              <label class="input-label">验证码</label>
              <div class="input-wrapper" :class="{ error: codeError }">
                <input
                  v-model="loginForm.smsCode"
                  type="text"
                  placeholder="6位数字验证码"
                  maxlength="6"
                  @blur="validateCode"
                  @input="codeError = ''"
                  @keyup.enter="handleLogin"
                />
                <button
                  type="button"
                  class="send-code"
                  :class="{ disabled: !canGetVerifyCode }"
                  :disabled="!canGetVerifyCode"
                  @click="handleGetSmsCode"
                >
                  {{ canGetVerifyCode ? '发送验证码' : `${countDown}s` }}
                </button>
              </div>
              <span class="error-message">{{ codeError || '&nbsp;' }}</span>
            </div>

            <button type="button" class="submit-btn" :disabled="loading" @click="handleLogin">
              <span v-if="!loading">立即登录</span>
              <span v-else>登录中...</span>
            </button>
          </div>

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
          <div v-if="loginType === 'sms'" style="width: 86%; font-size: 13px; color: #333; margin-top: 10px">
            <el-checkbox v-model="privacyChecked" style="margin-right: 5px; transform: translate(0, 3px)" />
            <span style="color: #a1a1a6">我已阅读并同意</span>
            <span @click="openPrivacyDoc('service')" class="link-text"> 服务条款 </span>
            <span style="color: #a1a1a6">和</span>
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
  const bindPhoneFormRef = ref<FormInstance>();

  // 表单数据
  const loginForm = ref<LoginData>({
    phoneNumber: '',
    password: '',
    smsCode: ''
  });

  // 表单验证错误信息
  const phoneError = ref('');
  const codeError = ref('');

  // 绑定手机号表单数据
  const bindPhoneForm = ref({
    phoneNumber: '',
    smsCode: ''
  });

  // 表单验证函数
  const validatePhone = () => {
    if (!loginForm.value.phoneNumber) {
      phoneError.value = '请输入手机号';
      return false;
    }
    if (!/^1[3-9]\d{9}$/.test(loginForm.value.phoneNumber)) {
      phoneError.value = '请输入正确的手机号';
      return false;
    }
    phoneError.value = '';
    return true;
  };

  const validateCode = () => {
    if (!loginForm.value.smsCode) {
      codeError.value = '请输入验证码';
      return false;
    }
    if (loginForm.value.smsCode.length !== 6) {
      codeError.value = '验证码长度为6位';
      return false;
    }
    codeError.value = '';
    return true;
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

    // 清空表单验证错误
    phoneError.value = '';
    codeError.value = '';

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
      ElMessage.warning('请先同意服务条款和隐私政策');
      return;
    }

    // 表单验证
    const phoneValid = validatePhone();
    const codeValid = validateCode();

    if (!phoneValid || !codeValid) {
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
    const text = type === 'service' ? '服务条款' : '隐私政策';
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
  /* --- 表单输入框 --- */
  .input-group {
    margin-bottom: 4px;
    position: relative;
  }

  .input-label {
    font-size: 12px;
    color: #a1a1a6;
    margin-bottom: 8px;
    display: block;
  }

  .error-message {
    display: block;
    font-size: 12px;
    color: #ff4d4f;
    margin-top: 4px;
    padding-left: 4px;
    min-height: 18px;
    line-height: 18px;
    transition: opacity 0.2s ease;
    opacity: 1;

    &:empty,
    &:has(br:only-child) {
      opacity: 0;
    }
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    transition: all 0.3s ease;

    &.error {
      border-color: #ff4d4f;
      background: rgba(255, 77, 79, 0.05);
    }
  }

  /* 聚焦时的光效 */
  .input-wrapper:focus-within {
    background: rgba(255, 255, 255, 0.08);
    border-color: #b000ff;
    box-shadow: 0 0 0 3px rgba(176, 0, 255, 0.2);
    outline: none;
  }

  .input-wrapper input {
    width: 100%;
    height: 52px;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 15px;
    padding: 0 16px;
    outline: none;

    &:focus {
      outline: none;
      box-shadow: none;
    }
  }

  .input-wrapper input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  /* 内嵌发送按钮 */
  .send-code {
    color: #007aff;
    font-size: 14px;
    font-weight: 500;
    background: transparent;
    border: none;
    padding: 0 16px;
    cursor: pointer;
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    height: 24px;
    line-height: 24px;
    white-space: nowrap;
    transition: all 0.2s;
  }
  .send-code:hover {
    color: #fff;
    text-shadow: 0 0 8px #007aff;
  }
  .send-code.disabled {
    color: rgba(255, 255, 255, 0.2);
    cursor: not-allowed;
    text-shadow: none;
  }

  :deep(.el-form-item--default) {
    margin-bottom: 12px;
  }
  // :deep(.el-input__wrapper) {
  //   display: flex;
  //   align-items: center;
  //   background: rgba(255, 255, 255, 0.05) !important;
  //   border: 1px solid red !important;
  //   border-radius: 12px;
  //   transition: all 0.3s ease;
  // }
  // :deep(.is-focus) {
  //   background: rgba(255, 255, 255, 0.08);
  //   border-color: #b000ff !important;
  //   box-shadow: 0 0 0 4px rgba(176, 0, 255, 0.15);
  // }
  .submit-btn {
    width: 100%;
    height: 54px;
    background: linear-gradient(135deg, #b000ff, #7000ff);
    border: none;
    border-radius: 99px;
    color: #fff;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 10px 20px rgba(112, 0, 255, 0.3);
    margin-top: 8px;

    &:hover:not(:disabled) {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 15px 30px rgba(112, 0, 255, 0.5);
    }

    &:active:not(:disabled) {
      transform: scale(0.98);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
  .login-container {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 12%;
    position: relative;
    background: url('https://fc-1327887685.cos.ap-guangzhou.myqcloud.com/dev_forge_hivision/image/2025122516/4652d1f154864c6b.jpg');

    .login-card {
      width: 440px;
      padding: 48px;
      border-radius: 24px;
      background: rgba(18, 18, 20, 0.75);
      backdrop-filter: blur(40px);
      -webkit-backdrop-filter: blur(40px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 40px 80px rgba(0, 0, 0, 0.6);
      transform: translateY(30px);
      animation: cardEntrance 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
      .header {
        margin-bottom: 40px;
        .logo {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
          color: #ffffff;
          letter-spacing: -0.5px;
        }

        .subtitle {
          font-size: 14px;
          color: #a1a1a6;
          font-weight: 400;
        }
      }

      .single-acct-login-box {
        // width: 90%;
        // padding: 20px;

        .tab-box {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          margin-bottom: 32px;
          width: 100%;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);

          .tab-box-item {
            padding-bottom: 12px;
            color: #a1a1a6;
            font-size: 16px;
            font-weight: 500;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;

            &.active {
              color: #ffffff;
              font-size: 16px;
              font-weight: 600;

              &::after {
                content: '';
                position: absolute;
                bottom: -1px;
                left: 0;
                width: 100%;
                height: 2px;
                background: #b000ff;
                box-shadow: 0 0 8px #b000ff;
              }
            }

            &:hover {
              color: #ffffff;
            }
          }
        }

        .loginContent {
          // min-height: 420px;
          display: flex;
          flex-direction: column;

          .login-form {
            :deep(.el-form-item__label) {
              color: #a1a1a6;
              font-weight: 400;
              margin-bottom: 8px;
              font-size: 12px;
            }

            :deep(.el-input__wrapper) {
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              transition: all 0.3s ease;
              box-shadow: none !important;

              &:hover,
              &.is-focus {
                background: rgba(255, 255, 255, 0.08);
                border-color: #b000ff;
                box-shadow: none !important;
              }
            }

            :deep(.el-input__inner) {
              color: #ffffff;

              &::placeholder {
                color: rgba(255, 255, 255, 0.3);
              }
            }

            :deep(.el-button--primary) {
              background: linear-gradient(135deg, #b000ff, #7000ff);
              border: none;
              border-radius: 99px;
              font-size: 16px;
              font-weight: 600;
              box-shadow: 0 10px 20px rgba(112, 0, 255, 0.3);
              transition: all 0.3s ease;

              &:hover {
                transform: translateY(-2px) scale(1.02);
                box-shadow: 0 15px 30px rgba(112, 0, 255, 0.5);
              }

              &:active {
                transform: scale(0.98);
              }
            }

            .phone-code {
              width: 100px;
              margin-left: 5px;

              .code-get {
                display: inline-block;
                width: 100%;
                height: 40px;
                color: #007aff;
                font-size: 14px;
                font-weight: 500;
                line-height: 40px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s;
                background: transparent;
                border: none;

                &:hover {
                  color: #fff;
                  text-shadow: 0 0 8px #007aff;
                }
              }

              .code-send {
                display: inline-block;
                width: 100%;
                height: 40px;
                color: rgba(255, 255, 255, 0.2);
                font-size: 14px;
                line-height: 40px;
                text-align: center;
                background: transparent;
                border: none;
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
            color: #b000ff;
            cursor: pointer;
            text-decoration: none;
            transition: 0.2s;

            &:hover {
              text-decoration: underline;
              color: #fff;
            }
          }

          .switch-login-tip {
            font-size: 13px;

            .link-text {
              color: #a1a1a6;
              font-weight: 500;
              transition: all 0.3s;

              &:hover {
                text-decoration: underline;
                color: #fff;
              }
            }
          }

          // 自定义 Checkbox
          :deep(.el-checkbox) {
            .el-checkbox__inner {
              width: 16px;
              height: 16px;
              border: 1px solid rgba(255, 255, 255, 0.3);
              border-radius: 4px;
              background: transparent;
            }

            &.is-checked .el-checkbox__inner {
              background: #b000ff;
              border-color: #b000ff;
            }

            .el-checkbox__label {
              color: rgba(255, 255, 255, 0.5);
              font-size: 13px;
            }
          }
        }
      }
    }
  }

  @media (max-width: 1024px) {
    .login-container {
      .login-card {
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
      .login-card {
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
      .login-card {
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
      border-bottom: 1px solid #ee0202;

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
