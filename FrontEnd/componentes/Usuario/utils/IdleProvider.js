import { View, Alert, PanResponder, AppState } from 'react-native';
import { useRef, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registrarAtividade, TIPO_ATIVIDADE } from '../Services/AtividadeService';

export const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

export function IdleProvider({ children, navigationRef, timeout = IDLE_TIMEOUT_MS }) {
    const timerRef    = useRef(null);
    const appStateRef = useRef(AppState.currentState);

    const handleIdle = useCallback(async () => {
        const nome = (await AsyncStorage.getItem('usuarioNome')) || 'Usuário';

        await registrarAtividade(
            'Sessão Expirada',
            `${nome} foi desconectado por inatividade`,
            TIPO_ATIVIDADE.CONSULTA
        );

        await AsyncStorage.multiRemove([
            'usuarioNome',
            'usuarioId',
            'usuarioIdentificador',
            'usuarioPerfil',
            'usuarioPatente',
            'usuarioCompleto'
        ]);

        Alert.alert(
            'Sessão Expirada',
            'Você ficou inativo por muito tempo. Faça login novamente.',
            [
                {
                    text: 'OK',
                    onPress: () => {
                        if (navigationRef?.current) {
                            navigationRef.current.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                            });
                        }
                    },
                },
            ]
        );
    }, [navigationRef]);

    const reset = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(handleIdle, timeout);
    }, [timeout, handleIdle]);

    useEffect(() => {
        reset();

        const sub = AppState.addEventListener('change', (next) => {
            if (appStateRef.current.match(/inactive|background/) && next === 'active') {
                reset();
            }
            appStateRef.current = next;
        });

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            sub.remove();
        };
    }, [reset]);

    const panResponder = useMemo(
        () => PanResponder.create({
            onStartShouldSetPanResponderCapture: () => { reset(); return false; },
            onMoveShouldSetPanResponderCapture:  () => { reset(); return false; },
        }),
        [reset]
    );

    return (
        <View style={{ flex: 1 }} {...panResponder.panHandlers}>
            {children}
        </View>
    );
}