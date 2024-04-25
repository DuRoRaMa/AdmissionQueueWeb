import axios, { AxiosError, type AxiosResponse } from 'axios'
import { NotificationProgrammatic } from '@ntohq/buefy-next'

const APIAxios = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/v1'
})
APIAxios.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    if (error.code == 'ERR_NETWORK') {
      new NotificationProgrammatic().open({
        message: `Ошибка сети. Попробуйте ещё раз или сообщите администратору`,
        duration: 3000,
        type: 'is-danger',
        pauseOnHover: true
      })
    }
    return Promise.reject(error)
  }
)
export default APIAxios
