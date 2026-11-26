import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';
import { registrarAtividade, TIPO_ATIVIDADE } from '../Services/AtividadeService';
import { API } from "../../config/api";

const PATENTES_EXERCITO = [
    "General de Exército", "General de Divisão", "General de Brigada", "Coronel",
    "Tenente-Coronel", "Major", "Capitão", "1º Tenente", "2º Tenente",
    "Aspirante a Oficial", "Subtenente", "1º Sargento", "2º Sargento",
    "3º Sargento", "Cabo", "Soldado"
];

const FUNCOES_POR_PATENTE = {
    "General de Exército": ["Comandante do Exército", "Chefe do Estado-Maior"],
    "General de Divisão": ["Comandante de Divisão", "Diretor de Logística"],
    "General de Brigada": ["Comandante de Brigada", "Chefe de Gabinete"],
    "Coronel": ["Comandante de Regimento", "Chefe de Estado-Maior", "Oficial de Operações"],
    "Tenente-Coronel": ["Comandante de Batalhão", "Subcomandante", "Oficial de Inteligência"],
    "Major": ["Chefe de Seção", "Oficial de Comunicações", "Adjunto de Comando"],
    "Capitão": ["Comandante de Companhia", "Instrutor", "Oficial de Material"],
    "1º Tenente": ["Comandante de Pelotão", "Instrutor de Tiro", "Oficial de Comunicações"],
    "2º Tenente": ["Comandante de Pelotão", "Auxiliar de Estado-Maior"],
    "Aspirante a Oficial": ["Instrutor Auxiliar", "Oficial de Dia", "Adjunto de Pelotão"],
    "Subtenente": ["Adjunto de Comando", "Chefe de Seção", "Instrutor"],
    "1º Sargento": ["Chefe de Peça", "Instrutor de Tiro", "Monitor", "Adjunto de Pelotão"],
    "2º Sargento": ["Instrutor de Tiro", "Monitor", "Chefe de Equipe"],
    "3º Sargento": ["Instrutor de Tiro", "Monitor", "Comandante de Esquadra"],
    "Cabo": ["Atirador", "Motorista", "Auxiliar de Peça", "Sentinela"],
    "Soldado": ["Atirador", "Motorista", "Auxiliar de Cozinha", "Sentinela", "Auxiliar de Saúde"]
};

export default function GestaoPelotao({ navigation }) {
    const [soldados, setSoldados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editando, setEditando] = useState(null);
    const [usuarioPerfil, setUsuarioPerfil] = useState('');
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [itemParaExcluir, setItemParaExcluir] = useState(null);
    const [mensagemModalVisible, setMensagemModalVisible] = useState(false);
    const [mensagemTitulo, setMensagemTitulo] = useState('');
    const [mensagemTexto, setMensagemTexto] = useState('');
    const [patenteModalVisible, setPatenteModalVisible] = useState(false);
    const [funcaoModalVisible, setFuncaoModalVisible] = useState(false);
    
    const [nome, setNome] = useState('');
    const [identificador, setIdentificador] = useState('');
    const [patente, setPatente] = useState('');
    const [pelotao, setPelotao] = useState('SELVA');
    const [funcao, setFuncao] = useState('');
    const [dataIngresso, setDataIngresso] = useState('');
    const [status, setStatus] = useState('ATIVO');

    const mostrarMensagem = (titulo, texto) => {
        setMensagemTitulo(titulo);
        setMensagemTexto(texto);
        setMensagemModalVisible(true);
        setTimeout(() => setMensagemModalVisible(false), 2000);
    };

    useEffect(() => {
        const fetchUserPerfil = async () => {
            const perfil = await AsyncStorage.getItem('usuarioPerfil');
            setUsuarioPerfil(perfil);
        };
        fetchUserPerfil();
        carregarSoldados();
    }, []);

    const carregarSoldados = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API.soldado);
            const dadosOrdenados = response.data.sort((a,b) => b.id - a.id);
            setSoldados(dadosOrdenados);
        } catch (error) {
            console.error('Erro ao carregar soldados:', error);
            const mockSoldados = [
                { id: 1, nome: "João Silva", identificador: "202500000000001", patente: "Capitão", pelotao: "SELVA", funcao: "Comandante de Companhia", dataIngresso: "2020-01-15", status: "ATIVO" },
                { id: 2, nome: "Carlos Souza", identificador: "202500000000002", patente: "Tenente", pelotao: "TANQUE", funcao: "Oficial de Operações", dataIngresso: "2021-03-10", status: "ATIVO" },
                { id: 3, nome: "Roberto Lima", identificador: "202500000000003", patente: "Sargento", pelotao: "JEEP", funcao: "Instrutor", dataIngresso: "2019-07-22", status: "LICENCA" },
            ];
            setSoldados(mockSoldados);
        } finally {
            setLoading(false);
        }
    };

    const limparFormulario = () => {
        setNome('');
        setIdentificador('');
        setPatente('');
        setPelotao('SELVA');
        setFuncao('');
        setDataIngresso('');
        setStatus('ATIVO');
        setEditando(null);
    };

    const abrirModalCadastro = () => {
        limparFormulario();
        setModalVisible(true);
    };

    const abrirModalEdicao = (item) => {
        setEditando(item);
        setNome(item.nome);
        setIdentificador(item.identificador);
        setPatente(item.patente);
        setPelotao(item.pelotao);
        setFuncao(item.funcao);
        setDataIngresso(item.dataIngresso);
        setStatus(item.status);
        setModalVisible(true);
    };

    const handleExcluir = (item) => {
        setItemParaExcluir(item);
        setDeleteModalVisible(true);
    };

    const confirmarExclusao = async () => {
        if (!itemParaExcluir) return;
        setDeleteModalVisible(false);
        
        try {
            await axios.delete(`${API.soldado}/${itemParaExcluir.id}`);
            await registrarAtividade('Excluir Soldado', `Excluiu soldado: ${itemParaExcluir.nome} (${itemParaExcluir.patente})`, TIPO_ATIVIDADE.EXCLUSAO);

            mostrarMensagem('Sucesso', 'Soldado excluído com sucesso!');
            carregarSoldados();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            const novosSoldados = soldados.filter(s => s.id !== itemParaExcluir.id);
            setSoldados(novosSoldados);
            mostrarMensagem('Sucesso', 'Soldado excluído localmente!');
        }
        setItemParaExcluir(null);
    };

    const handleSalvar = async () => {
        if (!nome || !identificador || !patente || !pelotao) {
            mostrarMensagem('Atenção', 'Preencha os campos obrigatórios: Nome, Identificador, Patente e Pelotão');
            return;
        }

        setLoading(true);
        
        const soldadoData = {
            nome: nome,
            identificador: identificador,
            patente: patente,
            pelotao: pelotao,
            funcao: funcao || null,
            dataIngresso: dataIngresso || new Date().toISOString().split('T')[0],
            status: status
        };

        try {
            if (editando) {
                await axios.put(`${API.soldado}/${editando.id}`, soldadoData);
                await registrarAtividade('Editar Soldado', `Editou soldado: ${nome} (${patente})`, TIPO_ATIVIDADE.EDICAO);
                mostrarMensagem('Sucesso', 'Soldado atualizado com sucesso!');
            } else {
                await axios.post(API.soldado, soldadoData);
                await registrarAtividade('Cadastrar Soldado', `Cadastrou soldado: ${nome} (${patente})`, TIPO_ATIVIDADE.CADASTRO);
                mostrarMensagem('Sucesso', 'Soldado cadastrado com sucesso!');
            }
            setModalVisible(false);
            limparFormulario();
            carregarSoldados();
        } catch (error) {
            console.error('Erro ao salvar soldado:', error);
            mostrarMensagem('Erro', 'Não foi possível salvar o soldado');
        } finally {
            setLoading(false);
        }
    };

    const getPelotaoIcon = (pelotao) => {
        switch (pelotao) {
            case 'SELVA': return 'leaf';
            case 'TANQUE': return 'car';
            case 'JEEP': return 'car-sport';
            case 'PARAQUEDISTA': return 'airplane';
            default: return 'people';
        }
    };

    const getPelotaoColor = (pelotao) => {
        switch (pelotao) {
            case 'SELVA': return '#2E7D32';
            case 'TANQUE': return '#5D4037';
            case 'JEEP': return '#1565C0';
            case 'PARAQUEDISTA': return '#6A1B9A';
            default: return '#757575';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ATIVO': return '#4CAF50';
            case 'LICENCA': return '#FF9800';
            case 'INATIVO': return '#F44336';
            default: return '#757575';
        }
    };

    const renderSoldado = ({ item }) => (
        <View style={styles.soldadoCard}>
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                    <View style={[styles.pelotaoBadge, { backgroundColor: getPelotaoColor(item.pelotao) }]}>
                        <Ionicons name={getPelotaoIcon(item.pelotao)} size={14} color="#FFD700" />
                        <Text style={styles.pelotaoBadgeText}>{item.pelotao}</Text>
                    </View>
                    <Text style={styles.soldadoNome}>{item.nome}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>
            
            <View style={styles.cardInfo}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Identificador:</Text>
                    <Text style={styles.infoValue}>{item.identificador}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Patente:</Text>
                    <Text style={styles.infoValue}>{item.patente}</Text>
                </View>
                {item.funcao && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Função:</Text>
                        <Text style={styles.infoValue}>{item.funcao}</Text>
                    </View>
                )}
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Ingresso:</Text>
                    <Text style={styles.infoValue}>{item.dataIngresso}</Text>
                </View>
            </View>
            
            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editButton} onPress={() => abrirModalEdicao(item)}>
                    <Ionicons name="create" size={16} color="#fff" />
                    <Text style={styles.actionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleExcluir(item)}>
                    <Ionicons name="trash" size={16} color="#fff" />
                    <Text style={styles.actionText}>Excluir</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const pelotoes = [
        { id: 'SELVA', nome: 'Pelotão Selva', icone: 'leaf' },
        { id: 'TANQUE', nome: 'Pelotão Tanque', icone: 'car' },
        { id: 'JEEP', nome: 'Pelotão Jeep', icone: 'car-sport' },
        { id: 'PARAQUEDISTA', nome: 'Pelotão Paraquedista', icone: 'airplane' },
    ];

    const funcoesDisponiveis = patente ? (FUNCOES_POR_PATENTE[patente] || []) : [];

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
                <View style={styles.headerTop}>
                    <Ionicons name="people" size={32} color="#FFD700" />
                    <Text style={styles.headerTitle}>Gestão de Pelotões</Text>
                </View>
                <Text style={styles.headerSubtitle}>Gerenciar soldados e militares</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{soldados.length}</Text>
                        <Text style={styles.statLabel}>Total de Soldados</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {soldados.filter(s => s.status === 'ATIVO').length}
                        </Text>
                        <Text style={styles.statLabel}>Ativos</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {soldados.filter(s => s.status === 'LICENCA').length}
                        </Text>
                        <Text style={styles.statLabel}>Licença</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {soldados.filter(s => s.status === 'INATIVO').length}
                        </Text>
                        <Text style={styles.statLabel}>Inativo</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.addButton} onPress={abrirModalCadastro}>
                    <Ionicons name="add" size={24} color="#0a2a0a" />
                    <Text style={styles.addButtonText}>NOVO SOLDADO</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.atribuirButton}
                    onPress={() => navigation.navigate('AtribuirEquipamento')}
                >
                    <Ionicons name="link" size={22} color="#FFD700" />
                    <Text style={styles.atribuirButtonText}>ATRIBUIR EQUIPAMENTOS</Text>
                </TouchableOpacity>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Ionicons name="refresh-circle" size={40} color="#FFD700" />
                        <Text style={styles.loadingText}>Carregando soldados...</Text>
                    </View>
                ) : soldados.length > 0 ? (
                    <FlatList
                        data={soldados}
                        renderItem={renderSoldado}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        style={styles.lista}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="people-outline" size={60} color="#FFD700" />
                        <Text style={styles.emptyTitle}>Nenhum soldado cadastrado</Text>
                        <Text style={styles.emptyText}>
                            Clique em "NOVO SOLDADO" para começar
                        </Text>
                    </View>
                )}
            </View>

            {/* Modal de Cadastro/Edição */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modalContainer} contentContainerStyle={{ padding: 20 }}>
                        <Text style={styles.modalTitle}>
                            {editando ? 'EDITAR SOLDADO' : 'NOVO SOLDADO'}
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Nome Completo *</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={nome}
                                onChangeText={setNome}
                                placeholder="Ex: João Silva"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Identificador *</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={identificador}
                                onChangeText={setIdentificador}
                                placeholder="Ex: 202500000000001"
                                placeholderTextColor="#888"
                                keyboardType="numeric"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Patente *</Text>
                            <TouchableOpacity 
                                style={[styles.modalInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]} 
                                onPress={() => setPatenteModalVisible(true)}
                            >
                                <Text style={{ color: patente ? '#fff' : '#888', fontSize: 14 }}>
                                    {patente ? patente : "Selecione a patente"}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#FFD700" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Função</Text>
                            <TouchableOpacity 
                                style={[styles.modalInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', opacity: patente ? 1 : 0.6 }]} 
                                onPress={() => {
                                    if (!patente) {
                                        mostrarMensagem('Atenção', 'Selecione uma patente primeiro.');
                                        return;
                                    }
                                    setFuncaoModalVisible(true);
                                }}
                            >
                                <Text style={{ color: funcao ? '#fff' : '#888', fontSize: 14 }}>
                                    {funcao ? funcao : (patente ? "Selecione a função" : "Selecione a patente primeiro")}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#FFD700" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Pelotão *</Text>
                            <View style={styles.pelotaoContainer}>
                                {pelotoes.map((p) => (
                                    <TouchableOpacity
                                        key={p.id}
                                        style={[styles.pelotaoOption, pelotao === p.id && styles.pelotaoOptionSelected]}
                                        onPress={() => setPelotao(p.id)}
                                    >
                                        <Ionicons name={p.icone} size={20} color={pelotao === p.id ? "#0a2a0a" : "#FFD700"} />
                                        <Text style={[styles.pelotaoOptionText, pelotao === p.id && styles.pelotaoOptionTextSelected]}>
                                            {p.nome}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Data de Ingresso</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={dataIngresso}
                                onChangeText={setDataIngresso}
                                placeholder="AAAA-MM-DD"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Status</Text>
                            <View style={styles.statusContainer}>
                                <TouchableOpacity 
                                    style={[styles.statusOption, status === 'ATIVO' && styles.statusOptionSelected]}
                                    onPress={() => setStatus('ATIVO')}
                                >
                                    <Text style={[styles.statusOptionText, status === 'ATIVO' && styles.statusOptionTextSelected]}>Ativo</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.statusOption, status === 'LICENCA' && styles.statusOptionSelected]}
                                    onPress={() => setStatus('LICENCA')}
                                >
                                    <Text style={[styles.statusOptionText, status === 'LICENCA' && styles.statusOptionTextSelected]}>Licença</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.statusOption, status === 'INATIVO' && styles.statusOptionSelected]}
                                    onPress={() => setStatus('INATIVO')}
                                >
                                    <Text style={[styles.statusOptionText, status === 'INATIVO' && styles.statusOptionTextSelected]}>Inativo</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => {
                                setModalVisible(false);
                                limparFormulario();
                            }}>
                                <Text style={styles.buttonText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSalvar} disabled={loading}>
                                <Text style={styles.saveButtonText}>{loading ? 'SALVANDO...' : 'SALVAR'}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* Modal de Patente */}
            <Modal
                transparent={true}
                visible={patenteModalVisible}
                animationType="slide"
                onRequestClose={() => setPatenteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.patenteModalContainer}>
                        <View style={styles.patenteModalHeader}>
                            <Text style={styles.modalTitle}>Selecione a Patente</Text>
                            <TouchableOpacity onPress={() => setPatenteModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFD700" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={PATENTES_EXERCITO}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.patenteItem}
                                    onPress={() => {
                                        setPatente(item);
                                        setFuncao(''); // Limpa a função ao trocar de patente
                                        setPatenteModalVisible(false);
                                    }}
                                >
                                    <Text style={[styles.patenteItemText, patente === item && { color: '#FFD700', fontWeight: 'bold' }]}>
                                        {item}
                                    </Text>
                                    {patente === item && <Ionicons name="checkmark" size={20} color="#FFD700" />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Modal de Função */}
            <Modal
                transparent={true}
                visible={funcaoModalVisible}
                animationType="slide"
                onRequestClose={() => setFuncaoModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.patenteModalContainer}>
                        <View style={styles.patenteModalHeader}>
                            <Text style={styles.modalTitle}>Selecione a Função</Text>
                            <TouchableOpacity onPress={() => setFuncaoModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFD700" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={funcoesDisponiveis}
                            keyExtractor={(item) => item}
                            ListEmptyComponent={<Text style={{color: '#fff', textAlign: 'center', marginTop: 20}}>Nenhuma função disponível para esta patente.</Text>}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.patenteItem}
                                    onPress={() => {
                                        setFuncao(item);
                                        setFuncaoModalVisible(false);
                                    }}
                                >
                                    <Text style={[styles.patenteItemText, funcao === item && { color: '#FFD700', fontWeight: 'bold' }]}>
                                        {item}
                                    </Text>
                                    {funcao === item && <Ionicons name="checkmark" size={20} color="#FFD700" />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Modal de Exclusão */}
            <Modal
                transparent={true}
                visible={deleteModalVisible}
                animationType="fade"
                onRequestClose={() => setDeleteModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalConfirmContainer}>
                        <Ionicons name="trash" size={50} color="#F44336" />
                        <Text style={styles.modalConfirmTitle}>Confirmar Exclusão</Text>
                        <Text style={styles.modalConfirmText}>
                            Deseja realmente excluir o soldado "{itemParaExcluir?.nome}"?
                        </Text>
                        <View style={styles.modalConfirmButtons}>
                            <TouchableOpacity style={[styles.modalConfirmButton, styles.cancelConfirmButton]} onPress={() => setDeleteModalVisible(false)}>
                                <Text style={styles.cancelConfirmButtonText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalConfirmButton, styles.confirmDeleteButton]} onPress={confirmarExclusao}>
                                <Text style={styles.confirmDeleteButtonText}>EXCLUIR</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de Mensagem */}
            <Modal
                transparent={true}
                visible={mensagemModalVisible}
                animationType="fade"
                onRequestClose={() => setMensagemModalVisible(false)}
            >
                <View style={styles.modalMensagemOverlay}>
                    <View style={styles.modalMensagemContainer}>
                        <Ionicons name={mensagemTitulo === 'Sucesso' ? 'checkmark-circle' : 'warning'} size={50} color={mensagemTitulo === 'Sucesso' ? '#4CAF50' : '#FF9800'} />
                        <Text style={styles.modalMensagemTitle}>{mensagemTitulo}</Text>
                        <Text style={styles.modalMensagemText}>{mensagemTexto}</Text>
                        <TouchableOpacity style={styles.modalMensagemButton} onPress={() => setMensagemModalVisible(false)}>
                            <Text style={styles.modalMensagemButtonText}>OK</Text>
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
        marginBottom: 10,
    },
    addButtonText: {
        color: '#0a2a0a',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    atribuirButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 25,
        marginBottom: 20,
        backgroundColor: '#1a3a1a',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    atribuirButtonText: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    lista: {
        marginBottom: 20,
    },
    soldadoCard: {
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
        gap: 10,
        flex: 1,
        flexWrap: 'wrap',
    },
    pelotaoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pelotaoBadgeText: {
        color: '#FFD700',
        fontSize: 10,
        fontWeight: 'bold',
    },
    soldadoNome: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FFD700',
        flex: 1,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    statusText: {
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
        flexWrap: 'wrap',
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
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#2196F3',
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
    emptyText: {
        fontSize: 14,
        color: '#ccc',
        textAlign: 'center',
        marginTop: 10,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(10, 42, 10, 0.95)',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#2a4a2a',
        margin: 20,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFD700',
        textAlign: 'center',
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 5,
    },
    modalInput: {
        backgroundColor: '#1a3a1a',
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 10,
        padding: 12,
        color: '#fff',
        fontSize: 14,
    },
    pelotaoContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    pelotaoOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1a3a1a',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    pelotaoOptionSelected: {
        backgroundColor: '#FFD700',
    },
    pelotaoOptionText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
    },
    pelotaoOptionTextSelected: {
        color: '#0a2a0a',
    },
    statusContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    statusOption: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#1a3a1a',
        borderWidth: 1,
        borderColor: '#FFD700',
        alignItems: 'center',
    },
    statusOptionSelected: {
        backgroundColor: '#FFD700',
    },
    statusOptionText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusOptionTextSelected: {
        color: '#0a2a0a',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
        marginBottom: 10,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 25,
        alignItems: 'center',
    },
    saveButton: {
        backgroundColor: '#FFD700',
    },
    cancelButton: {
        backgroundColor: '#555',
    },
    saveButtonText: {
        color: '#0a2a0a',
        fontSize: 14,
        fontWeight: 'bold',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
    },
    modalConfirmContainer: {
        backgroundColor: '#2a4a2a',
        padding: 25,
        borderRadius: 20,
        width: '85%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#F44336',
        alignSelf: 'center',
    },
    modalConfirmTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#F44336',
        marginTop: 15,
        marginBottom: 10,
    },
    modalConfirmText: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalConfirmButtons: {
        flexDirection: 'row',
        gap: 15,
        width: '100%',
    },
    modalConfirmButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 25,
        alignItems: 'center',
    },
    cancelConfirmButton: {
        backgroundColor: '#555',
    },
    confirmDeleteButton: {
        backgroundColor: '#F44336',
    },
    cancelConfirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    confirmDeleteButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
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
        width: '80%',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    modalMensagemTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFD700',
        marginTop: 15,
        marginBottom: 5,
    },
    modalMensagemText: {
        fontSize: 14,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalMensagemButton: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 25,
    },
    modalMensagemButtonText: {
        color: '#0a2a0a',
        fontWeight: 'bold',
        fontSize: 14,
    },
    patenteModalContainer: {
        backgroundColor: '#2a4a2a',
        width: '90%',
        maxHeight: '80%',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFD700',
        padding: 20,
        alignSelf: 'center',
        marginTop: 'auto',
        marginBottom: 'auto',
    },
    patenteModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#FFD700',
        paddingBottom: 10,
    },
    patenteItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#3a5a3a',
    },
    patenteItemText: {
        fontSize: 16,
        color: '#fff',
    },
});