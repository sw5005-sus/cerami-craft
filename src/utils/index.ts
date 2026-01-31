// 导出所有工具函数
export * from './image';

// 登录相关的验证工具函数

// 验证邮箱格式 - 使用更严格的邮箱验证规则
export const isValidEmail = (email: string): boolean => {
  // 更严格的邮箱验证正则，包含常见的邮箱格式要求
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

// 验证密码强度（至少8位，必须包含英文字母和数字）
export const isValidPassword = (password: string): boolean => {
  // 检查长度是否至少8位
  if (password.length < 8) {
    return false;
  }
  
  // 检查是否包含至少一个英文字母
  const hasLetter = /[a-zA-Z]/.test(password);
  
  // 检查是否包含至少一个数字
  const hasNumber = /[0-9]/.test(password);
  
  return hasLetter && hasNumber;
};

// 获取密码验证失败的具体原因（用于显示详细的错误信息）
export const getPasswordError = (password: string): string | null => {
  if (password.length === 0) {
    return 'Password is required';
  }
  
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter && !hasNumber) {
    return 'Password must contain both letters and numbers';
  }
  
  if (!hasLetter) {
    return 'Password must contain at least one letter';
  }
  
  if (!hasNumber) {
    return 'Password must contain at least one number';
  }
  
  return null;
};
