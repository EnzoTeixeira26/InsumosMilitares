import { useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import { VERSAO_ATUAL } from "../../config/api";
import { buscarAtividadesRecentesUsuario, registrarAtividade, TIPO_ATIVIDADE } from '../Services/AtividadeService';

export default function PerfilUsuario({ navigation }) {
    const [user, setUser]                           = useState({});
    const [atividadeRecente, setAtividadeRecente]   = useState([]);
    const [carregandoAtividades, setCarregandoAtividades] = useState(false);

    useFocusEffect(
        useCallback(() => {
            carregarDadosUsuario();
            carregarAtividadeRecente();
        }, [])
    );

    const carregarDadosUsuario = async () => {
        const usuarioCompleto = await AsyncStorage.getItem('usuarioCompleto');
        if (usuarioCompleto) {
            setUser(JSON.parse(usuarioCompleto));
        }
    };

    const carregarAtividadeRecente = async () => {
        setCarregandoAtividades(true);

        try {
            const idStr = await AsyncStorage.getItem('usuarioId');
            if (!idStr) return;

            const atividades = await buscarAtividadesRecentesUsuario(parseInt(idStr));
            setAtividadeRecente(atividades || []);
        } catch (error) {
            console.error('Erro ao carregar atividades:', error);
            setAtividadeRecente([]);
        } finally {
            setCarregandoAtividades(false);
        }
    };

    const handleLogout = async () => {
        await registrarAtividade(
            'Logout',
            `Usuário ${user.nome || ''} saiu do sistema`,
            TIPO_ATIVIDADE.LOGIN
        );

        await AsyncStorage.multiRemove([
            "usuarioNome",
            "usuarioId",
            "usuarioIdentificador",
            "usuarioPerfil",
            "usuarioPatente",
            "usuarioCompleto",
        ]);

        navigation.replace("Login");
    };

    const getPerfilColor = (perfil) =>
        perfil === 'ADMINISTRADOR' ? '#D32F2F' : '#2E7D32';

    const getAtividadeIcon = (tipo) => {
        switch (tipo) {
            case 'login':         return 'log-in';
            case 'consulta':      return 'search';
            case 'cadastro':      return 'person-add';
            case 'edicao':        return 'create';
            case 'exclusao':      return 'trash';
            case 'movimentacao':  return 'swap-horizontal';
            default:              return 'time';
        }
    };

    const formatarData = (data) => {
        if (!data) return '';
        try {
            return new Date(data).toLocaleString('pt-BR');
        } catch {
            return data;
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>

                <View style={styles.headerTop}>
                    <Ionicons name="person-circle" size={50} color="#FFD700" />
                </View>

                <Text style={styles.userName}>{user.nome || 'Carregando...'}</Text>

                <View style={[styles.perfilBadge, { backgroundColor: getPerfilColor(user.perfil) }]}>
                    <Text style={styles.perfilBadgeText}>{user.perfil || 'OPERADOR'}</Text>
                </View>

                <Text style={styles.userIdentificador}>ID: {user.identificador || '---'}</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person" size={20} color="#FFD700" />
                        <Text style={styles.sectionTitle}>Informações Pessoais</Text>
                    </View>

                    <View style={styles.infoCard}>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Patente:</Text>
                            <Text style={styles.infoValue}>{user.patente || 'Não informado'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Ano de Entrada:</Text>
                            <Text style={styles.infoValue}>{user.anoEntrada || 'Não informado'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Email:</Text>
                            <Text style={styles.infoValue}>{user.email || 'Não informado'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Telefone:</Text>
                            <Text style={styles.infoValue}>{user.telefone || 'Não informado'}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>CPF:</Text>
                            <Text style={styles.infoValue}>{user.cpf || 'Não informado'}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="time" size={20} color="#FFD700" />
                        <Text style={styles.sectionTitle}>Atividade Recente</Text>
                    </View>

                    {carregandoAtividades ? (
                        <ActivityIndicator size="small" color="#FFD700" style={{ marginVertical: 20 }} />
                    ) : atividadeRecente.length > 0 ? (
                        atividadeRecente.map((atividade) => (
                            <View key={atividade.id} style={styles.atividadeItem}>
                                <View style={styles.atividadeIcone}>
                                    <Ionicons
                                        name={getAtividadeIcon(atividade.tipo)}
                                        size={20}
                                        color="#FFD700"
                                    />
                                </View>

                                <View style={styles.atividadeInfo}>
                                    <Text style={styles.atividadeAcao}>{atividade.acao}</Text>
                                    <Text style={styles.atividadeDesc} numberOfLines={2}>
                                        {atividade.descricao}
                                    </Text>
                                    <Text style={styles.atividadeData}>
                                        {formatarData(atividade.data)}
                                    </Text>
                                </View>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>Nenhuma atividade recente</Text>
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="settings" size={20} color="#FFD700" />
                        <Text style={styles.sectionTitle}>Ações</Text>
                    </View>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => navigation.navigate('AtualizarDados', { user })}
                    >
                        <Ionicons name="create" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Editar Perfil</Text>
                        <Ionicons name="chevron-forward" size={20} color="#FFD700" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.logoutButton]}
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out" size={20} color="#fff" />
                        <Text style={styles.actionButtonText}>Sair do Sistema</Text>
                        <Ionicons name="chevron-forward" size={20} color="#FFD700" />
                    </TouchableOpacity>
                </View>

                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>
                        SGM-{VERSAO_ATUAL} - Sistema de Gestão Militar Integrada
                    </Text>
                    <Text style={styles.versionSubtext}>
                        Versão - {VERSAO_ATUAL} - © 2026 Exército Brasileiro
                    </Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a3a1a',
    },
    header: {
        backgroundColor: '#0a2a0a',
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#FFD700',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButtonText: {
        color: '#FFD700',
        fontSize: 14,
        marginLeft: 5,
    },
    headerTop: {
        marginBottom: 15,
    },
    userName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFD700',
        fontFamily: 'serif',
        textAlign: 'center',
    },
    perfilBadge: {
        paddingHorizontal: 15,
        paddingVertical: 4,
        borderRadius: 20,
        marginTop: 8,
    },
    perfilBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    userIdentificador: {
        fontSize: 12,
        color: '#ccc',
        marginTop: 8,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#FFD700',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    infoCard: {
        backgroundColor: '#2a4a2a',
        borderRadius: 12,
        padding: 15,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    infoLabel: {
        width: 100,
        fontSize: 13,
        color: '#ccc',
        fontWeight: '500',
    },
    infoValue: {
        flex: 1,
        fontSize: 13,
        color: '#fff',
    },
    atividadeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a4a2a',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    atividadeIcone: {
        width: 40,
        alignItems: 'center',
    },
    atividadeInfo: {
        flex: 1,
    },
    atividadeAcao: {
        fontSize: 13,
        color: '#FFD700',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    atividadeDesc: {
        fontSize: 12,
        color: '#fff',
        marginBottom: 2,
    },
    atividadeData: {
        fontSize: 10,
        color: '#ccc',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a4a2a',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    logoutButton: {
        backgroundColor: '#3a1a1a',
        borderColor: '#F44336',
    },
    actionButtonText: {
        flex: 1,
        fontSize: 14,
        color: '#fff',
        marginLeft: 12,
    },
    emptyText: {
        textAlign: 'center',
        color: '#ccc',
        fontStyle: 'italic',
        padding: 20,
    },
    versionContainer: {
        alignItems: 'center',
        padding: 20,
        marginTop: 20,
    },
    versionText: {
        fontSize: 12,
        color: '#FFD700',
        textAlign: 'center',
    },
    versionSubtext: {
        fontSize: 10,
        color: '#ccc',
        textAlign: 'center',
        marginTop: 4,
    },
});