import { request,get } from "../../../utils/request";

const UPLOADURL = import.meta.env.VITE_UPLOAD_URL

export const processAndSendAudio = async (formData) => {
    const res = await fetch(UPLOADURL, {
    method: 'POST',
    body: formData
    // 不设置任何headers，让浏览器自动处理
  })
   const data = await res.json();
   return data
}

export const getHistory = async () => {
  const res = await get('/history/all')
  return res.data
}

export const getroleHistory = async (roleId) =>{
  const res = await get(`/history/role/${roleId}`)
  return res
}