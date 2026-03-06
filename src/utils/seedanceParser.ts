import type { SeedanceImagePosition } from '@/api/workbench/episode/types';
import type { ReferenceImage } from '@/types/mention';
import { uploadFile } from '@/utils/uploadFile';

/**
 * 解析 SeedancePromptEditor 输出的 HTML，提取纯文本和内联提及图片的位置信息
 *
 * HTML 中内联提及节点格式：
 * <span class="inline-mention" data-type="reference|character|scene" data-id="xxx" data-label="图片1">...</span>
 *
 * @returns {plainText} 去除提及标签后的纯文本（提及位置以空格占位）
 * @returns {mentionOrder} 按出现顺序排列的提及节点 id 列表
 */
export function parsePromptHtml(html: string): {
  plainText: string;
  mentionOrder: string[];
} {
  if (!html) {
    return { plainText: '', mentionOrder: [] };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  let plainText = '';
  const mentionOrder: string[] = [];

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      plainText += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el.classList.contains('inline-mention')) {
        const id = el.getAttribute('data-id') || '';
        if (id) {
          mentionOrder.push(id);
        }
        // 提及节点在纯文本中以空格分隔（保持语义连贯）
        plainText += ' ';
      } else {
        node.childNodes.forEach(walk);
      }
    }
  };

  body.childNodes.forEach(walk);

  return {
    plainText: plainText.trim().replace(/\s+/g, ' '),
    mentionOrder
  };
}

/**
 * 确保所有参考图都已上传到 OSS，返回更新了 serverId 的图片列表
 * 对于已上传（uploadStatus === 'success' 且有 serverId）的图片直接跳过
 * 对于本地图片（有 file 对象）或 blob URL，上传后填充 serverId
 */
export async function ensureImagesUploaded(images: ReferenceImage[]): Promise<ReferenceImage[]> {
  const result: ReferenceImage[] = [];

  for (const img of images) {
    // 已上传成功，直接使用
    if (img.uploadStatus === 'success' && img.serverId) {
      result.push(img);
      continue;
    }

    // 有 File 对象，上传到 OSS
    if (img.file) {
      try {
        const fileSuffix = img.file.name.includes('.')
          ? img.file.name.substring(img.file.name.lastIndexOf('.'))
          : '.jpg';

        const uploadRes = await uploadFile({
          file: img.file,
          fileSuffix,
          originalFileName: img.file.name,
          fileType: 'image',
          resourceType: 2,
          needSync: 0
        });

        result.push({
          ...img,
          src: uploadRes.url,
          serverId: uploadRes.ossId,
          uploadStatus: 'success',
          uploadProgress: 100
        });
      } catch (err) {
        console.error('[seedanceParser] 图片上传失败:', img.id, err);
        // 上传失败的图片跳过，不阻断整体流程
        result.push({ ...img, uploadStatus: 'error' });
      }
      continue;
    }

    // src 是服务器 URL（非 blob），尝试从 src 中提取 ossId（兼容场景/角色图）
    if (img.src && !img.src.startsWith('blob:')) {
      // 没有 serverId 但有稳定的服务器 URL，先放入结果，后续由调用方过滤
      result.push(img);
      continue;
    }

    // blob URL 但没有 file，无法上传，跳过
    console.warn('[seedanceParser] 图片无法上传（blob URL 但无 File 对象）:', img.id);
    result.push({ ...img, uploadStatus: 'error' });
  }

  return result;
}

/**
 * 构建 Seedance 生成视频所需的 payload
 *
 * 核心逻辑：
 * 1. 解析 HTML，获取纯文本和提及顺序（mentionOrder）
 * 2. 上传未入 OSS 的参考图，获取 ossId
 * 3. 将 mentionOrder 中每个 id 对应的 ossId + 位置 index 组装为 imageOssIds
 *
 * @param html SeedancePromptEditor 输出的 HTML 字符串
 * @param images 参考图片列表（ReferenceImage[]）
 * @returns { prompt, imageOssIds } 可直接传给 SeedanceGenerateRequest 的字段
 */
export async function buildSeedancePayload(
  html: string,
  images: ReferenceImage[]
): Promise<{
  prompt: string;
  imageOssIds: SeedanceImagePosition[];
}> {
  const { plainText, mentionOrder } = parsePromptHtml(html);

  // 上传所有需要上传的图片
  const uploadedImages = await ensureImagesUploaded(images);

  // 构建 id -> ossId 的映射
  const idToOssId = new Map<string, number>();
  for (const img of uploadedImages) {
    if (img.serverId) {
      idToOssId.set(img.id, Number(img.serverId));
    }
  }

  // 按 mentionOrder 顺序构建 imageOssIds，过滤掉没有 ossId 的项
  const imageOssIds: SeedanceImagePosition[] = [];
  mentionOrder.forEach((id, index) => {
    const ossId = idToOssId.get(id);
    if (ossId) {
      imageOssIds.push({ ossId, position: index });
    }
  });

  return {
    prompt: plainText,
    imageOssIds
  };
}
