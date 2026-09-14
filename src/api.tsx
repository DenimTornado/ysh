import { createApiClient } from './api-client';

export const TOKEN_KEY = 'yandex_smart_home_token';
export const { getUserInfo, sendActions, runScenario } = createApiClient(
    import.meta.env.VITE_API_URL,
    () => localStorage.getItem(TOKEN_KEY),
);
