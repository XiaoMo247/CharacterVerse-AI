// Home页面相关的API服务
import { get } from '../../../utils/request'

export const allList = async(params) => {
    const res = await get('/role/list', params)
    return res
}

export const searchList = async(params) => {
  const res = await get('/role/search', params)
  return res
}