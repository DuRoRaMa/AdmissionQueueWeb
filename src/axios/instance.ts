import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { NotificationProgrammatic } from '@ntohq/buefy-next';
console.log(import.meta.env);

const APIAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});
APIAxios.interceptors.request.use((request: InternalAxiosRequestConfig) => {
  console.log(request.url);
  console.log(request);
  console.log(request.baseURL);
  console.log(import.meta.env.VITE_API_URL);
  console.log(import.meta.env);

  return request;
});
APIAxios.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.code == 'ERR_NETWORK') {
      new NotificationProgrammatic().open({
        message: `Ошибка сети. Попробуйте ещё раз или сообщите администратору`,
        duration: 3000,
        type: 'is-danger',
        pauseOnHover: true
      });
    }
    return Promise.reject(error);
  }
);
export default APIAxios;
