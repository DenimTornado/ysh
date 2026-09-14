import { useCallback, useEffect, useRef, useState } from 'react';
import { getUserInfo } from '../api';
import type { Home } from '../model';

const message = (error: unknown) => error instanceof Error ? error.message : 'Не удалось связаться с сервером.';

export function useHome(token: string | null) {
    const [home, setHome] = useState<Home>({ devices: [], rooms: [], scenarios: [] });
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [updated, setUpdated] = useState<Date>();
    const request = useRef<AbortController | null>(null);
    const locked = useRef(false);
    const mounted = useRef(false);
    const followUp = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const refresh = useCallback(async () => {
        if (!token) return;
        request.current?.abort();
        const controller = new AbortController();
        request.current = controller;
        setLoading(true);
        try {
            const data = await getUserInfo(controller.signal);
            if (!mounted.current || controller.signal.aborted) return;
            setHome(data);
            setUpdated(new Date());
            setError('');
        } catch (failure) {
            if (mounted.current && !controller.signal.aborted) setError(message(failure));
        } finally {
            if (mounted.current && request.current === controller) setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        mounted.current = true;
        void refresh();
        const onVisible = () => {
            if (document.visibilityState === 'visible' && !locked.current) void refresh();
        };
        const interval = setInterval(onVisible, 120000);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            mounted.current = false;
            request.current?.abort();
            clearInterval(interval);
            clearTimeout(followUp.current);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [refresh]);

    const execute = useCallback(async (work: () => Promise<void>) => {
        if (locked.current) return false;
        locked.current = true;
        clearTimeout(followUp.current);
        request.current?.abort();
        setBusy(true);
        setError('');
        let failureMessage = '';
        try {
            await work();
        } catch (failure) {
            failureMessage = message(failure);
        }
        // Сверяем также частично выполненные команды; повторно команды не отправляем.
        if (mounted.current) await refresh();
        if (mounted.current) {
            if (failureMessage) setError(failureMessage);
            else followUp.current = setTimeout(() => { if (!locked.current) void refresh(); }, 1500);
            setBusy(false);
        }
        locked.current = false;
        return !failureMessage;
    }, [refresh]);

    return { home, loading, busy, error, updated, refresh, execute };
}
