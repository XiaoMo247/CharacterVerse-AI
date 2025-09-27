import { request,get } from "../../../utils/request";


export const processAndSendAudio = async (formData) => {
    const res = await fetch('https://ai.mcell.top/api/upload_voice', {
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