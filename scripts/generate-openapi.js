/**
 * API 解析器 - 从前端代码提取接口信息
 */
const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '../src/api');

function extractApiInfo(content) {
  const apis = [];

  // 按函数分割
  const functions = content.split(/export\s+function\s+/).filter((s) => s.trim());

  functions.forEach((func) => {
    const nameMatch = func.match(/^(\w+)/);
    if (!nameMatch) return;
    const funcName = nameMatch[1];

    // 查找 url
    const urlMatch = func.match(/url:\s*['"`]([^'"`]+)['"`]/);
    // 查找 method
    const methodMatch = func.match(/method:\s*['"`]([\w]+)['"`]/);

    if (urlMatch && methodMatch) {
      // 提取函数上方的注释
      const funcStart = content.indexOf(`export function ${funcName}`);
      const beforeFunc = content.substring(Math.max(0, funcStart - 500), funcStart);
      const commentMatch = beforeFunc.match(/\/\*\*([\s\S]*?)\*\/\s*$/);

      let desc = funcName;
      if (commentMatch) {
        const comment = commentMatch[1].replace(/^\s*\*\s?/gm, '').trim();
        desc = comment.split('\n')[0] || funcName;
      }

      // 提取返回类型
      const returnTypeMatch = func.match(/AxiosPromise<(\w+)>/);
      const responseType = returnTypeMatch ? returnTypeMatch[1] : 'any';

      // 提取请求参数类型
      const paramsMatch = func.match(/function\s+\w+\s*\(([^)]*)\)/);
      let requestType = 'any';
      if (paramsMatch) {
        const typeMatch = paramsMatch[1].match(/(\w+)\s*:\s*([A-Z]\w+)/);
        if (typeMatch) {
          requestType = typeMatch[2];
        }
      }

      // 检查是否有 data 参数
      const dataMatch = func.match(/data\s*(?::\s*(\w+))?,/);
      if (dataMatch && dataMatch[1] && dataMatch[1] !== 'data') {
        requestType = dataMatch[1];
      }

      apis.push({
        name: funcName,
        desc: desc || funcName,
        method: methodMatch[1].toUpperCase(),
        url: urlMatch[1],
        request: requestType,
        response: responseType,
      });
    }
  });

  return apis;
}

function scanApiDirectory(dir, basePath = '') {
  const results = {};

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    const relativePath = path.join(basePath, item.name);

    if (item.isDirectory()) {
      const subResults = scanApiDirectory(fullPath, relativePath);
      Object.assign(results, subResults);
    } else if (item.name === 'index.ts' || (item.name.endsWith('.ts') && item.name !== 'types.ts' && basePath === '')) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const apis = extractApiInfo(content);

      if (apis.length > 0) {
        const moduleName = basePath.replace(/\\/g, '/') || 'auth';
        results[moduleName] = apis;
      }
    }
  }

  return results;
}

function generateOpenApi(apiData) {
  const openapi = {
    openapi: '3.0.0',
    info: {
      title: 'Forge HiVision API',
      description: '创流视频制作工作台 API 文档',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://172.28.44.150:16020',
        description: '开发环境',
      },
    ],
    paths: {},
    tags: [],
  };

  // 添加标签
  const tagNames = Object.keys(apiData);
  openapi.tags = tagNames.map((name) => ({
    name: name,
    description: name + ' 模块',
  }));

  // 生成路径
  for (const [module, apis] of Object.entries(apiData)) {
    for (const api of apis) {
      if (!openapi.paths[api.url]) {
        openapi.paths[api.url] = {};
      }

      const tag = module;
      const operation = {
        tags: [tag],
        summary: api.desc,
        operationId: api.name,
        description: `函数名: ${api.name}\n请求类型: ${api.request}\n返回类型: ${api.response}`,
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', example: 200 },
                    msg: { type: 'string' },
                    data: {
                      type: 'object',
                      description: api.response,
                    },
                  },
                },
              },
            },
          },
        },
      };

      // 添加请求参数
      if (api.method === 'GET') {
        operation.parameters = [
          {
            name: 'params',
            in: 'query',
            description: `查询参数: ${api.request}`,
            required: false,
            schema: { type: 'object' },
          },
        ];
      } else {
        operation.requestBody = {
          description: `请求体类型: ${api.request}`,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                description: api.request,
              },
            },
          },
        };
      }

      openapi.paths[api.url][api.method.toLowerCase()] = operation;
    }
  }

  return openapi;
}

// 主执行
console.log('正在扫描 API 目录...\n');
const apiData = scanApiDirectory(API_DIR);

console.log('找到以下模块:');
Object.keys(apiData).forEach((module) => {
  console.log(`  - ${module}: ${apiData[module].length} 个接口`);
});

const totalApis = Object.values(apiData).reduce((sum, apis) => sum + apis.length, 0);
console.log(`\n总计: ${totalApis} 个接口\n`);

console.log('正在生成 OpenAPI 规范...\n');
const openApiSpec = generateOpenApi(apiData);

const outputPath = path.join(__dirname, '../openapi.json');
fs.writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2), 'utf-8');

console.log(`✅ OpenAPI 规范已生成: ${outputPath}`);
console.log(`📊 总计 ${Object.keys(apiData).length} 个模块, ${Object.keys(openApiSpec.paths).length} 个接口路径`);
