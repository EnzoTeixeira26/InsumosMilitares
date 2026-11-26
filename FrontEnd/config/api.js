
import { Platform } from 'react-native';

export const VERSAO_ATUAL = 'V_1.8'

const IP_MAQUINA = '10.1.1.232';

const API_PROD = process.env.EXPO_PUBLIC_API_URL || 'https://backend-zfil.onrender.com';

const API_LOCAL = `http://${IP_MAQUINA}:8080`;
const API_LOCAL_WEB = 'http://localhost:8080';


const getBaseUrl = () => {
    if (Platform.OS === 'web') {
        const hostname = window.location.hostname;
        
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return API_LOCAL_WEB;  
        }
        
        return API_PROD; 
    }
    
    
    const isDev = __DEV__;  
    
    if (isDev) {
        return API_LOCAL;  
    }
    
    return API_PROD;  
};


export const API_BASE_URL = getBaseUrl();

export const API = {
    usuario: `${API_BASE_URL}/api/v1/usuario`,
    equipamento: `${API_BASE_URL}/api/v1/equipamento`,
    insumo: `${API_BASE_URL}/api/v1/insumo`,
    soldado: `${API_BASE_URL}/api/v1/soldado`,
    movimentacao: `${API_BASE_URL}/api/v1/movimentacao`,
    atividade: `${API_BASE_URL}/api/v1/atividade`,
    soldadoEquipamento: `${API_BASE_URL}/api/v1/soldado-equipamento`,
};

