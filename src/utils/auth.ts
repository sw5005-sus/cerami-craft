// src/utils/auth.ts
import { jwtDecode } from 'jwt-decode';

export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    // 获取当前时间戳（秒）
    const currentTime = Math.floor(Date.now() / 1000);
    // 预留 60 秒的缓冲期，防止请求在发出去的路上刚好过期
    return decoded.exp > currentTime + 60; 
  } catch (e) {
    return false; // 解析失败直接当废票处理
  }
};