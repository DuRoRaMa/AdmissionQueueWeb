import type { AxiosResponse } from 'axios'
import APIAxios from './instance'
import type { Auth } from 'vue-auth3'

export function getAPIData(url: string, auth: Auth, func: (r: AxiosResponse) => void) {
  APIAxios.get(url, {
    headers: { Authorization: 'Bearer ' + auth.token() }
  })
    .then(func)
    .catch((err) => {
      console.error(err)
    })
}

export function putAPIData(url: string, data: any, auth: Auth, func: (r: AxiosResponse) => void) {
  APIAxios.put(url, data, {
    headers: { Authorization: 'Bearer ' + auth.token() }
  })
    .then(func)
    .catch((err) => {
      console.error(err)
    })
}
export function patchAPIData(url: string, data: any, auth: Auth, func: (r: AxiosResponse) => void) {
  APIAxios.patch(url, data, {
    headers: { Authorization: 'Bearer ' + auth.token() }
  })
    .then(func)
    .catch((err) => {
      console.error(err)
    })
}
export function postAPIData(url: string, data: any, auth: Auth, func: (r: AxiosResponse) => void) {
  APIAxios.post(url, data, {
    headers: { Authorization: 'Bearer ' + auth.token() }
  })
    .then(func)
    .catch((err) => {
      console.error(err)
    })
}
