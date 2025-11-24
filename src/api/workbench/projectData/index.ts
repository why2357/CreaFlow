import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ProjectDataQuery, ProjectDataVO, ProjectDataProgressQuery, ProjectDataProgressVO } from './types';

/**
 * 查询项目数据分页列表
 * @param query 查询参数
 */
export const listProjectData = (query: ProjectDataQuery): AxiosPromise<ProjectDataVO[]> => {
  return request({
    url: '/hivision/story/project-data/list',
    method: 'post',
    data: query
  });
};

/**
 * 查询项目数据进度
 * @param query 查询参数
 */
export const getProjectDataProgress = (query: ProjectDataProgressQuery): AxiosPromise<ProjectDataProgressVO> => {
  return request({
    url: '/hivision/story/project-data/progress',
    method: 'post',
    data: query
  });
};
