import axios from 'axios'
import {
  normalizeApiError,
} from './apiError'

export const httpClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ??
    'http://localhost:3000/api',

  timeout: 10_000,

  headers: {
    Accept: 'application/json',
  },
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) =>
    Promise.reject(normalizeApiError(error)),
)