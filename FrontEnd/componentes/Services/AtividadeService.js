import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API } from "../../config/api";

//const API_URL = 'http://localhost:8080/api/v1/atividade';

export const registrarAtividade = async (acao, descricao, tipo) => {
    try {
        const usuarioId = await AsyncStorage.getItem('usuarioId');
        const usuarioNome = await AsyncStorage.getItem('usuarioNome');
        
        if (!usuarioId) {
            console.log('Usuário não logado, atividade não registrada');
            return;
        }

        const atividade = {
            usuarioId: parseInt(usuarioId),
            acao: acao,
            descricao: `${usuarioNome} - ${descricao}`,
            tipo: tipo,
            data: new Date().toISOString()
        };

        await axios.post(API.atividade, atividade);
        console.log('Atividade registrada:', acao);
    } catch (error) {
        console.error('Erro ao registrar atividade:', error);
    }
};

export const TIPO_ATIVIDADE = {
    LOGIN: 'login',
    CONSULTA: 'consulta',
    CADASTRO: 'cadastro',
    EDICAO: 'edicao',
    EXCLUSAO: 'exclusao',
    MOVIMENTACAO: 'movimentacao'
};