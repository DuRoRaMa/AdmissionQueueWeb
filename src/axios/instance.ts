import axios, { AxiosError, type AxiosResponse } from 'axios';
import { getCurrentInstance } from 'vue';

const APIAxios = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false
});

function removeHeader(headers: any, name: string) {
  if (!headers) return;

  if (typeof headers.delete === 'function') {
    headers.delete(name);
  }

  delete headers[name];
}

APIAxios.interceptors.request.use((config) => {
  removeHeader(config.headers, 'X-CSRFToken');
  removeHeader(config.headers, 'X-Csrftoken');
  removeHeader(config.headers, 'x-csrftoken');
  removeHeader(config.headers, 'X-Requested-With');
  removeHeader(config.headers, 'x-requested-with');
  removeHeader(config.headers, 'X-Ajax-Token');
  removeHeader(config.headers, 'x-ajax-token');

  return config;
});

APIAxios.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.code === 'ERR_NETWORK') {
      const $buefy = getCurrentInstance()?.appContext.config.globalProperties.$buefy as any;

      $buefy?.notification.open({
        message: 'Ошибка сети. Попробуйте ещё раз или сообщите администратору',
        duration: 3000,
        type: 'is-danger',
        pauseOnHover: true
      });
    }

    return Promise.reject(error);
  }
);

export default APIAxios;