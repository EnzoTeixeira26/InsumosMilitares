import { View, Alert, PanResponder, AppState } from 'react-native';
import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registrarAtividade, TIPO_ATIVIDADE } from '../../Services/AtividadeService';

export const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos

export function IdleProvider({ children, navigationRef, timeout = IDLE_TIMEOUT_MS }) {
    const timerRef = useRef(null);
    const appStateRef = useRef(AppState.currentState);
    const lastActivityRef = useRef(Date.now());
    const [isIdle, setIsIdle] = useState(false);

    const handleIdle = useCallback(async () => {
        if (isIdle) return;
        setIsIdle(true);

        const nome = (await AsyncStorage.getItem('usuarioNome')) || 'Usuário';

        await registrarAtividade(
            'Sessão Expirada',
            `${nome} foi desconectado por inatividade`,
            TIPO_ATIVIDADE.CONSULTA
        );

        await AsyncStorage.multiRemove([
            'usuarioNome', 'usuarioId', 'usuarioIdentificador',
            'usuarioPerfil', 'usuarioPatente', 'usuarioCompleto', '@last_activity'
        ]);

        Alert.alert(
            'Sessão Expirada',
            'Você ficou inativo por muito tempo. Faça login novamente.',
            [{
                text: 'OK',
                onPress: () => {
                    if (navigationRef?.current) {
                        navigationRef.current.reset({ index: 0, routes: [{ name: 'Login' }] });
                    }
                }
            }]
        );
    }, [navigationRef, isIdle]);

    const resetTimer = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(handleIdle, timeout);
    }, [timeout, handleIdle]);

    const handleInteraction = useCallback(() => {
        const now = Date.now();
        // Se a última interação já passou do tempo limite, desloga imediatamente
        if (now - lastActivityRef.current >= timeout) {
            handleIdle();
            return;
        }
        lastActivityRef.current = now;
        resetTimer();
    }, [timeout, handleIdle, resetTimer]);

    // Verifica o tempo ao iniciar o app
    useEffect(() => {
        const init = async () => {
            const stored = await AsyncStorage.getItem('@last_activity');
            const now = Date.now();
            
            if (stored) {
                const elapsed = now - parseInt(stored);
                if (elapsed >= timeout) {
                    handleIdle();
                    return;
                }
                lastActivityRef.current = now;
                timerRef.current = setTimeout(handleIdle, timeout - elapsed);
            } else {
                resetTimer();
            }
        };
        init();

        const sub = AppState.addEventListener('change', (next) => {
            if (appStateRef.current.match(/inactive|background/) && next === 'active') {
                handleInteraction();
            }
            appStateRef.current = next;
        });

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            sub.remove();
        };
    }, [timeout, handleIdle, resetTimer, handleInteraction]);

    // Salva a última atividade no AsyncStorage a cada 5 segundos para não sobrecarregar
    useEffect(() => {
        const interval = setInterval(() => {
            AsyncStorage.setItem('@last_activity', lastActivityRef.current.toString());
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const panResponder = useMemo(
        () => PanResponder.create({
            onStartShouldSetPanResponderCapture: () => { handleInteraction(); return false; },
            onMoveShouldSetPanResponderCapture: () => { handleInteraction(); return false; },
        }),
        [handleInteraction]
    );

    return (
        <View style={{ flex: 1 }} {...panResponder.panHandlers}>
            {children}
        </View>
    );
}