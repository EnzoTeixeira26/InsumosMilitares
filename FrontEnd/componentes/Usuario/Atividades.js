import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, FlatList, RefreshControl } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';
import { API } from "../../config/api";

export default function Atividades({ navigation }) {
    const [atividades, setAtividades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filtroTipo, setFiltroTipo] = useState('TODOS');
    const [filtroUsuario, setFiltroUsuario] = useState('');
    const [usuarios, setUsuarios] = useState([]);
    const [modalFiltroVisible, setModalFiltroVisible] = useState(false);
    const [modalDetalheVisible, setModalDetalheVisible] = useState(false);
    const [atividadeSelecionada, setAtividadeSelecionada] = useState(null);
    const [mensagemModalVisible, setMensagemModalVisible] = useState(false);
    const [mensagemTexto, setMensagemTexto] = useState('');

    const tiposAtividade = [
        { id: 'TODOS', nome: 'Todos', icone: 'apps' },
        { id: 'login', nome: 'Login', icone: 'log-in' },
        { id: 'consulta', nome: 'Consulta', icone: 'search' },
        { id: 'cadastro', nome: 'Cadastro', icone: 'person-add' },
        { id: 'edicao', nome: 'Edição', icone: 'create' },
        { id: 'exclusao', nome: 'Exclusão', icone: 'trash' },
        { id: 'movimentacao', nome: 'Movimentação', icone: 'swap-horizontal' },
    ];

    const getIconByTipo = (tipo) => {
        switch (tipo) {
            case 'login': return 'log-in';
            case 'consulta': return 'search';
            case 'cadastro': return 'person-add';
            case 'edicao': return 'create';
            case 'exclusao': return 'trash';
            case 'movimentacao': return 'swap-horizontal';
            default: return 'time';
        }
    };

    const getColorByTipo = (tipo) => {
        switch (tipo) {
            case 'login': return '#2196F3';
            case 'consulta': return '#4CAF50';
            case 'cadastro': return '#FF9800';
            case 'edicao': return '#9C27B0';
            case 'exclusao': return '#F44336';
            case 'movimentacao': return '#00BCD4';
            default: return '#757575';
        }
    };

    const mostrarMensagem = (texto) => {
        setMensagemTexto(texto);
        setMensagemModalVisible(true);
        setTimeout(() => setMensagemModalVisible(false), 2000);
    };

    const carregarAtividades = async () => {
        setLoading(true);
        try {
            //let url = 'http://localhost:8080/api/v1/atividade';
            const response = await axios.get(API.atividade);
            const dadosOrdenados = response.data.sort((a,b) => b.id - a.id)

            setAtividades(dadosOrdenados);
        } catch (error) {
            console.error('Erro ao carregar atividades:', error);
            // Mock data para teste e tbm pra ja tratei usando try catch, entao caso o backend nao obter os dados, mostra os mock no offline
            const mockAtividades = [
                { id: 1, usuarioId: 1, acao: "Login", descricao: "Coronel João Almeida - Usuário administrador acessou o sistema", tipo: "login", data: new Date().toLocaleString() },
                { id: 2, usuarioId: 2, acao: "Cadastrar Equipamento", descricao: "Capitão Marcos Silva - Cadastrou novo equipamento: FACÃO (SEL-001)", tipo: "cadastro", data: new Date().toLocaleString() },
                { id: 3, usuarioId: 1, acao: "Excluir Soldado", descricao: "Coronel João Almeida - Excluiu soldado: Pedro Santos", tipo: "exclusao", data: new Date().toLocaleString() },
                { id: 4, usuarioId: 2, acao: "Movimentar Estoque", descricao: "Capitão Marcos Silva - Saída de 100 L de Combustível Diesel", tipo: "movimentacao", data: new Date().toLocaleString() },
                { id: 5, usuarioId: 1, acao: "Editar Insumo", descricao: "Coronel João Almeida - Editou insumo: Munição 5.56mm", tipo: "edicao", data: new Date().toLocaleString() },
            ];
            setAtividades(mockAtividades);
        } finally {
            setLoading(false);
        }
    };

    const carregarUsuarios = async () => {
        try {
            const response = await axios.get(API.usuario);
            setUsuarios(response.data);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            const mockUsuarios = [
                { id: 1, nome: "Coronel João Almeida" },
                { id: 2, nome: "Capitão Marcos Silva" },
            ];
            setUsuarios(mockUsuarios);
        }
    };

    const atividadesFiltradas = () => {
        let filtradas = [...atividades];
        
        if (filtroTipo !== 'TODOS') {
            filtradas = filtradas.filter(a => a.tipo === filtroTipo);
        }
        
        if (filtroUsuario) {
            filtradas = filtradas.filter(a => a.usuarioId === parseInt(filtroUsuario));
        }
        
        return filtradas;
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await carregarAtividades();
        setRefreshing(false);
    }, []);

    useEffect(() => {
        verificarPermissao();
        carregarAtividades();
        carregarUsuarios();
    }, []);

    const verificarPermissao = async () => {
        const perfil = await AsyncStorage.getItem('usuarioPerfil');
        if (perfil !== 'ADMINISTRADOR') {
            mostrarMensagem('Acesso Negado - Apenas administradores podem acessar esta tela.');
            setTimeout(() => navigation.goBack(), 2000);
            //2 segundos pq sao milisegundos
        }
    };

    const limparFiltros = () => {
        setFiltroTipo('TODOS');
        setFiltroUsuario('');
    };

    const getNomeUsuario = (usuarioId) => {
        const usuario = usuarios.find(u => u.id === usuarioId);
        return usuario ? usuario.nome : 'Usuário desconhecido';
    };

    const renderAtividade = ({ item }) => (
        <TouchableOpacity 
            style={styles.atividadeCard}
            onPress={() => {
                setAtividadeSelecionada(item);
                setModalDetalheVisible(true);
            }}
        >
            <View style={styles.atividadeHeader}>
                <View style={[styles.atividadeIcone, { backgroundColor: getColorByTipo(item.tipo) }]}>
                    <Ionicons name={getIconByTipo(item.tipo)} size={20} color="#fff" />
                </View>
                <View style={styles.atividadeInfo}>
                    <Text style={styles.atividadeAcao}>{item.acao}</Text>
                    <Text style={styles.atividadeUsuario}>{getNomeUsuario(item.usuarioId)}</Text>
                </View>
                <Text style={styles.atividadeData}>{item.data?.split(',')[0] || item.data}</Text>
            </View>
            <Text style={styles.atividadeDescricao} numberOfLines={2}>
                {item.descricao}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
                <View style={styles.headerTop}>
                    <Ionicons name="time" size={32} color="#FFD700" />
                    <Text style={styles.headerTitle}>Registro de Atividades</Text>
                </View>
                <Text style={styles.headerSubtitle}>Histórico de ações dos usuários</Text>
            </View>

            <View style={styles.filtroBar}>
                <TouchableOpacity 
                    style={styles.filtroButton} 
                    onPress={() => setModalFiltroVisible(true)}
                >
                    <Ionicons name="filter" size={20} color="#FFD700" />
                    <Text style={styles.filtroButtonText}>Filtrar</Text>
                </TouchableOpacity>
                
                {(filtroTipo !== 'TODOS' || filtroUsuario) && (
                    <TouchableOpacity style={styles.limparFiltroButton} onPress={limparFiltros}>
                        <Ionicons name="close-circle" size={16} color="#FFD700" />
                        <Text style={styles.limparFiltroText}>Limpar Filtros</Text>
                    </TouchableOpacity>
                )}
                
                <TouchableOpacity style={styles.refreshButton} onPress={carregarAtividades}>
                    <Ionicons name="refresh" size={20} color="#FFD700" />
                </TouchableOpacity>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{atividades.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{atividadesFiltradas().length}</Text>
                    <Text style={styles.statLabel}>Filtrados</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>
                        {atividades.filter(a => a.tipo === 'login').length}
                    </Text>
                    <Text style={styles.statLabel}>Logins</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Ionicons name="refresh-circle" size={40} color="#FFD700" />
                    <Text style={styles.loadingText}>Carregando atividades...</Text>
                </View>
            ) : atividadesFiltradas().length > 0 ? (
                <FlatList
                    data={atividadesFiltradas()}
                    renderItem={renderAtividade}
                    keyExtractor={(item) => item.id.toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FFD700"]} />
                    }
                    contentContainerStyle={styles.lista}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={60} color="#FFD700" />
                    <Text style={styles.emptyTitle}>Nenhuma atividade encontrada</Text>
                    <Text style={styles.emptyText}>
                        Nenhuma atividade corresponde aos filtros selecionados
                    </Text>
                </View>
            )}

            <Modal
                transparent={true}
                visible={modalFiltroVisible}
                animationType="slide"
                onRequestClose={() => setModalFiltroVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Filtrar Atividades</Text>
                        
                        <Text style={styles.modalSubtitle}>Tipo de Atividade</Text>
                        <View style={styles.tiposContainer}>
                            {tiposAtividade.map((tipo) => (
                                <TouchableOpacity
                                    key={tipo.id}
                                    style={[
                                        styles.tipoFiltro,
                                        filtroTipo === tipo.id && styles.tipoFiltroSelected
                                    ]}
                                    onPress={() => setFiltroTipo(tipo.id)}
                                >
                                    <Ionicons name={tipo.icone} size={16} color={filtroTipo === tipo.id ? "#0a2a0a" : "#FFD700"} />
                                    <Text style={[styles.tipoFiltroText, filtroTipo === tipo.id && styles.tipoFiltroTextSelected]}>
                                        {tipo.nome}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.modalSubtitle}>Usuário</Text>
                        <View style={styles.usuariosContainer}>
                            <TouchableOpacity
                                style={[styles.usuarioFiltro, !filtroUsuario && styles.usuarioFiltroSelected]}
                                onPress={() => setFiltroUsuario('')}
                            >
                                <Text style={[styles.usuarioFiltroText, !filtroUsuario && styles.usuarioFiltroTextSelected]}>
                                    Todos
                                </Text>
                            </TouchableOpacity>
                            {usuarios.map((usuario) => (
                                <TouchableOpacity
                                    key={usuario.id}
                                    style={[
                                        styles.usuarioFiltro,
                                        filtroUsuario === usuario.id.toString() && styles.usuarioFiltroSelected
                                    ]}
                                    onPress={() => setFiltroUsuario(usuario.id.toString())}
                                >
                                    <Text style={[
                                        styles.usuarioFiltroText,
                                        filtroUsuario === usuario.id.toString() && styles.usuarioFiltroTextSelected
                                    ]}>
                                        {usuario.nome.split(' ')[0]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalFiltroVisible(false)}>
                                <Text style={styles.buttonText}>FECHAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.applyButton]} onPress={() => setModalFiltroVisible(false)}>
                                <Text style={styles.applyButtonText}>APLICAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent={true}
                visible={modalDetalheVisible}
                animationType="fade"
                onRequestClose={() => setModalDetalheVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalDetalheContainer}>
                        <View style={[styles.detalheIcone, { backgroundColor: getColorByTipo(atividadeSelecionada?.tipo) }]}>
                            <Ionicons name={getIconByTipo(atividadeSelecionada?.tipo)} size={40} color="#fff" />
                        </View>
                        <Text style={styles.detalheAcao}>{atividadeSelecionada?.acao}</Text>
                        <Text style={styles.detalheUsuario}>
                            Usuário: {getNomeUsuario(atividadeSelecionada?.usuarioId)}
                        </Text>
                        <Text style={styles.detalheData}>
                            Data: {atividadeSelecionada?.data}
                        </Text>
                        <View style={styles.detalheDescricaoContainer}>
                            <Text style={styles.detalheDescricaoLabel}>Descrição:</Text>
                            <Text style={styles.detalheDescricao}>{atividadeSelecionada?.descricao}</Text>
                        </View>
                        <TouchableOpacity style={styles.detalheButton} onPress={() => setModalDetalheVisible(false)}>
                            <Text style={styles.detalheButtonText}>FECHAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent={true}
                visible={mensagemModalVisible}
                animationType="fade"
                onRequestClose={() => setMensagemModalVisible(false)}
            >
                <View style={styles.modalMensagemOverlay}>
                    <View style={styles.modalMensagemContainer}>
                        <Ionicons name="alert-circle" size={50} color="#FF9800" />
                        <Text style={styles.modalMensagemText}>{mensagemTexto}</Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a3a1a',
    },
    header: {
        backgroundColor: '#0a2a0a',
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#FFD700',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    backButtonText: {
        color: '#FFD700',
        fontSize: 14,
        marginLeft: 5,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFD700',
        fontFamily: 'serif',
        letterSpacing: 1,
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#ccc',
        textAlign: 'center',
        marginTop: 5,
    },
    filtroBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: '#2a4a2a',
        borderBottomWidth: 1,
        borderBottomColor: '#FFD700',
    },
    filtroButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#1a3a1a',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    filtroButtonText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
    },
    limparFiltroButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#3a2a1a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    limparFiltroText: {
        color: '#FF9800',
        fontSize: 10,
    },
    refreshButton: {
        padding: 8,
        backgroundColor: '#1a3a1a',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    statsContainer: {
        flexDirection: 'row',
        padding: 15,
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#2a4a2a',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    statNumber: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    statLabel: {
        fontSize: 10,
        color: '#fff',
        marginTop: 3,
    },
    lista: {
        padding: 15,
        paddingTop: 0,
    },
    atividadeCard: {
        backgroundColor: '#2a4a2a',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    atividadeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    atividadeIcone: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    atividadeInfo: {
        flex: 1,
    },
    atividadeAcao: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    atividadeUsuario: {
        fontSize: 11,
        color: '#ccc',
        marginTop: 2,
    },
    atividadeData: {
        fontSize: 10,
        color: '#888',
    },
    atividadeDescricao: {
        fontSize: 12,
        color: '#fff',
        marginLeft: 48,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        color: '#FFD700',
        marginTop: 10,
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 50,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
        marginTop: 20,
    },
    emptyText: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
        marginTop: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(10, 42, 10, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#2a4a2a',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFD700',
        textAlign: 'center',
        marginBottom: 5,
    },
    modalSubtitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 15,
        marginBottom: 10,
    },
    tiposContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tipoFiltro: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#1a3a1a',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    tipoFiltroSelected: {
        backgroundColor: '#FFD700',
    },
    tipoFiltroText: {
        color: '#FFD700',
        fontSize: 12,
    },
    tipoFiltroTextSelected: {
        color: '#0a2a0a',
    },
    usuariosContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    usuarioFiltro: {
        backgroundColor: '#1a3a1a',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    usuarioFiltroSelected: {
        backgroundColor: '#FFD700',
    },
    usuarioFiltroText: {
        color: '#FFD700',
        fontSize: 12,
    },
    usuarioFiltroTextSelected: {
        color: '#0a2a0a',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 25,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#555',
    },
    applyButton: {
        backgroundColor: '#FFD700',
    },
    applyButtonText: {
        color: '#0a2a0a',
        fontWeight: 'bold',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalDetalheContainer: {
        backgroundColor: '#2a4a2a',
        borderRadius: 20,
        padding: 25,
        width: '85%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    detalheIcone: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 15,
    },
    detalheAcao: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 10,
    },
    detalheUsuario: {
        fontSize: 14,
        color: '#fff',
        marginBottom: 5,
    },
    detalheData: {
        fontSize: 12,
        color: '#ccc',
        marginBottom: 15,
    },
    detalheDescricaoContainer: {
        backgroundColor: '#1a3a1a',
        padding: 15,
        borderRadius: 10,
        width: '100%',
        marginBottom: 20,
    },
    detalheDescricaoLabel: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 5,
    },
    detalheDescricao: {
        fontSize: 13,
        color: '#fff',
        lineHeight: 18,
    },
    detalheButton: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 25,
    },
    detalheButtonText: {
        color: '#0a2a0a',
        fontWeight: 'bold',
    },
    modalMensagemOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(10, 42, 10, 0.95)',
    },
    modalMensagemContainer: {
        backgroundColor: '#2a4a2a',
        padding: 25,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FF9800',
    },
    modalMensagemText: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        marginTop: 10,
    },
});