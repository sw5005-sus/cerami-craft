import { isTokenValid } from '@/src/utils/auth';
import { tokenStorage } from '@/src/utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface AuthState {
    isLoggedIn: boolean;
    setLogin: (status: boolean) => void;
    checkLogin: () => Promise<void>;
    logout: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
    isLoggedIn: false,
    setLogin: (status) => set({isLoggedIn: status}),
    checkLogin: async () => {
        const token = await tokenStorage.get();
        const isValid = isTokenValid(token);
        set({isLoggedIn: !!token && isValid})
    },
    logout: async () => {
        try {
            await tokenStorage.remove(); 
            await AsyncStorage.removeItem('PUSH_AES_KEY'); 
            set({ isLoggedIn: false });
            console.log('✅ 清理完毕，彻底退出！');
        } catch (error) {
            console.error('退出清理时发生错误:', error);
        }
    }
}))