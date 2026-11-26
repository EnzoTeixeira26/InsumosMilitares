import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API } from '../../config/api';

export const TIPO_ATIVIDADE = {
    LOGIN: 'login',
    CONSULTA: 'consulta',
    CADASTRO: 'cadastro',
    EDICAO: 'edicao',
    EXCLUSAO: 'exclusao',
    MOVIMENTACAO: 'movimentacao',
};

export async function registrarAtividade(acao, descricao, tipo) {
    try {
        const usuarioId = await AsyncStorage.getItem('usuarioId');
        await axios.post(API.atividade, {
            usuarioId: usuarioId ? parseInt(usuarioId) : null,
            acao,
            descricao,
            tipo,
        });
        return true;
    } catch (error) {
        console.error('Erro ao registrar atividade:', error);
        return false;
    }
}

export async function buscarAtividadesUsuario(usuarioId) {
    const res = await axios.get(`${API.atividade}/usuario/${usuarioId}`);
    return res.data;
}

export async function buscarAtividadesRecentesUsuario(usuarioId) {
    const res = await axios.get(`${API.atividade}/usuario/${usuarioId}/recentes`);
    return res.data;
}

export async function buscarTodasAtividades() {
    const res = await axios.get(API.atividade);
    return res.data;
}