import { UploadReq } from '@/api/tool/upload/type';
import i18n from '@/lang/index';
import { parseTime } from '@/utils/sskj';
import { uploadFile } from '@/utils/uploadFile';
import { to } from 'await-to-js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore

export function timeFix() {
  const time = new Date();
  const hour = time.getHours();
  return hour < 9
    ? i18n.global.t('homePage.morning')
    : hour <= 12
    ? i18n.global.t('homePage.forenoon')
    : hour <= 14
    ? i18n.global.t('homePage.noon')
    : hour < 18
    ? i18n.global.t('homePage.afternoon')
    : i18n.global.t('homePage.evening');
}
/**
 * 表格时间格式化
 */
export const formatDate = (cellValue: string) => {
  if (cellValue == null || cellValue == '') return '';
  const date = new Date(cellValue);
  const year = date.getFullYear();
  const month = date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
  const day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  const hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  const minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  const seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
  return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
};

/**
 * @param {number} time
 * @param {string} option
 * @returns {string}
 */
export const formatTime = (time: string, option: string) => {
  let t: number;
  if (('' + time).length === 10) {
    t = parseInt(time) * 1000;
  } else {
    t = +time;
  }
  const d: any = new Date(t);
  const now = Date.now();

  const diff = (now - d) / 1000;

  if (diff < 30) {
    return '刚刚';
  } else if (diff < 3600) {
    // less 1 hour
    return Math.ceil(diff / 60) + '分钟前';
  } else if (diff < 3600 * 24) {
    return Math.ceil(diff / 3600) + '小时前';
  } else if (diff < 3600 * 24 * 2) {
    return '1天前';
  }
  if (option) {
    return parseTime(t, option);
  } else {
    return d.getMonth() + 1 + '月' + d.getDate() + '日' + d.getHours() + '时' + d.getMinutes() + '分';
  }
};

/**
 * @param {string} url
 * @returns {Object}
 */
export const getQueryObject = (url: string) => {
  url = url == null ? window.location.href : url;
  const search = url.substring(url.lastIndexOf('?') + 1);
  const obj: { [key: string]: string } = {};
  const reg = /([^?&=]+)=([^?&=]*)/g;
  search.replace(reg, (rs, $1, $2) => {
    const name = decodeURIComponent($1);
    let val = decodeURIComponent($2);
    val = String(val);
    obj[name] = val;
    return rs;
  });
  return obj;
};

/**
 * @param {string} input value
 * @returns {number} output value
 */
export const byteLength = (str: string) => {
  // returns the byte length of an utf8 string
  let s = str.length;
  for (let i = str.length - 1; i >= 0; i--) {
    const code = str.charCodeAt(i);
    if (code > 0x7f && code <= 0x7ff) s++;
    else if (code > 0x7ff && code <= 0xffff) s += 2;
    if (code >= 0xdc00 && code <= 0xdfff) i--;
  }
  return s;
};

/**
 * @param {Array} actual
 * @returns {Array}
 */
export const cleanArray = (actual: Array<any>) => {
  const newArray = [];
  for (let i = 0; i < actual.length; i++) {
    if (actual[i]) {
      newArray.push(actual[i]);
    }
  }
  return newArray;
};

/**
 * @param {Object} json
 * @returns {Array}
 */
export const param = (json: any) => {
  if (!json) return '';
  return cleanArray(
    Object.keys(json).map((key) => {
      if (json[key] === undefined) return '';
      return encodeURIComponent(key) + '=' + encodeURIComponent(json[key]);
    })
  ).join('&');
};

/**
 * @param {string} url
 * @returns {Object}
 */
export const param2Obj = (url: string) => {
  const search = decodeURIComponent(url.split('?')[1]).replace(/\+/g, ' ');
  if (!search) {
    return {};
  }
  const obj: any = {};
  const searchArr = search.split('&');
  searchArr.forEach((v) => {
    const index = v.indexOf('=');
    if (index !== -1) {
      const name = v.substring(0, index);
      const val = v.substring(index + 1, v.length);
      obj[name] = val;
    }
  });
  return obj;
};

/**
 * @param {string} val
 * @returns {string}
 */
export const html2Text = (val: string) => {
  const div = document.createElement('div');
  div.innerHTML = val;
  return div.textContent || div.innerText;
};

/**
 * Merges two objects, giving the last one precedence
 * @param {Object} target
 * @param {(Object|Array)} source
 * @returns {Object}
 */
export const objectMerge = (target: any, source: any | any[]) => {
  if (typeof target !== 'object') {
    target = {};
  }
  if (Array.isArray(source)) {
    return source.slice();
  }
  Object.keys(source).forEach((property) => {
    const sourceProperty = source[property];
    if (typeof sourceProperty === 'object') {
      target[property] = objectMerge(target[property], sourceProperty);
    } else {
      target[property] = sourceProperty;
    }
  });
  return target;
};

/**
 * @param {HTMLElement} element
 * @param {string} className
 */
export const toggleClass = (element: HTMLElement, className: string) => {
  if (!element || !className) {
    return;
  }
  let classString = element.className;
  const nameIndex = classString.indexOf(className);
  if (nameIndex === -1) {
    classString += '' + className;
  } else {
    classString = classString.substring(0, nameIndex) + classString.substring(nameIndex + className.length);
  }
  element.className = classString;
};

/**
 * @param {string} type
 * @returns {Date}
 */
export const getTime = (type: string) => {
  if (type === 'start') {
    return new Date().getTime() - 3600 * 1000 * 24 * 90;
  } else {
    return new Date(new Date().toDateString());
  }
};

/**
 * @param {Function} func
 * @param {number} wait
 * @param {boolean} immediate
 * @return {*}
 */
export const debounce = (func: any, wait: number, immediate: boolean) => {
  let timeout: any, args: any, context: any, timestamp: any, result: any;

  const later = function () {
    // 据上一次触发时间间隔
    const last = +new Date() - timestamp;

    // 上次被包装函数被调用时间间隔 last 小于设定时间间隔 wait
    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      // 如果设定为immediate===true，因为开始边界已经调用过了此处无需调用
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  return (...args: any) => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    context = this;
    timestamp = +new Date();
    const callNow = immediate && !timeout;
    // 如果延时不存在，重新设定延时
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }
    return result;
  };
};

/**
 * This is just a simple version of deep copy
 * Has a lot of edge cases bug
 * If you want to use a perfect deep copy, use lodash's _.cloneDeep
 * @param {Object} source
 * @returns {Object}
 */
export const deepClone = (source: any) => {
  if (!source && typeof source !== 'object') {
    throw new Error('error arguments', 'deepClone' as any);
  }
  const targetObj: any = source.constructor === Array ? [] : {};
  Object.keys(source).forEach((keys) => {
    if (source[keys] && typeof source[keys] === 'object') {
      targetObj[keys] = deepClone(source[keys]);
    } else {
      targetObj[keys] = source[keys];
    }
  });
  return targetObj;
};

/**
 * @param {Array} arr
 * @returns {Array}
 */
export const uniqueArr = (arr: any) => {
  return Array.from(new Set(arr));
};

/**
 * @returns {string}
 */
export const createUniqueString = (): string => {
  const timestamp = +new Date() + '';
  const num = (1 + Math.random()) * 65536;
  const randomNum = parseInt(num + '');
  return (+(randomNum + timestamp)).toString(32);
};

/**
 * Check if an element has a class
 * @param ele
 * @param {string} cls
 * @returns {boolean}
 */
export const hasClass = (ele: HTMLElement, cls: string): boolean => {
  return !!ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
};

/**
 * Add class to element
 * @param ele
 * @param {string} cls
 */
export const addClass = (ele: HTMLElement, cls: string) => {
  if (!hasClass(ele, cls)) ele.className += ' ' + cls;
};

/**
 * Remove class from element
 * @param ele
 * @param {string} cls
 */
export const removeClass = (ele: HTMLElement, cls: string) => {
  if (hasClass(ele, cls)) {
    const reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
    ele.className = ele.className.replace(reg, ' ');
  }
};

/**
 * @param {string} path
 * @returns {Boolean}
 */
export const isExternal = (path: string) => {
  return /^(https?:|http?:|mailto:|tel:)/.test(path);
};

// 文件流转blob对象下载
/**
 * @data 文件流
 * @type 文件类型
 * @fileName 文件名字
 */
export function downloadFile(data: any, type: string, fileName: string) {
  const blob = new Blob([data], { type: type });
  // 获取heads中的filename文件名
  const downloadElement = document.createElement('a');
  // 创建下载的链接
  const href = window.URL.createObjectURL(blob);
  downloadElement.href = href;
  // 下载后文件名
  downloadElement.download = fileName;
  document.body.appendChild(downloadElement);
  // 点击下载
  downloadElement.click();
  // 下载完成移除元素
  document.body.removeChild(downloadElement);
  // 释放掉blob对象
  window.URL.revokeObjectURL(href);
}
// 视频图片下载
export function downloadVideo(url: string, name?: string) {
  const xhr = new XMLHttpRequest();
  // 使用open()方法初始化一个请求，第一个参数为请求的类型，第二个参数为请求的地址，第三个参数为是否异步
  xhr.open('GET', url, true);
  // 设置响应的数据类型
  xhr.responseType = 'blob';
  // 当请求加载完成时，触发onload事件
  xhr.onload = () => {
    // 如果请求的状态码为200，表示请求成功
    if (xhr.status === 200) {
      // 创建一个blob对象，第一个参数为响应的数据，第二个参数为blob对象的类型
      const blob = new Blob([xhr.response], { type: xhr.getResponseHeader('content-type') as string });
      // 创建一个a标签
      const link = document.createElement('a');
      // 为a标签设置href属性，值为blob对象的URL
      link.href = URL.createObjectURL(blob);
      // 为a标签设置下载文件名
      link.download = name as string;
      // 点击a标签，开始下载文件
      link.click();
    }
  };
  // 发送请求
  xhr.send();
}

export function dispatchEventStroage() {
  const signSetItem = localStorage.setItem;
  localStorage.setItem = function (key, val) {
    const setEvent: any = new Event('setItemEvent');
    setEvent.key = key;
    setEvent.newValue = val;
    window.dispatchEvent(setEvent);
    // eslint-disable-next-line prefer-rest-params
    signSetItem.apply(this, arguments as any);
  };
}

/**
 * 该函数接受字节作为输入，转换成对应的KB、MB或GB字符串，精确到两位小数。
 * @param {number} bytes - 字节数 decimals保留几位小数
 * @return {string} 转换后的字符串，带单位
 *
 */
export function formatBytes(bytes: string | number, decimals = 2) {
  // 'Bytes',
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  // 0 Bytes
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const i = Math.floor(Math.log(bytes as number) / Math.log(k));
  return parseFloat(((bytes as number) / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 获取一个视频的时长
 * @param {File} file - 字节数 decimals保留几位小数
 * @return {Promise<number>} 视频时长，单位毫秒
 */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    if (file) {
      const videoElement = document.createElement('video');
      videoElement.preload = 'metadata';
      videoElement.onloadedmetadata = function () {
        const duration = videoElement.duration * 1000;
        resolve(Math.round(duration));
        URL.revokeObjectURL(videoElement.src); // 清理资源
      };
      videoElement.onerror = function () {
        reject(null);
        console.error('无法加载视频文件');
      };
      // 使用对象URL将文件赋给video元素
      videoElement.src = URL.createObjectURL(file);
    } else {
      reject(null);
    }
  });
}

/**
 * 获取一个音频的时长
 * @param {File} file - 字节数 decimals保留几位小数
 * @return {Promise<number>} 视频时长，单位毫秒
 */
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    if (file) {
      const audioElement = document.createElement('audio');
      audioElement.preload = 'metadata';
      audioElement.addEventListener('loadedmetadata', () => {
        const duration = Math.ceil(audioElement.duration) * 1000; // 获取音频时长,获取到的时长单位是秒，需要转成毫秒
        resolve(duration);
        URL.revokeObjectURL(audioElement.src); // 清理资源
      });
      audioElement.addEventListener('error', () => {
        reject(null);
        console.error('无法加载音频文件');
      });
      // 使用对象URL将文件赋给video元素
      audioElement.src = URL.createObjectURL(file);
    } else {
      reject(null);
    }
  });
}

/**
 * 获取视频的首帧图片
 * @param {File} file
 * @return {Promise<string>} 视频首帧图片，上传后的url
 */
export function getVideoFirstFrame(req: UploadReq): Promise<string> {
  const { file, ...others } = req;
  return new Promise((resolve, reject) => {
    if (file) {
      const videoElement = document.createElement('video');
      videoElement.crossOrigin = 'anonymous';
      videoElement.autoplay = true;
      videoElement.muted = true;
      videoElement.preload = 'metadata';

      // loadeddata 事件可能在视频的实际内容完全准备好之前触发，因此使用 canplay 事件可能更可靠。
      videoElement.addEventListener('canplay', async () => {
        // if (videoElement.readyState >= 2) {
        const [_, res] = await to(captureFrame(videoElement, others));
        if (res) {
          resolve(res);
        }
        URL.revokeObjectURL(videoElement.src); // 清理资源
        // }
      });
      videoElement.addEventListener('error', () => {
        reject(null);
        console.error('无法加载视频文件');
      });
      // 使用对象URL将文件赋给video元素
      videoElement.src = URL.createObjectURL(file);
    } else {
      reject(null);
    }
  });
}

const captureFrame = (video: HTMLVideoElement, req: Partial<UploadReq>): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) {
        reject();
        return;
      }
      const originalFileName = req.originalFileName || 'cover';
      const imgFile = new File([blob], originalFileName, { type: blob.type });
      uploadFile({
        ...req,
        fileSuffix: `.png`,
        file: imgFile,
        originalFileName,
        fileType: 'material/image'
      })
        .then((res) => {
          resolve(res.url);
        })
        .catch(() => {
          reject();
        });
    }, 'image/png');
  });
};

interface VideoInfo {
  duration: number;
  frameUrl: string;
}
/**
 * 获取一个视频的时长和第一帧图片
 * @return {Promise<VideoInfo>} 视频时长，单位毫秒
 */
export function getVideoInfo(req: UploadReq): Promise<VideoInfo> {
  const { file, ...others } = req;
  return new Promise((resolve, reject) => {
    if (file) {
      const videoElement = document.createElement('video');
      videoElement.crossOrigin = 'anonymous';
      videoElement.autoplay = true;
      videoElement.muted = true;
      videoElement.preload = 'metadata';
      videoElement.addEventListener('loadeddata', async () => {
        const duration = videoElement.duration * 1000;
        if (videoElement.readyState >= 2) {
          const [_, res] = await to(captureFrame(videoElement, others));
          if (res) {
            resolve({
              duration: Math.round(duration),
              frameUrl: res
            });
          } else {
            resolve({
              duration: Math.round(duration),
              frameUrl: ''
            });
          }
          URL.revokeObjectURL(videoElement.src); // 清理资源
        }
      });
      videoElement.onerror = function (err) {
        reject(null);
        console.error('无法加载视频文件', err);
      };
      // 使用对象URL将文件赋给video元素
      videoElement.src = URL.createObjectURL(file);
    } else {
      reject(null);
    }
  });
}

export function dataURLtoBlob(dataurl: any) {
  const arr = dataurl.split(','),
    mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}
