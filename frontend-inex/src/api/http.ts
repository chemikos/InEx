// src/api/http.ts
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL

// Stworzenie instancji Axios
const http = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default http
