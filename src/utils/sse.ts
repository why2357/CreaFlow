import { getToken } from '@/utils/auth';
import request from '@/utils/request';
import { ElNotification } from 'element-plus';
import { SSETabCoordinator } from './sseTabCoordinator';

interface SSEOptions {
  onMessage?: (data: any) => void;
  onError?: (error: any) => void;
  onOpen?: () => void;
  autoReconnect?: {
    retries: number;
    delay: number;
    onFailed?: () => void;
    enabled?: boolean; // 是否启用自动重连
  };
}

class SSEManager {
  private abortController: AbortController | null = null;
  private url = '';
  private options: SSEOptions = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;
  private isManualClose = false;
  private reconnectTimer: number | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private isConnected = false;
  private connectionStartTime = 0; // 连接开始时间
  private coordinator: SSETabCoordinator | null = null; // 标签页协调器

  /**
   * 初始化并连接 SSE
   */
  async connect(baseUrl: string, options: SSEOptions = {}): Promise<void> {
    // 如果已经有连接正在进行，先关闭
    if (this.isConnected || this.abortController) {
      console.warn('SSE 连接已存在，先关闭旧连接');
      this.cleanup();
    }

    this.options = options;
    this.maxReconnectAttempts = options.autoReconnect?.retries ?? 10;
    this.reconnectDelay = options.autoReconnect?.delay ?? 3000;
    this.isManualClose = false;
    this.reconnectAttempts = 0; // 重置重连次数

    const token = getToken();
    if (!token) {
      console.warn('未找到 token，无法建立 SSE 连接');
      return;
    }

    this.url = baseUrl;

    // 初始化标签页协调器
    if (!this.coordinator) {
      this.coordinator = new SSETabCoordinator();
      this.coordinator.init({
        onBecameMaster: () => {
          console.log('[SSE Manager] 🎯 成为主标签页，建立 SSE 连接');
          this.createConnection();
        },
        onBecameSlave: () => {
          console.log('[SSE Manager] 📡 成为从标签页，关闭本地 SSE 连接');
          this.cleanup();
        },
        onSSEMessage: (data) => {
          console.log('[SSE Manager] 📨 从主标签页接收到 SSE 消息');
          // 从标签页收到消息，也要触发处理逻辑
          this.handleMessage(data);
        }
      });
    }
  }

  /**
   * 创建 SSE 连接（使用 fetch + ReadableStream）
   */
  private async createConnection(): Promise<void> {
    try {
      // 只有主标签页才能创建连接
      if (this.coordinator && !this.coordinator.getIsMaster()) {
        console.log('[SSE Manager] 非主标签页，不建立 SSE 连接');
        return;
      }

      // 防止重复连接
      if (this.isConnected) {
        console.warn('SSE 已连接，跳过重复连接');
        return;
      }

      const token = getToken();
      if (!token) {
        console.error('Token 不存在，无法建立连接');
        return;
      }

      // 创建新的 AbortController
      this.abortController = new AbortController();

      // 记录连接开始时间
      this.connectionStartTime = Date.now();

      console.log('正在建立 SSE 连接...', this.url);

      // 使用 fetch 发起请求，可以自定义请求头
      const response = await fetch(this.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          Authorization: `Bearer ${token}`
        },
        signal: this.abortController.signal
      });

      if (!response.ok) {
        throw new Error(`SSE 连接失败: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body 为空');
      }

      // 连接成功
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('SSE 连接已建立');
      this.options.onOpen?.();

      // 读取流数据
      this.reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let reading = true;
      let currentEvent = ''; // 当前事件类型
      let currentData = ''; // 当前数据内容

      while (reading) {
        const { done, value } = await this.reader.read();

        if (done) {
          console.log('SSE 流结束，连接已断开');
          reading = false;
          this.isConnected = false;
          break;
        }

        // 解码数据
        buffer += decoder.decode(value, { stream: true });
        console.log('[SSE] 收到原始数据:', buffer);

        // 按行分割（SSE 使用 \n\n 分隔消息）
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留不完整的行

        for (const line of lines) {
          console.log('[SSE] 处理行原始内容:', line);
          console.log('[SSE] 处理行JSON格式:', JSON.stringify(line));
          console.log('[SSE] 行是否为空:', line.trim() === '');
          console.log('[SSE] 行是否以data:开头:', line.trim().startsWith('data:'));

          // 空行表示消息结束
          if (line.trim() === '') {
            console.log('[SSE] 遇到空行，当前累积数据:', currentData);
            if (currentData) {
              console.log('[SSE] 解析数据:', currentData);
              try {
                // 尝试反转义 JSON 字符串
                let jsonStr = currentData;
                // 如果数据被过度转义，尝试解析
                if (jsonStr.includes('\\"')) {
                  console.log('[SSE] 检测到转义的引号，尝试反转义');
                  jsonStr = jsonStr.replace(/\\"/g, '"');
                }
                const data = JSON.parse(jsonStr);
                console.log('[SSE] JSON 解析成功:', data);
                this.handleMessage(data);
              } catch (error) {
                console.error('[SSE] 解析 JSON 失败:', error, currentData);
                // 如果不是 JSON，尝试直接处理
                this.handleMessage({ message: currentData });
              }
              currentData = '';
              currentEvent = '';
            }
            continue;
          }

          // 处理事件类型
          if (line.startsWith('event:')) {
            currentEvent = line.slice(6).trim();
            console.log('[SSE] 事件类型:', currentEvent);
            continue;
          }

          // 处理数据（支持有空格和没空格两种格式）
          if (line.trim().startsWith('data:')) {
            const dataStr = line.includes('data: ')
              ? line.slice(line.indexOf('data: ') + 6)
              : line.slice(line.indexOf('data:') + 5).trim();
            currentData += dataStr;
            console.log('[SSE] 数据片段:', dataStr);
            console.log('[SSE] 当前累积数据:', currentData);
            continue;
          }

          // 处理 id
          if (line.startsWith('id: ')) {
            console.log('[SSE] 消息 ID:', line.slice(4).trim());
            continue;
          }

          // 处理 retry
          if (line.startsWith('retry: ')) {
            console.log('[SSE] 重试时间:', line.slice(7).trim());
            continue;
          }

          // 处理注释
          if (line.startsWith(':')) {
            console.log('[SSE] 注释:', line.slice(1).trim());
            continue;
          }
        }
      }

      // 流正常结束，如果不是手动关闭则尝试重连
      if (!this.isManualClose) {
        // 检查连接持续时间
        const connectionDuration = Date.now() - this.connectionStartTime;
        console.log(`[SSE] 连接持续时间: ${connectionDuration}ms`);

        if (connectionDuration < 1000) {
          // 如果连接在1秒内就断开，可能是服务端问题
          console.warn('SSE 连接过早断开（<1秒），可能是服务端在发送确认消息后立即关闭了连接');
        }

        // 检查是否启用自动重连
        const autoReconnectEnabled = this.options.autoReconnect?.enabled !== false;
        if (autoReconnectEnabled) {
          this.handleReconnect();
        } else {
          console.log('[SSE] 自动重连已禁用');
        }
      }
    } catch (error: any) {
      this.isConnected = false;

      // 如果是手动取消，不输出错误
      if (error.name === 'AbortError') {
        console.log('SSE 连接已手动取消');
        return;
      }

      console.error('SSE 连接错误:', error);
      this.options.onError?.(error);

      // 如果不是手动关闭，尝试重连
      if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.handleReconnect();
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('SSE 重连次数已达上限');
        this.options.autoReconnect?.onFailed?.();
      }
    }
  }

  /**
   * 处理收到的消息
   */
  private handleMessage(data: any): void {
    if (!data) return;

    console.log('收到 SSE 消息:', data);
    console.log('[SSE] messageType:', data.messageType);
    console.log('[SSE] 是否有 message 字段:', !!data.message);
    console.log('[SSE] message 内容:', data.message);

    // 如果是主标签页，广播消息到其他标签页
    if (this.coordinator && this.coordinator.getIsMaster()) {
      console.log('[SSE Manager] 主标签页广播消息到其他标签页');
      this.coordinator.broadcastSSEData(data);
    }

    // 调用自定义消息处理器
    this.options.onMessage?.(data);

    // 根据 messageType 分发不同的事件
    if (data.messageType !== undefined && data.message) {
      console.log('[SSE] 进入事件分发逻辑，messageType:', data.messageType);
      const message = data.message;

      // messageType=1: 分镜头脚本生成完成
      if (data.messageType === 1) {
        console.log('[SSE] 分镜头脚本生成完成:', message);
        window.dispatchEvent(
          new CustomEvent('sse-script-update', {
            detail: {
              projectId: message.projectId || data.projectId,
              episodeId: message.episodeId || data.episodeId,
              taskStatus: message.taskStatus,
              message: message
            }
          })
        );
      }

      // messageType=2: 分镜头图片生成更新
      if (data.messageType === 2) {
        console.log('[SSE] 分镜头图片生成更新:', message);
        const eventDetail = {
          projectId: message.projectId || data.projectId,
          episodeId: message.episodeId || data.episodeId,
          taskStatus: message.taskStatus,
          batchStatus: message.batchStatus,
          episodeSceneItemInfoList: message.episodeSceneItemInfoList,
          message: message
        };
        console.log('[SSE] 分发 sse-image-update 事件，detail:', eventDetail);
        window.dispatchEvent(
          new CustomEvent('sse-image-update', {
            detail: eventDetail
          })
        );
        console.log('[SSE] sse-image-update 事件已分发');
      }

      // messageType=3: 视频生成更新
      if (data.messageType === 3) {
        console.log('[SSE] 视频生成更新:', message);
        window.dispatchEvent(
          new CustomEvent('sse-video-update', {
            detail: {
              projectId: message.projectId || data.projectId,
              episodeId: message.episodeId || data.episodeId,
              taskStatus: message.taskStatus,
              batchStatus: message.batchStatus,
              episodeSceneItemInfoList: message.episodeSceneItemInfoList,
              message: message
            }
          })
        );
      }
    }

    // // 显示通知（如果需要）
    // if (data.message && typeof data.message === 'string') {
    //   ElNotification({
    //     title: data.title || '消息',
    //     message: data.message,
    //     type: data.type || 'success',
    //     duration: 3000
    //   });
    // }
  }

  /**
   * 处理重连逻辑
   */
  private handleReconnect(): void {
    if (this.isManualClose) return;

    this.reconnectAttempts++;
    console.log(`准备进行第 ${this.reconnectAttempts} 次重连...`);

    // 清除旧连接
    this.cleanup();

    // 延迟重连
    this.reconnectTimer = window.setTimeout(() => {
      console.log(`正在进行第 ${this.reconnectAttempts} 次重连...`);
      this.createConnection();
    }, this.reconnectDelay);
  }

  /**
   * 清理连接资源
   */
  private cleanup(): void {
    // 取消读取器
    if (this.reader) {
      this.reader.cancel().catch(() => {
        // 忽略取消错误
      });
      this.reader = null;
    }

    // 取消请求
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.isConnected = false;
  }

  /**
   * 手动关闭连接并通知后端
   */
  async close(): Promise<void> {
    this.isManualClose = true;

    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // 清理连接
    this.cleanup();
    console.log('SSE 连接已关闭');

    // 销毁协调器
    if (this.coordinator) {
      this.coordinator.destroy();
      this.coordinator = null;
    }

    // 通知后端关闭连接（只有主标签页需要通知）
    try {
      await request({
        url: '/hivision/system/sse/close',
        method: 'get'
      });
      console.log('已通知后端关闭 SSE 连接');
    } catch (error) {
      console.error('通知后端关闭 SSE 连接失败:', error);
    }

    // 重置状态
    this.reconnectAttempts = 0;
  }

  /**
   * 检查连接状态
   */
  isConnectionOpen(): boolean {
    return this.isConnected;
  }
}

// 导出单例
export const sseManager = new SSEManager();

/**
 * 初始化项目 SSE 连接
 * @param onMessage 消息处理回调
 */
export const initProjectSSE = (onMessage?: (data: any) => void): void => {
  const baseUrl = import.meta.env.VITE_APP_BASE_API + '/hivision/system/sse/connect';

  sseManager.connect(baseUrl, {
    onMessage: (data) => {
      console.log('项目 SSE 消息:', data);
      onMessage?.(data);
    },
    onError: (error) => {
      console.error('项目 SSE 连接错误:', error);
    },
    onOpen: () => {
      console.log('项目 SSE 连接已建立');
    },
    autoReconnect: {
      retries: 10,
      delay: 3000,
      onFailed: () => {
        ElNotification({
          title: '连接失败',
          message: 'SSE 连接失败，请刷新页面重试',
          type: 'error',
          duration: 5000
        });
      }
    }
  });
};

/**
 * 关闭项目 SSE 连接
 */
export const closeProjectSSE = async (): Promise<void> => {
  await sseManager.close();
};
