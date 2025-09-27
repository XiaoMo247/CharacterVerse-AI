import {request, get} from "../../../utils/request";

const stored = localStorage?.getItem('auth')
const { user_id } = JSON.parse(stored)

export const addRole = async (param) => {
  const res = await request.post('/role/add', param)
  return res.data
} 

export const getRole = async (params) => {
  const res = await get(`/role/user/${user_id}`, params)
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