import type { AxiosError, AxiosResponse } from 'axios';
import APIAxios from './instance';
import type { Auth } from 'vue-auth3';

function getAuthHeaders(auth: Auth) {
  const token = auth.token();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
}

export function getAPIData(
  url: string,
  auth: Auth,
  func: (r: AxiosResponse) => void,
  error_func: (r: AxiosError) => void = () => {},
  params: any = {}
) {
  APIAxios.get(url, {
    headers: getAuthHeaders(auth),
    params
  })
    .then((response) => {
      func(response);
    })
    .catch(error_func);
}

export function putAPIData(
  url: string,
  data: any,
  auth: Auth,
  func: (r: AxiosResponse) => void,
  error_func: (r: AxiosError) => void = () => {},
  params: any = {}
) {
  APIAxios.put(url, data, {
    headers: getAuthHeaders(auth),
    params
  })
    .then((response) => {
      func(response);
    })
    .catch(error_func);
}

export function patchAPIData(
  url: string,
  data: any,
  auth: Auth,
  func: (r: AxiosResponse) => void,
  error_func: (r: AxiosError) => void = () => {},
  params: any = {}
) {
  APIAxios.patch(url, data, {
    headers: getAuthHeaders(auth),
    params
  })
    .then((response) => {
      func(response);
    })
    .catch(error_func);
}

export function postAPIData(
  url: string,
  data: object = {},
  auth: Auth,
  func: (r: AxiosResponse) => void = () => {},
  error_func: (r: AxiosError) => void = () => {},
  params: any = {}
) {
  APIAxios.post(url, data, {
    headers: getAuthHeaders(auth),
    params
  })
    .then((response) => {
      func(response);
    })
    .catch(error_func);
}