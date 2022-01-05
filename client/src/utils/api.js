import axios from 'axios';
import store from '../store';
import { LOGOUT } from '../actions/type';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Force unauthorized user to logout
api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.log();
    if (err.response.status === 401) {
      store.dispatch({ type: LOGOUT });
    }
    return Promise.reject(err);
  }
);

export default api;