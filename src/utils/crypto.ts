import CryptoJS from 'crypto-js';

/**
 * 随机生成32位的字符串
 * @returns {string}
 */
const generateRandomString = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

/**
 * 随机生成aes 密钥
 * @returns {string}
 */
export const generateAesKey = () => {
  return CryptoJS.enc.Utf8.parse(generateRandomString());
};

/**
 * 加密base64
 * @returns {string}
 */
export const encryptBase64 = (str: CryptoJS.lib.WordArray) => {
  return CryptoJS.enc.Base64.stringify(str);
};

/**
 * 解密base64
 */
export const decryptBase64 = (str: string) => {
  return CryptoJS.enc.Base64.parse(str);
};

/**
 * 使用密钥对数据进行加密
 * @param message
 * @param aesKey
 * @returns {string}
 */
export const encryptWithAes = (message: string, aesKey: CryptoJS.lib.WordArray) => {
  const encrypted = CryptoJS.AES.encrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
};

/**
 * 使用密钥对数据进行解密
 * @param message
 * @param aesKey
 * @returns {string}
 */
export const decryptWithAes = (message: string, aesKey: CryptoJS.lib.WordArray) => {
  const decrypted = CryptoJS.AES.decrypt(message, aesKey, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return decrypted.toString(CryptoJS.enc.Utf8);
};

/**
 * 使用Md5对文件加密
 * @param file
 * @returns {string}
 */
export const md5File = async (file: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    const bufferSize = 1024 * 1024; // 1MB chunks
    let chunkSize = 0;
    const md5 = CryptoJS.algo.MD5.create();

    fileReader.onload = function (e: any) {
      const buffer = e.target.result;
      const wordArray = CryptoJS.lib.WordArray.create(buffer);
      md5.update(wordArray);

      chunkSize++;

      if (chunkSize * bufferSize >= file.size) {
        // 所有块都处理完毕，获取最终的哈希值
        const hash = md5.finalize();
        const result = hash.toString(CryptoJS.enc.Hex);
        resolve(result);
      } else {
        // 继续读取下一块
        loadNextChunk();
      }
    };

    fileReader.onerror = function (e) {
      reject(e);
      console.error('File could not be read!');
    };

    function loadNextChunk() {
      const start = chunkSize * bufferSize;
      const end = Math.min(file.size, start + bufferSize);
      const slice = file.slice(start, end);
      fileReader.readAsArrayBuffer(slice);
    }

    loadNextChunk(); // 开始读取第一块
  });
};
