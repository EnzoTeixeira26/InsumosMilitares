import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions, Alert, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { registrarAtividade, TIPO_ATIVIDADE } from '../Services/AtividadeService';
import { Button } from "react-native-web";
import { VERSAO_ATUAL } from "../../config/api";

const { width } = Dimensions.get('window');

export default function Principal({ navigation }) {
    const [usuarioNome, setUsuarioNome] = useState('');
    const [usuarioPerfil, setUsuarioPerfil] = useState('');
    const [usuarioPatente, setUsuarioPatente] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMensagem, setModalMensagem] = useState('');
    const [modalTitulo, setModalTitulo] = useState('');
    const [modalPelotaoVisible, setModalPelotaoVisible] = useState(false);
    const [moduloSelecionado, setModuloSelecionado] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            const nome = await AsyncStorage.getItem('usuarioNome');
            const perfil = await AsyncStorage.getItem('usuarioPerfil');
            const patente = await AsyncStorage.getItem('usuarioPatente');
            if (nome) setUsuarioNome(nome);
            if (perfil) setUsuarioPerfil(perfil);
            if (patente) setUsuarioPatente(patente);
        };
        fetchUserData();
    }, []);

    const handleLogout = async () => {
        await AsyncStorage.multiRemove(["usuarioNome", "usuarioId", "usuarioIdentificador", "usuarioPerfil", "usuarioPatente", "usuarioCompleto", "isLoggedIn"]);
        navigation.replace("Login");
    }


    const mostrarModalSemPermissao = (moduloNome) => {
        setModalTitulo('Acesso Negado');
        setModalMensagem(`O módulo "${moduloNome}" é restrito a Administradores.`);
        setModalVisible(true);
    };

    const mostrarModalSelecionarPelotao = (modulo) => {
        setModuloSelecionado(modulo);
        setModalPelotaoVisible(true);
    };

    const pelotoes = [
    { id: 1, nome: "PELOTÃO SELVA", icone: "tree", cor: "#2E7D32", tipo: "selva" },
    { id: 2, nome: "PELOTÃO TANQUE", icone: "tank", cor: "#5D4037", tipo: "tanque" },
    { id: 3, nome: "PELOTÃO JEEP", icone: "jeepney", cor: "#1565C0", tipo: "jeep" },
    { id: 4, nome: "PELOTÃO PARAQUEDISTA", icone: "parachute", cor: "#6A1B9A", tipo: "paraquedista" },
];

    const modulos = [
        { id: 1, nome: "GESTÃO DE EQUIPAMENTOS", icone: "cube", cor: "#FF8F00", rota: "GestaoEquipamentos", desc: "Cadastrar, editar e remover equipamentos", permissao: "OPERADOR", precisaPelotao: true },
        { id: 2, nome: "GESTÃO DE PELOTÕES", icone: "people", cor: "#00838F", rota: "GestaoPelotao", desc: "Gerenciar soldados e organizações", permissao: "OPERADOR", precisaPelotao: false },
        { id: 3, nome: "CONTROLE DE INSUMOS", icone: "stats-chart", cor: "#AD1457", rota: "ControleInsumos", desc: "Entrada, saída e alertas de estoque", permissao: "OPERADOR", precisaPelotao: false },
        { id: 4, nome: "RELATÓRIOS", icone: "document-text", cor: "#2E7D32", rota: "Relatorios", desc: "Relatórios gerenciais por período", permissao: "OPERADOR", precisaPelotao: false },
        { id: 5, nome: "CADASTRO DE USUÁRIOS", icone: "person-add", cor: "#D32F2F", rota: "CadastroUsuario", desc: "Registrar novos militares (Admin apenas)", permissao: "ADMINISTRADOR", precisaPelotao: false },
        { id: 6, nome: "GERENCIAR USUÁRIOS", icone: "people", cor: "#9C27B0", rota: "GerenciarUsuarios", desc: "Gerenciar perfis e permissões (Admin apenas)", permissao: "ADMINISTRADOR", precisaPelotao: false },
        { id: 7, nome: "REGISTRO DE ATIVIDADES", icone: "time", cor: "#FF6B00", rota: "Atividades", desc: "Visualizar histórico de ações dos usuários (Admin apenas)", permissao: "ADMINISTRADOR", precisaPelotao: false},
    ];

    const handleModuloPress = async (modulo) => {
        if (modulo.permissao === 'ADMINISTRADOR' && usuarioPerfil !== 'ADMINISTRADOR') {
            mostrarModalSemPermissao(modulo.nome);
            return;
        }
        
        await registrarAtividade('Acessar Módulo', `Acessou o módulo: ${modulo.nome}`, TIPO_ATIVIDADE.CONSULTA);
        
        if (modulo.precisaPelotao) {
            mostrarModalSelecionarPelotao(modulo);
        } else {
            navigation.navigate(modulo.rota);
        }
    };

    const handlePelotaoSelecionado = async (pelotao) => {
        await registrarAtividade('Consultar Pelotão', `Consultou equipamentos do ${pelotao.nome}`, TIPO_ATIVIDADE.CONSULTA);
        setModalPelotaoVisible(false);
        if (moduloSelecionado) {
            navigation.navigate(moduloSelecionado.rota, {
                tipoPelotao: pelotao.tipo,
                nomePelotao: pelotao.nome
            });
        }
        setModuloSelecionado(null);
    };

    const handlePelotaoCardPress = (pelotao) => {
        navigation.navigate("GestaoEquipamentos", {
            tipoPelotao: pelotao.tipo,
            nomePelotao: pelotao.nome
        });
    };

    const nomeExibicao = usuarioNome.trim().split(/\s+/)[1] || '';

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Ionicons name="shield" size={32} color="#FFD700" />
                    <Text style={styles.headerTitle}>SGM-{VERSAO_ATUAL}</Text>
                </View>
                <View style={styles.userInfo}>
                    <Ionicons name="person-circle" size={24} color="#FFD700" />
                    <Text style={styles.userName}>
                        {usuarioPatente} {nomeExibicao}
                    </Text>
                    <View style={[styles.perfilBadge, usuarioPerfil === 'ADMINISTRADOR' ? styles.adminBadge : styles.operadorBadge]}>
                        <Text style={styles.perfilBadgeText}>{usuarioPerfil === 'ADMINISTRADOR' ? 'ADMIN' : 'OPERADOR'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('PerfilUsuario')} style={styles.profileButton}>
                        <Ionicons name="settings" size={20} color="#FFD700" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <Ionicons name="log-out" size={20} color="#FFD700" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* secao dos menus antigos.
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>PELOTÕES</Text>
                <Text style={styles.sectionSubtitle}>Selecione um pelotão para gestão de equipamentos</Text>

                <View style={styles.pelotoesGrid}>
                    {pelotoes.map((pelotao) => (
                        <TouchableOpacity
                            key={pelotao.id}
                            style={[styles.pelotaoCard, { backgroundColor: pelotao.cor }]}
                            onPress={() => handlePelotaoCardPress(pelotao)}
                        >
                            <Icon path={pelotao.icone} size={3} color="#FFD700" />
                            <Text style={styles.pelotaoNome}>{pelotao.nome}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>*/}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>MÓDULOS DO SISTEMA</Text>
                <Text style={styles.sectionSubtitle}>Funcionalidades administrativas</Text>

                <View style={styles.modulosList}>
                    {modulos.map((modulo) => (
                        <TouchableOpacity
                            key={modulo.id}
                            style={styles.moduloCard}
                            onPress={() => handleModuloPress(modulo)}
                        >
                            <View style={[styles.moduloIcone, { backgroundColor: modulo.cor }]}>
                                <Ionicons name={modulo.icone} size={28} color="#fff" />
                            </View>
                            <View style={styles.moduloInfo}>
                                <Text style={styles.moduloNome}>{modulo.nome}</Text>
                                <Text style={styles.moduloDesc}>{modulo.desc}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#FFD700" />
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>SGM - {VERSAO_ATUAL} © 2026 - Exército Brasileiro</Text>
                <Text style={styles.footerSubtext}>Sistema de Gestão Militar Integrada</Text>
            </View>

            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Ionicons name="lock-closed" size={50} color="#F44336" />
                        <Text style={styles.modalTitle}>{modalTitulo}</Text>
                        <Text style={styles.modalText}>{modalMensagem}</Text>
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.modalButtonText}>ENTENDI</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent={true}
                visible={modalPelotaoVisible}
                animationType="fade"
                onRequestClose={() => setModalPelotaoVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainerPelotao}>
                        <Ionicons name="cube" size={50} color="#FFD700" />
                        <Text style={styles.modalPelotaoTitle}>Selecione o Pelotão</Text>
                        <Text style={styles.modalPelotaoText}>Escolha o pelotão para gerenciar equipamentos</Text>

                        <View style={styles.modalPelotoesList}>
                            {pelotoes.map((pelotao) => (
                                <TouchableOpacity
                                    key={pelotao.id}
                                    style={[styles.modalPelotaoOption, { backgroundColor: pelotao.cor }]}
                                    onPress={() => handlePelotaoSelecionado(pelotao)}
                                >
                                    <MaterialCommunityIcons name={pelotao.icone} size={48} color="#FFD700" />
                                    <Text style={styles.modalPelotaoOptionText}>{pelotao.nome}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => {
                                setModalPelotaoVisible(false);
                                setModuloSelecionado(null);
                            }}
                        >
                            <Text style={styles.modalCancelButtonText}>CANCELAR</Text>
                        </TouchableOpacity>
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
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
        fontFamily: 'serif',
        letterSpacing: 2,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        flexWrap: 'wrap',
    },
    userName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    perfilBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    adminBadge: {
        backgroundColor: '#D32F2F',
    },
    operadorBadge: {
        backgroundColor: '#2E7D32',
    },
    perfilBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    profileButton: {
        padding: 5,
    },
    logoutButton: {
        padding: 5,
    },
    section: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFD700',
        textAlign: 'center',
        marginBottom: 5,
        letterSpacing: 1,
    },
    sectionSubtitle: {
        fontSize: 12,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    pelotoesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 15,
    },
    pelotaoCard: {
        width: (width - 100) / 2,
        padding: 20,
        borderRadius: 15,
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    pelotaoNome: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modulosList: {
        gap: 12,
    },
    moduloCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a4a2a',
        borderRadius: 15,
        padding: 15,
        gap: 15,
        borderWidth: 1,
        borderColor: '#FFD700',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    moduloIcone: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moduloInfo: {
        flex: 1,
    },
    moduloNome: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    moduloDesc: {
        color: '#ccc',
        fontSize: 12,
    },
    footer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#0a2a0a',
        borderTopWidth: 1,
        borderTopColor: '#FFD700',
        marginTop: 20,
    },
    footerText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    footerSubtext: {
        color: '#fff',
        fontSize: 10,
        fontStyle: 'italic',
        marginTop: 5,
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
        width: '80%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F44336',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#F44336',
        marginTop: 15,
        marginBottom: 10,
    },
    modalText: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: '#F44336',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: 10,
    },
    modalButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalContainerPelotao: {
        backgroundColor: '#2a4a2a',
        padding: 25,
        borderRadius: 20,
        width: '85%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    modalPelotaoTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFD700',
        marginTop: 15,
        marginBottom: 5,
    },
    modalPelotaoText: {
        fontSize: 12,
        color: '#ccc',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalPelotoesList: {
        width: '100%',
        gap: 10,
        marginBottom: 20,
    },
    modalPelotaoOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 15,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    modalPelotaoOptionText: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: 'bold',
    },
    modalCancelButton: {
        backgroundColor: '#555',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    modalCancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
});