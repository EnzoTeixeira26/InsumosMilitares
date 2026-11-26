import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Alert, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';
import { API } from "../../config/api";
import { registrarAtividade, TIPO_ATIVIDADE } from '../Services/AtividadeService';

export default function GerenciarUsuarios({ navigation }) {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);
    const [novoPerfil, setNovoPerfil] = useState('');

    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [usuarioParaExcluir, setUsuarioParaExcluir] = useState(null);

    useEffect(() => {
        verificarPermissao();
        carregarUsuarios();
    }, []);

    const verificarPermissao = async () => {
        const perfil = await AsyncStorage.getItem('usuarioPerfil');
        if (perfil !== 'ADMINISTRADOR') {
            Alert.alert('Acesso Negado', 'Apenas administradores podem acessar esta tela.');
            navigation.goBack();
        }
    };

    const carregarUsuarios = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API.usuario);
            const dadosOrdenados = response.data.sort((a, b) => b.id - a.id)
            setUsuarios(dadosOrdenados);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            const mockUsuarios = [
                { id: 1, nome: "Capitão João Silva", patente: "Capitão", identificador: "202500000000001", perfil: "ADMINISTRADOR", email: "joao@exercito.def.br" },
                { id: 2, nome: "Tenente Carlos Souza", patente: "Tenente", identificador: "202500000000002", perfil: "OPERADOR", email: "carlos@exercito.def.br" },
                { id: 3, nome: "Sargento Roberto Lima", patente: "Sargento", identificador: "202500000000003", perfil: "OPERADOR", email: "roberto@exercito.def.br" },
            ];
            setUsuarios(mockUsuarios);
        } finally {
            setLoading(false);
        }
    };

    const abrirModalPromocao = (usuario) => {
        setUsuarioSelecionado(usuario);
        setNovoPerfil(usuario.perfil === 'ADMINISTRADOR' ? 'OPERADOR' : 'ADMINISTRADOR');
        setModalVisible(true);
    };

    const handlePromover = async () => {
        if (!usuarioSelecionado) return;

        setLoading(true);
        try {
            await axios.put(`${API.usuario}/${usuarioSelecionado.id}/perfil`, {
                perfil: novoPerfil
            });
            await registrarAtividade(
                'Alterar Perfil',
                `Alterou o perfil de ${usuarioSelecionado.nome} para ${novoPerfil}`,
                TIPO_ATIVIDADE.EDICAO
            );
            
            Alert.alert(
                'Sucesso', 
                `${usuarioSelecionado.nome} foi ${novoPerfil === 'ADMINISTRADOR' ? 'promovido a Administrador' : 'rebaixado para Operador'}!`
            );
            
            setModalVisible(false);
            carregarUsuarios();
        } catch (error) {
            console.error('Erro ao alterar perfil:', error);
            Alert.alert('Erro', 'Não foi possível alterar o perfil do usuário');
        } finally {
            setLoading(false);
        }
    };

    const handleExcluirUsuario = (usuario) => {
        setUsuarioParaExcluir(usuario);
        setDeleteModalVisible(true);
    };

    const confirmarExclusao = async () => {
        if (!usuarioParaExcluir) return;

        try {
            await axios.delete(`${API.usuario}/${usuarioParaExcluir.id}`);
            setDeleteModalVisible(false);
            setUsuarioParaExcluir(null);
            Alert.alert('Sucesso', 'Usuário excluído com sucesso!');
            carregarUsuarios();
            await registrarAtividade(
                'Excluir Usuário',
                `Excluiu o usuário ${usuarioParaExcluir.nome} (${usuarioParaExcluir.identificador})`,
                TIPO_ATIVIDADE.EXCLUSAO
            );
        } catch (error) {
            console.error('Erro ao excluir:', error);
            Alert.alert('Erro', 'Não foi possível excluir o usuário');
            setDeleteModalVisible(false);
        }
    };

    const getPerfilColor = (perfil) => {
        return perfil === 'ADMINISTRADOR' ? '#D32F2F' : '#2E7D32';
    };

    const renderUsuario = ({ item }) => (
        <View style={styles.usuarioCard}>
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                    <Ionicons name="person-circle" size={32} color="#FFD700" />
                    <View>
                        <Text style={styles.usuarioNome}>{item.nome}</Text>
                        <Text style={styles.usuarioPatente}>{item.patente}</Text>
                    </View>
                </View>
                <View style={[styles.perfilBadge, { backgroundColor: getPerfilColor(item.perfil) }]}>
                    <Text style={styles.perfilBadgeText}>{item.perfil}</Text>
                </View>
            </View>
            
            <View style={styles.cardInfo}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Identificador:</Text>
                    <Text style={styles.infoValue}>{item.identificador}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{item.email || 'Não informado'}</Text>
                </View>
            </View>
            
            <View style={styles.cardActions}>
                {item.perfil !== 'ADMINISTRADOR' && (
                    <TouchableOpacity style={styles.promoteButton} onPress={() => abrirModalPromocao(item)}>
                        <Ionicons name="arrow-up-circle" size={18} color="#fff" />
                        <Text style={styles.actionText}>Promover</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleExcluirUsuario(item)}>
                    <Ionicons name="trash" size={18} color="#fff" />
                    <Text style={styles.actionText}>Excluir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
                <View style={styles.headerTop}>
                    <Ionicons name="people" size={32} color="#FFD700" />
                    <Text style={styles.headerTitle}>Gerenciar Usuários</Text>
                </View>
                <Text style={styles.headerSubtitle}>Administração de perfis e permissões</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{usuarios.length}</Text>
                        <Text style={styles.statLabel}>Total de Usuários</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {usuarios.filter(u => u.perfil === 'ADMINISTRADOR').length}
                        </Text>
                        <Text style={styles.statLabel}>Administradores</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {usuarios.filter(u => u.perfil === 'OPERADOR').length}
                        </Text>
                        <Text style={styles.statLabel}>Operadores</Text>
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.addButton} 
                    onPress={() => navigation.navigate('CadastroUsuario')}
                >
                    <Ionicons name="add" size={24} color="#0a2a0a" />
                    <Text style={styles.addButtonText}>NOVO USUÁRIO</Text>
                </TouchableOpacity>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Ionicons name="refresh-circle" size={40} color="#FFD700" />
                        <Text style={styles.loadingText}>Carregando usuários...</Text>
                    </View>
                ) : usuarios.length > 0 ? (
                    <FlatList
                        data={usuarios}
                        renderItem={renderUsuario}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        style={styles.lista}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={60} color="#FFD700" />
                        <Text style={styles.emptyTitle}>Nenhum usuário cadastrado</Text>
                    </View>
                )}
            </View>

            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Ionicons name="warning" size={50} color="#FFD700" />
                        <Text style={styles.modalTitle}>
                            {novoPerfil === 'ADMINISTRADOR' ? 'Promover Usuário' : 'Rebaixar Usuário'}
                        </Text>
                        <Text style={styles.modalText}>
                            {novoPerfil === 'ADMINISTRADOR' 
                                ? `Deseja promover "${usuarioSelecionado?.nome}" para Administrador?`
                                : `Deseja rebaixar "${usuarioSelecionado?.nome}" para Operador?`
                            }
                        </Text>
                        <Text style={styles.modalWarning}>
                            {novoPerfil === 'ADMINISTRADOR'
                                ? '⚠️ O usuário terá acesso total ao sistema.'
                                : '⚠️ O usuário perderá permissões administrativas.'
                            }
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={handlePromover}>
                                <Text style={styles.confirmButtonText}>CONFIRMAR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent={true}
                visible={deleteModalVisible}
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Ionicons name="trash" size={50} color="#F44336" />
                        <Text style={styles.modalTitle}>Confirmar Exclusão</Text>
                        <Text style={styles.modalText}>
                            Deseja realmente excluir o usuário "{usuarioParaExcluir?.nome}"?
                        </Text>
                        <Text style={styles.modalWarning}>
                            ⚠️ Esta ação não pode ser desfeita.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setDeleteModalVisible(false)}>
                                <Text style={styles.buttonText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.deleteConfirmButton]} onPress={confirmarExclusao}>
                                <Text style={styles.buttonText}>EXCLUIR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    content: {
        flex: 1,
        padding: 15,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
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
        textAlign: 'center',
    },
    addButton: {
        backgroundColor: '#FFD700',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 25,
        marginBottom: 20,
    },
    addButtonText: {
        color: '#0a2a0a',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    lista: {
        marginBottom: 20,
    },
    usuarioCard: {
        backgroundColor: '#2a4a2a',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#FFD700',
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    usuarioNome: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    usuarioPatente: {
        fontSize: 12,
        color: '#ccc',
    },
    perfilBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    perfilBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardInfo: {
        gap: 6,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 12,
        color: '#ccc',
        width: 85,
    },
    infoValue: {
        fontSize: 12,
        color: '#fff',
        flex: 1,
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#FFD700',
    },
    promoteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 20,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#F44336',
        paddingHorizontal: 15,
        paddingVertical: 6,
        borderRadius: 20,
    },
    actionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    loadingContainer: {
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        color: '#FFD700',
        marginTop: 10,
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        padding: 50,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
        marginTop: 20,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(10, 42, 10, 0.95)',
    },
    modalContainer: {
        backgroundColor: '#2a4a2a',
        padding: 25,
        borderRadius: 20,
        width: '85%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFD700',
        marginTop: 15,
        marginBottom: 10,
    },
    modalText: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 15,
    },
    modalWarning: {
        fontSize: 12,
        color: '#FF9800',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#555',
    },
    confirmButton: {
        backgroundColor: '#FFD700',
    },
    deleteConfirmButton: {
        backgroundColor: '#F44336',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    confirmButtonText: {
        color: '#0a2a0a',
        fontWeight: 'bold',
    },
});