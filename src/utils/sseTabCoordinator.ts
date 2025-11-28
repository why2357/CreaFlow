/**
 * SSE 标签页协调器
 * 使用 BroadcastChannel 实现多标签页之间的 SSE 连接共享
 *
 * 工作原理：
 * 1. 多个标签页通过心跳机制选举出一个"主标签页"
 * 2. 只有主标签页维护真实的 SSE 连接
 * 3. 主标签页收到消息后，通过 BroadcastChannel 广播给其他标签页
 * 4. 主标签页关闭时，自动选举新的主标签页
 */

interface TabMessage {
  type: 'heartbeat' | 'sse-data' | 'claim-master' | 'master-alive' | 'master-closing';
  tabId: string;
  timestamp: number;
  data?: any;
}

export class SSETabCoordinator {
  private channel: BroadcastChannel | null = null;
  private tabId: string;
  private isMaster = false;
  private lastMasterHeartbeat = 0;
  private heartbeatInterval: number | null = null;
  private masterCheckInterval: number | null = null;
  private onBecameMaster?: () => void;
  private onBecameSlave?: () => void;
  private onSSEMessage?: (data: any) => void;

  // 配置参数
  private readonly HEARTBEAT_INTERVAL = 2000; // 心跳间隔 2秒
  private readonly MASTER_TIMEOUT = 5000; // 主标签页超时时间 5秒
  private readonly CLAIM_DELAY = 500; // 声明主标签页前的延迟，避免冲突

  constructor() {
    // 生成唯一的标签页 ID
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // console.log(`[SSE协调器] 标签页已创建，ID: ${this.tabId}`);
  }

  /**
   * 初始化协调器
   */
  init(options: { onBecameMaster?: () => void; onBecameSlave?: () => void; onSSEMessage?: (data: any) => void }): void {
    this.onBecameMaster = options.onBecameMaster;
    this.onBecameSlave = options.onBecameSlave;
    this.onSSEMessage = options.onSSEMessage;

    // 创建 BroadcastChannel
    if (typeof BroadcastChannel === 'undefined') {
      console.warn('[SSE协调器] 浏览器不支持 BroadcastChannel，降级为单标签页模式');
      this.becomeMaster();
      return;
    }

    this.channel = new BroadcastChannel('sse-coordination');

    // 监听其他标签页的消息
    this.channel.onmessage = (event: MessageEvent<TabMessage>) => {
      this.handleMessage(event.data);
    };

    // 监听页面关闭事件
    window.addEventListener('beforeunload', () => {
      this.destroy();
    });

    // 开始选举流程
    this.startElection();
  }

  /**
   * 开始选举流程
   */
  private startElection(): void {
    // console.log(`[SSE协调器] 开始选举流程`);

    // 询问是否有主标签页存在
    this.sendMessage({
      type: 'claim-master',
      tabId: this.tabId,
      timestamp: Date.now()
    });

    // 等待一段时间，如果没有收到主标签页的响应，则自己成为主标签页
    setTimeout(() => {
      if (!this.isMaster && Date.now() - this.lastMasterHeartbeat > this.MASTER_TIMEOUT) {
        // console.log(`[SSE协调器] 未检测到主标签页，本标签页成为主标签页`);
        this.becomeMaster();
      } else if (!this.isMaster) {
        // console.log(`[SSE协调器] 检测到主标签页存在，本标签页作为从标签页`);
        this.becomeSlave();
      }
    }, this.CLAIM_DELAY);

    // 定期检查主标签页是否存活
    this.masterCheckInterval = window.setInterval(() => {
      if (!this.isMaster && Date.now() - this.lastMasterHeartbeat > this.MASTER_TIMEOUT) {
        // console.log(`[SSE协调器] 主标签页超时，开始新一轮选举`);
        this.startElection();
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * 成为主标签页
   */
  private becomeMaster(): void {
    if (this.isMaster) return;

    // console.log(`[SSE协调器] 🎯 本标签页成为主标签页`);
    this.isMaster = true;
    this.lastMasterHeartbeat = Date.now();

    // 开始发送心跳
    this.startHeartbeat();

    // 通知外部
    this.onBecameMaster?.();
  }

  /**
   * 成为从标签页
   */
  private becomeSlave(): void {
    if (!this.isMaster) return;

    // console.log(`[SSE协调器] 📡 本标签页成为从标签页`);
    this.isMaster = false;

    // 停止心跳
    this.stopHeartbeat();

    // 通知外部
    this.onBecameSlave?.();
  }

  /**
   * 开始发送心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = window.setInterval(() => {
      if (this.isMaster) {
        this.sendMessage({
          type: 'heartbeat',
          tabId: this.tabId,
          timestamp: Date.now()
        });
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * 停止发送心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 处理其他标签页的消息
   */
  private handleMessage(message: TabMessage): void {
    // 忽略自己发送的消息
    if (message.tabId === this.tabId) return;

    switch (message.type) {
      case 'heartbeat':
      case 'master-alive':
        // 收到主标签页的心跳
        this.lastMasterHeartbeat = message.timestamp;

        // 如果自己也是主标签页，说明出现冲突，比较 tabId，让 ID 较小的保持主地位
        if (this.isMaster && message.tabId < this.tabId) {
          // console.log(`[SSE协调器] 检测到主标签页冲突，让位给 ${message.tabId}`);
          this.becomeSlave();
        }
        break;

      case 'claim-master':
        // 有标签页想成为主标签页，如果自己是主标签页，则响应
        if (this.isMaster) {
          this.sendMessage({
            type: 'master-alive',
            tabId: this.tabId,
            timestamp: Date.now()
          });
        }
        break;

      case 'sse-data':
        // 收到 SSE 数据，如果自己不是主标签页，则触发回调
        if (!this.isMaster && message.data) {
          // console.log(`[SSE协调器] 📨 收到来自主标签页的 SSE 消息`);
          this.onSSEMessage?.(message.data);
        }
        break;

      case 'master-closing':
        // 主标签页即将关闭
        if (!this.isMaster) {
          // console.log(`[SSE协调器] 主标签页即将关闭，准备选举新主标签页`);
          // 稍等一下再选举，避免冲突
          setTimeout(() => {
            if (!this.isMaster && Date.now() - this.lastMasterHeartbeat > 1000) {
              this.startElection();
            }
          }, this.CLAIM_DELAY);
        }
        break;
    }
  }

  /**
   * 发送消息到其他标签页
   */
  private sendMessage(message: TabMessage): void {
    if (this.channel) {
      this.channel.postMessage(message);
    }
  }

  /**
   * 广播 SSE 数据（仅主标签页调用）
   */
  broadcastSSEData(data: any): void {
    if (!this.isMaster) {
      console.warn('[SSE协调器] 只有主标签页才能广播 SSE 数据');
      return;
    }

    this.sendMessage({
      type: 'sse-data',
      tabId: this.tabId,
      timestamp: Date.now(),
      data
    });
  }

  /**
   * 检查是否为主标签页
   */
  getIsMaster(): boolean {
    return this.isMaster;
  }

  /**
   * 获取标签页 ID
   */
  getTabId(): string {
    return this.tabId;
  }

  /**
   * 销毁协调器
   */
  destroy(): void {
    // console.log(`[SSE协调器] 标签页销毁，ID: ${this.tabId}`);

    // 如果是主标签页，通知其他标签页
    if (this.isMaster) {
      this.sendMessage({
        type: 'master-closing',
        tabId: this.tabId,
        timestamp: Date.now()
      });
    }

    // 清理定时器
    this.stopHeartbeat();
    if (this.masterCheckInterval) {
      clearInterval(this.masterCheckInterval);
      this.masterCheckInterval = null;
    }

    // 关闭 BroadcastChannel
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}
