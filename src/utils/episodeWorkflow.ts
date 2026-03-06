/**
 * 剧集工作流模式管理工具（前端模拟）
 * 用于存储和获取每个剧集的工作流模式
 */

type WorkflowMode = 'classic' | 'seedance' | null;

const STORAGE_KEY = 'episode_workflow_mode';

/**
 * 获取所有剧集的工作流模式
 */
function getAllEpisodeWorkflowModes(): Record<string, WorkflowMode> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('获取剧集工作流模式失败:', error);
    return {};
  }
}

/**
 * 保存所有剧集的工作流模式
 */
function saveAllEpisodeWorkflowModes(data: Record<string, WorkflowMode>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('保存剧集工作流模式失败:', error);
  }
}

/**
 * 获取指定剧集的工作流模式
 * @param episodeId 剧集ID
 * @returns 工作流模式：classic-经典工作流 / seedance-Seedance 2.0 / null-未设置
 */
export function getEpisodeWorkflowMode(episodeId: string | number): WorkflowMode {
  const allModes = getAllEpisodeWorkflowModes();
  const key = String(episodeId);
  return allModes[key] || null;
}

/**
 * 设置指定剧集的工作流模式
 * @param episodeId 剧集ID
 * @param mode 工作流模式：classic-经典工作流 / seedance-Seedance 2.0
 */
export function setEpisodeWorkflowMode(episodeId: string | number, mode: 'classic' | 'seedance') {
  const allModes = getAllEpisodeWorkflowModes();
  const key = String(episodeId);
  allModes[key] = mode;
  saveAllEpisodeWorkflowModes(allModes);
}

/**
 * 删除指定剧集的工作流模式
 * @param episodeId 剧集ID
 */
export function removeEpisodeWorkflowMode(episodeId: string | number) {
  const allModes = getAllEpisodeWorkflowModes();
  const key = String(episodeId);
  delete allModes[key];
  saveAllEpisodeWorkflowModes(allModes);
}

/**
 * 清空所有剧集的工作流模式
 */
export function clearAllEpisodeWorkflowModes() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 *
 * 判断指定剧集是否为 Seedance 2.0 模式
 * @param episodeId 剧集ID
 * @returns true-Seedance 2.0模式 / false-经典工作流或未设置
 */
export function isSeedanceMode(episodeId: string | number | null | undefined): boolean {
  if (!episodeId) return false;
  return getEpisodeWorkflowMode(episodeId) === 'seedance';
}

/**
 * 判断指定剧集是否为经典工作流模式
 * @param episodeId 剧集ID
 * @returns true-经典工作流 / false-Seedance 2.0或未设置
 */
export function isClassicMode(episodeId: string | number | null | undefined): boolean {
  if (!episodeId) return false;
  return getEpisodeWorkflowMode(episodeId) === 'classic';
}
