/**
 * 项目相关工具函数
 */

import type { AiModelInfoDto } from '@/api/workbench/project/types';

/**
 * 模型选项接口
 */
export interface ModelOption {
  label: string;
  value: string;
}

/**
 * 尺寸字符串转换为后端数字格式
 * @param size 尺寸字符串 如: '16:9', '4:3', '1:1', '3:4', '9:16'
 * @returns 尺寸数字 1-16:9;2-4:3;3-1:1;4-3:4;5-9:16
 */
export function sizeToRatio(size: string): number {
  const sizeMap: Record<string, number> = {
    '16:9': 1,
    '4:3': 2,
    '1:1': 3,
    '3:4': 4,
    '9:16': 5
  };
  return sizeMap[size] || 1;
}

/**
 * 后端数字格式转换为尺寸字符串
 * @param ratio 尺寸数字 1-16:9;2-4:3;3-1:1;4-3:4;5-9:16
 * @returns 尺寸字符串 如: '16:9'
 */
export function ratioToSize(ratio: number): string {
  const ratioMap: Record<number, string> = {
    1: '16:9',
    2: '4:3',
    3: '1:1',
    4: '3:4',
    5: '9:16'
  };
  return ratioMap[ratio] || '16:9';
}

/**
 * 后端数字格式转换为实际宽高比数值
 * @param ratio 尺寸数字 1-16:9;2-4:3;3-1:1;4-3:4;5-9:16
 * @returns 实际宽高比数值 如: 1.7778 (16/9)
 */
export function ratioToValue(ratio: number): number {
  const ratioValueMap: Record<number, number> = {
    1: 16 / 9, // 16:9
    2: 4 / 3, // 4:3
    3: 1, // 1:1
    4: 3 / 4, // 3:4
    5: 9 / 16 // 9:16
  };
  return ratioValueMap[ratio] || 16 / 9;
}

/**
 * 尺寸字符串转换为实际宽高比数值
 * @param size 尺寸字符串 如: '16:9', '4:3', '1:1', '3:4', '9:16'
 * @returns 实际宽高比数值 如: 1.7778 (16/9)
 */
export function sizeToValue(size: string): number {
  const ratioMap: Record<string, number> = {
    '16:9': 16 / 9,
    '4:3': 4 / 3,
    '1:1': 1,
    '3:4': 3 / 4,
    '9:16': 9 / 16
  };
  return ratioMap[size] || 16 / 9;
}

// ==================== AI模型相关工具函数 ====================

/**
 * 将AI模型信息列表转换为选项列表
 * @param modelList AI模型信息列表
 * @returns 模型选项列表
 */
export function convertModelsToOptions(modelList: AiModelInfoDto[]): ModelOption[] {
  if (!modelList || modelList.length === 0) {
    return [];
  }

  return modelList.map((model) => ({
    label: model.modelName || model.modelCode || '',
    value: model.modelCode || ''
  }));
}

/**
 * 获取默认模型
 * @param modelList AI模型信息列表
 * @returns 默认模型码，如果列表为空则返回空字符串
 */
export function getDefaultModel(modelList: AiModelInfoDto[]): string {
  if (!modelList || modelList.length === 0) {
    return '';
  }

  return modelList[0]?.modelCode || '';
}

/**
 * 根据模型码获取模型名称
 * @param modelList AI模型信息列表
 * @param modelCode 模型码
 * @returns 模型名称，如果找不到则返回模型码
 */
export function getModelName(modelList: AiModelInfoDto[], modelCode?: string): string {
  if (!modelCode || !modelList || modelList.length === 0) {
    return modelCode || '';
  }

  const model = modelList.find((m) => m.modelCode === modelCode);
  return model?.modelName || modelCode;
}

/**
 * 检查模型码是否有效
 * @param modelList AI模型信息列表
 * @param modelCode 模型码
 * @returns 是否有效
 */
export function isValidModel(modelList: AiModelInfoDto[], modelCode?: string): boolean {
  if (!modelCode || !modelList || modelList.length === 0) {
    return false;
  }

  return modelList.some((m) => m.modelCode === modelCode);
}
