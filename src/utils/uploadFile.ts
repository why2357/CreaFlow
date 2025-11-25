import { to } from 'await-to-js';

import { getPreSignUrl, reportInfo, uploadByUrl } from '@/api/tool/upload/index';
import { ReportRes, UploadReq } from '@/api/tool/upload/type';
import { md5File } from '@/utils/crypto';
import { getAudioDuration, getVideoDuration, getVideoInfo } from './index';

/** 音频文件类型 */
const AUDIO_TYPES = ['.mp3'];

/** 传输类型：文件已存在，无需上传 */
const TRANSFER_TYPE_FILE_EXISTS = 4;

/**
 * 上传文件到 OSS
 *
 * @description
 * 文件上传流程：
 * 1. 计算文件 MD5（如果需要）
 * 2. 获取预签名 URL
 * 3. 如果文件已存在（transferType=4），直接返回结果
 * 4. 上传文件到 OSS
 * 5. 上报上传结果
 *
 * @param req - 上传请求参数
 * @param req.file - 要上传的文件
 * @param req.fileSuffix - 文件后缀（如 .jpg, .mp4）
 * @param req.originalFileName - 原始文件名
 * @param req.fileType - 文件类型（image/video/audio）
 * @param req.requiredTime - 是否需要获取时长
 * @param req.requiredPoster - 是否需要获取封面图（视频）
 * @param req.duration - 指定的时长（毫秒）
 * @param req.resourceType - 资源类型（1-公共资源 2-用户资源）
 * @param req.needSync - 是否需要同步（1-是 0-否）
 * @param req.fileMd5 - 文件 MD5（可选，不传则自动计算）
 * @param req.id - 自定义标识（用于区分上传任务）
 *
 * @param onProgressCb - 上传进度回调函数
 *
 * @returns Promise<ReportRes> 上传结果，包含 ossId、url 等信息
 *
 * @example
 * ```ts

 */
export async function uploadFile(
  req: UploadReq,
  onProgressCb?: (percent: number, loadedSize: number, id?: number | string) => void
): Promise<ReportRes> {
  const { file, requiredTime, requiredPoster, duration, resourceType, id, needSync, fileMd5, ...other } = req;

  try {
    // 步骤 1: 计算文件 MD5（如果未提供）
    const fileMd5Val = fileMd5 || (await md5File(file));

    // 步骤 2: 获取预签名 URL
    const preSignRes = await getPreSignUrl({ ...other, fileMd5: fileMd5Val });

    if (preSignRes.code !== 200) {
      return Promise.reject({
        ...preSignRes,
        id,
        message: '获取预签名URL失败'
      });
    }

    // 步骤 3: 获取媒体信息（时长、封面图）
    const mediaInfo = await getMediaInfo(req, requiredPoster, requiredTime, duration, file);

    // 步骤 4: 检查文件是否已存在（秒传）
    if (preSignRes.data.transferType === TRANSFER_TYPE_FILE_EXISTS) {
      return Promise.resolve(buildFileExistsResult(preSignRes.data, req, fileMd5Val, id, mediaInfo, file));
    }

    // 步骤 5: 上传文件到 OSS
    await uploadByUrl(
      {
        uploadUrl: preSignRes.data.presignedUrl,
        file,
        id
      },
      (percent, loadedSize, uploadId) => {
        onProgressCb?.(percent, loadedSize, uploadId);
      }
    );

    // 步骤 6: 上报上传结果
    const reportRes = await reportInfo({
      originalFileName: preSignRes.data.originalFileName,
      fileName: preSignRes.data.fileName,
      service: preSignRes.data.service,
      fileSuffix: req.fileSuffix,
      size: file?.size ? Math.round(file.size / 1024) : 0,
      time: mediaInfo.time,
      fileMd5: fileMd5Val,
      resourceType,
      needSync
    });

    // 步骤 7: 返回最终结果
    return Promise.resolve({
      ...(reportRes.data || {}),
      originalFileName: preSignRes.data.originalFileName,
      id,
      fileMd5: fileMd5Val,
      poster: mediaInfo.poster,
      suffix: req.fileSuffix
    });
  } catch (err) {
    console.error('文件上传失败:', err);
    return Promise.reject({
      id,
      message: err instanceof Error ? err.message : '文件上传失败',
      error: err
    });
  }
}

/**
 * 获取媒体信息（时长、封面图）
 */
async function getMediaInfo(
  req: UploadReq,
  requiredPoster: boolean | undefined,
  requiredTime: boolean | undefined,
  duration: number | undefined,
  file: any
): Promise<{ time?: number; poster?: string }> {
  let time: number | undefined;
  let poster: string | undefined;

  // 获取封面图（视频）
  if (requiredPoster) {
    const [videoInfoErr, videoInfoRes] = await to(getVideoInfo(req));

    if (videoInfoErr) {
      throw new Error(`获取视频信息失败: ${videoInfoErr}`);
    }

    if (videoInfoRes) {
      poster = videoInfoRes.frameUrl;
      time = videoInfoRes.duration;
    }
  }
  // 获取时长（音频/视频）
  else if (requiredTime) {
    if (duration) {
      time = duration;
    } else if (AUDIO_TYPES.includes(req.fileSuffix)) {
      time = await getAudioDuration(file);
    } else {
      time = await getVideoDuration(file);
    }
  }

  return { time, poster };
}

/**
 * 构建文件已存在（秒传）的返回结果
 */
function buildFileExistsResult(
  preSignData: any,
  req: UploadReq,
  fileMd5: string,
  id: string | number | undefined,
  mediaInfo: { time?: number; poster?: string },
  file: any
): ReportRes {
  return {
    // 使用原始文件名，因为相同文件不同名字时，接口可能返回之前的名字
    originalFileName: req.originalFileName,
    id,
    fileMd5,
    suffix: req.fileSuffix,
    // 秒传时接口返回的字段可能是 ossUrl 或 url
    url: preSignData.ossUrl || preSignData.url || '',
    fileName: preSignData.fileName,
    ossId: preSignData.ossId || '',
    size: file?.size ? Math.round(file.size / 1024) : 0,
    poster: mediaInfo.poster,
    time: mediaInfo.time
  };
}
