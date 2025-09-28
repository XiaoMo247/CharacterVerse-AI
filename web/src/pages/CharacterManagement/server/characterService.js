import {request, get} from "../../../utils/request";

const stored = localStorage?.getItem('auth')
const { username } = JSON.parse(stored)

export const addRole = async (param) => {
  const res = await request.post('/role/add', param)
  return res.data
} 

export const getRole = async (params) => {
  const newparams = {
    ...params,
    username
  }
  const res = await get(`/role/user`, newparams)
  return res
}

export const detailRole = async (roleid) => {
  const res = await request.delete(`/role/${roleid}`)
  return res
}

export const updateRole = async (roleId, param) => {
  const res = await request.put(`/role/${roleId}`, param)
  return res
}

export const getvoiceTypes = async () => {
  const res =await get('/voiceTypes')
  return res.data
}