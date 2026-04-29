import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const register = (data) => api.post('/register', data)
export const login = (data) => api.post('/login', data)
export const getStocks = () => api.get('/stocks')
export const getChart = (symbol, period = '1M') => api.get(`/stocks/${symbol}/chart?period=${period}`)
export const getPortfolio = (userId) => api.get(`/portfolio/${userId}`)
export const placeOrder = (data) => api.post('/orders', data)
export const modifyOrder = (data) => api.post('/orders/modify', data)
export const cancelActiveOrder = (userId, orderId) => api.delete(`/orders/cancel/${userId}/${orderId}`)
export const getOrders = (userId) => api.get(`/orders/${userId}`)
export const getActiveOrders = (userId) => api.get(`/orders/active/${userId}`)
export const getMarketOverview = () => api.get('/market/overview')
export const getIndicatorsGuide = () => api.get('/learn/indicators')

export default api