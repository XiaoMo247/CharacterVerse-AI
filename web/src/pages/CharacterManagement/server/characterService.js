import { http } from "../../../utils";

export const addRole = async (param) => {
  const res = await http.post('/user/addRole', param)
  return res.data
} 