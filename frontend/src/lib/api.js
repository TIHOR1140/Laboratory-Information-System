import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lis_auth_token') || sessionStorage.getItem('lis_auth_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})