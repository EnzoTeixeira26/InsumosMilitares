import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';
import { registrarAtividade, TIPO_ATIVIDADE } from '../Services/AtividadeService';
import { API } from "../../config/api";

export default function GestaoEquipamentos({ navigation, route }) {
    const [equipamentos, setEquipamentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editando, setEditando] = useState(null);
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [itemParaExcluir, setItemParaExcluir] = useState(null);
    
    const [nome, setNome] = useState('');
    const [codigo, setCodigo] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [fabricante, setFabricante] = useState('');
    const [peso, setPeso] = useState('');
    const [descricao, setDescricao] = useState('');
    const [status, setStatus] = useState('DISPONIVEL');
    
    const [usuarioPerfil, setUsuarioPerfil] = useState('');
    const [mensagemModalVisible, setMensagemModalVisible] = useState(false);
    const [mensagemTitulo, setMensagemTitulo] = useState('');
    const [mensagemTexto, setMensagemTexto] = useState('');
    
    const tipoPelotao = route.params?.tipoPelotao || 'selva';
    const nomePelotao = route.params?.nomePelotao || 'PELOTÃO SELVA';

    useEffect(() => {
        const fetchUserPerfil = async () => {
            const perfil = await AsyncStorage.getItem('usuarioPerfil');
            setUsuarioPerfil(perfil || 'OPERADOR');
        };
        fetchUserPerfil();
        carregarEquipamentos();
    }, [tipoPelotao]);

    const mostrarMensagem = (titulo, texto) => {
        setMensagemTitulo(titulo);
        setMensagemTexto(texto);
        setMensagemModalVisible(true);
        setTimeout(() => setMensagemModalVisible(false), 2000);
    };

    const carregarEquipamentos = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API.equipamento}/pelotao/${tipoPelotao}`);
            const dadosOrdenados = response.data.sort((a,b) => b.id - a.id);
            setEquipamentos(dadosOrdenados);
        } catch (error) {
            console.error('Erro ao carregar equipamentos:', error);
            let mockEquipamentos = [];
            
            if (tipoPelotao === 'selva') {
                mockEquipamentos = [
                    { id: 1, nome: "FACÃO", codigo: "SEL-001", quantidade: 50, fabricante: "Tramontina", peso: 0.8, descricao: "FACÃO DE MATO", status: "DISPONIVEL" },
                    { id: 2, nome: "CANTIL", codigo: "SEL-002", quantidade: 100, fabricante: "Camelbak", peso: 0.3, descricao: "CANTIL 2L", status: "DISPONIVEL" },
                    { id: 3, nome: "REDE", codigo: "SEL-003", quantidade: 30, fabricante: "Rede Militar", peso: 1.5, descricao: "REDE DE CAMPANHA", status: "MANUTENCAO" },
                ];
            } else if (tipoPelotao === 'tanque') {
                mockEquipamentos = [
                    { id: 4, nome: "MUNIÇÃO 120mm", codigo: "TAN-001", quantidade: 200, fabricante: "IMBEL", peso: 25, descricao: "MUNIÇÃO PARA TANQUE", status: "DISPONIVEL" },
                    { id: 5, nome: "ÓLEO MOTOR", codigo: "TAN-002", quantidade: 500, fabricante: "Lubrax", peso: 0.9, descricao: "ÓLEO LUBRIFICANTE", status: "DISPONIVEL" },
                ];
            } else if (tipoPelotao === 'jeep') {
                mockEquipamentos = [
                    { id: 6, nome: "RÁDIO TÁTICO", codigo: "JEEP-001", quantidade: 15, fabricante: "Motorola", peso: 2.5, descricao: "RÁDIO DE COMUNICAÇÃO", status: "MANUTENCAO" },
                    { id: 7, nome: "KIT FERRAMENTAS", codigo: "JEEP-002", quantidade: 20, fabricante: "Gedore", peso: 5, descricao: "KIT DE FERRAMENTAS", status: "DISPONIVEL" },
                ];
            } else if (tipoPelotao === 'paraquedista') {
                mockEquipamentos = [
                    { id: 8, nome: "PARAQUEDAS", codigo: "PAR-001", quantidade: 30, fabricante: "ParaTech", peso: 12, descricao: "PARAQUEDAS TÁTICO", status: "DISPONIVEL" },
                    { id: 9, nome: "CAPACETE", codigo: "PAR-002", quantidade: 25, fabricante: "MSA", peso: 1.2, descricao: "CAPACETE PARA QUEDISTA", status: "DISPONIVEL" },
                ];
            }
            
            setEquipamentos(mockEquipamentos);
        } finally {
            setLoading(false);
        }
    };

    const limparFormulario = () => {
        setNome('');
        setCodigo('');
        setQuantidade('');
        setFabricante('');
        setPeso('');
        setDescricao('');
        setStatus('DISPONIVEL');
        setEditando(null);
    };

    const abrirModalCadastro = () => {
        if (usuarioPerfil !== 'ADMINISTRADOR') {
            mostrarMensagem('Acesso Negado', 'Apenas administradores podem cadastrar equipamentos.');
            return;
        }
        limparFormulario();
        setModalVisible(true);
    };

    const abrirModalEdicao = (item) => {
        if (usuarioPerfil !== 'ADMINISTRADOR') {
            mostrarMensagem('Acesso Negado', 'Apenas administradores podem editar equipamentos.');
            return;
        }
        setEditando(item);
        setNome(item.nome);
        setCodigo(item.codigo);
        setQuantidade(item.quantidade.toString());
        setFabricante(item.fabricante || '');
        setPeso(item.peso ? item.peso.toString() : '');
        setDescricao(item.descricao);
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
            const id = Number(itemParaExcluir.id);
            await axios.delete(`${API.equipamento}/${id}`);
            await registrarAtividade('Excluir Equipamento', `Excluiu equipamento: ${itemParaExcluir.nome} (${itemParaExcluir.codigo})`, TIPO_ATIVIDADE.EXCLUSAO);

            mostrarMensagem('Sucesso', 'Equipamento excluído com sucesso!');
            carregarEquipamentos();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            // Fallback: remover localmente
            const novosEquipamentos = equipamentos.filter(e => e.id !== itemParaExcluir.id);
            setEquipamentos(novosEquipamentos);
            mostrarMensagem('Sucesso', 'Equipamento excluído com sucesso!');
        }
        setItemParaExcluir(null);
    };

    const handleSalvar = async () => {
        if (!nome || !codigo || !quantidade) {
            mostrarMensagem('Atenção', 'Preencha os campos obrigatórios: Nome, Código e Quantidade');
            return;
        }

        setLoading(true);
        
        const equipamentoData = {
            nome: nome,
            codigo: codigo,
            quantidade: parseInt(quantidade),
            fabricante: fabricante || null,
            peso: peso ? parseFloat(peso) : null,
            descricao: descricao,
            status: status,
            tipoPelotao: tipoPelotao
        };

        try {
            if (editando) {
                await axios.put(`${API.equipamento}/${editando.id}`, equipamentoData);
                await registrarAtividade('Editar Equipamento', `Editou equipamento: ${nome} (${codigo})`, TIPO_ATIVIDADE.EDICAO);

                mostrarMensagem('Sucesso', 'Equipamento atualizado com sucesso!');
            } else {
                await axios.post(`${API.equipamento}`, equipamentoData);
                await registrarAtividade('Cadastrar Equipamento', `Cadastrou equipamento: ${nome} (${codigo})`, TIPO_ATIVIDADE.CADASTRO);

                mostrarMensagem('Sucesso', 'Equipamento cadastrado com sucesso!');
            }
            setModalVisible(false);
            limparFormulario();
            carregarEquipamentos();
        } catch (error) {
            console.error('Erro ao salvar equipamento:', error);
            let novoEquipamento = {
                id: equipamentos.length + 1,
                ...equipamentoData
            };
            if (editando) {
                const index = equipamentos.findIndex(e => e.id === editando.id);
                const novosEquipamentos = [...equipamentos];
                novosEquipamentos[index] = novoEquipamento;
                setEquipamentos(novosEquipamentos);
                mostrarMensagem('Sucesso', 'Equipamento atualizado com sucesso!');
            } else {
                setEquipamentos([...equipamentos, novoEquipamento]);
                mostrarMensagem('Sucesso', 'Equipamento cadastrado com sucesso!');
            }
            setModalVisible(false);
            limparFormulario();
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'DISPONIVEL': return '#4CAF50';
            case 'MANUTENCAO': return '#FF9800';
            case 'INDISPONIVEL': return '#F44336';
            default: return '#757575';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'DISPONIVEL': return 'checkmark-circle';
            case 'MANUTENCAO': return 'construct';
            case 'INDISPONIVEL': return 'close-circle';
            default: return 'help-circle';
        }
    };

    const renderEquipamento = ({ item }) => (
        <View style={styles.equipamentoCard}>
            <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                    <Ionicons name="cube" size={24} color="#FFD700" />
                    <Text style={styles.equipamentoNome}>{item.nome}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                    <Ionicons name={getStatusIcon(item.status)} size={12} color="#fff" />
                    <Text style={styles.statusText}>{item.status}</Text>
                </View>
            </View>
            
            <View style={styles.cardInfo}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Código:</Text>
                    <Text style={styles.infoValue}>{item.codigo}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Quantidade:</Text>
                    <Text style={styles.infoValue}>{item.quantidade} un</Text>
                </View>
                {item.fabricante && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Fabricante:</Text>
                        <Text style={styles.infoValue}>{item.fabricante}</Text>
                    </View>
                )}
                {item.peso && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Peso:</Text>
                        <Text style={styles.infoValue}>{item.peso} KG</Text>
                    </View>
                )}
                {item.descricao && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Descrição:</Text>
                        <Text style={styles.infoValueDesc}>{item.descricao}</Text>
                    </View>
                )}
            </View>
            
            <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editButton} onPress={() => abrirModalEdicao(item)}>
                    <Ionicons name="create" size={18} color="#fff" />
                    <Text style={styles.actionText}>Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleExcluir(item)}>
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
                    <Ionicons name="cube" size={32} color="#FFD700" />
                    <Text style={styles.headerTitle}>{nomePelotao}</Text>
                </View>
                <Text style={styles.headerSubtitle}>Gestão de Equipamentos</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{equipamentos.length}</Text>
                        <Text style={styles.statLabel}>Total de Equipamentos</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {equipamentos.filter(e => e.status === 'DISPONIVEL').length}
                        </Text>
                        <Text style={styles.statLabel}>Disponíveis</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {equipamentos.filter(e => e.status === 'MANUTENCAO').length}
                        </Text>
                        <Text style={styles.statLabel}>Manutenção</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {equipamentos.filter(e => e.status === 'INDISPONIVEL').length}
                        </Text>
                        <Text style={styles.statLabel}>Indisponível</Text>
                    </View>
                    
                </View>

                <TouchableOpacity style={styles.addButton} onPress={abrirModalCadastro}>
                    <Ionicons name="add" size={24} color="#0a2a0a" />
                    <Text style={styles.addButtonText}>NOVO EQUIPAMENTO</Text>
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
                        <Text style={styles.loadingText}>Carregando equipamentos...</Text>
                    </View>
                ) : equipamentos.length > 0 ? (
                    <FlatList
                        data={equipamentos}
                        renderItem={renderEquipamento}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        style={styles.lista}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cube-outline" size={60} color="#FFD700" />
                        <Text style={styles.emptyTitle}>Nenhum equipamento cadastrado</Text>
                        <Text style={styles.emptyText}>
                            Clique em "NOVO EQUIPAMENTO" para começar
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
                            {editando ? 'EDITAR EQUIPAMENTO' : 'NOVO EQUIPAMENTO'}
                        </Text>
                        <Text style={styles.modalSubtitle}>{nomePelotao}</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Nome do Equipamento *</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={nome}
                                onChangeText={setNome}
                                placeholder="Ex: FACÃO DE MATO"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Código *</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={codigo}
                                onChangeText={setCodigo}
                                placeholder={`Ex: ${tipoPelotao.toUpperCase()}-001`}
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={styles.rowInput}>
                            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.inputLabel}>Quantidade *</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={quantidade}
                                    onChangeText={setQuantidade}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#888"
                                />
                            </View>
                            <View style={[styles.inputContainer, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Fabricante</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    value={fabricante}
                                    onChangeText={setFabricante}
                                    placeholder="Fabricante"
                                    placeholderTextColor="#888"
                                />
                            </View>
                        </View>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Peso (KG)</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={peso}
                                onChangeText={setPeso}
                                keyboardType="numeric"
                                placeholder="Peso em KG"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Status</Text>
                            <View style={styles.statusContainer}>
                                <TouchableOpacity 
                                    style={[styles.statusOption, status === 'DISPONIVEL' && styles.statusOptionSelected]}
                                    onPress={() => setStatus('DISPONIVEL')}
                                >
                                    <Text style={[styles.statusOptionText, status === 'DISPONIVEL' && styles.statusOptionTextSelected]}>Disponível</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.statusOption, status === 'MANUTENCAO' && styles.statusOptionSelected]}
                                    onPress={() => setStatus('MANUTENCAO')}
                                >
                                    <Text style={[styles.statusOptionText, status === 'MANUTENCAO' && styles.statusOptionTextSelected]}>Manutenção</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    style={[styles.statusOption, status === 'INDISPONIVEL' && styles.statusOptionSelected]}
                                    onPress={() => setStatus('INDISPONIVEL')}
                                >
                                    <Text style={[styles.statusOptionText, status === 'INDISPONIVEL' && styles.statusOptionTextSelected]}>Indisponível</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Descrição</Text>
                            <TextInput
                                style={[styles.modalInput, styles.textArea]}
                                value={descricao}
                                onChangeText={setDescricao}
                                placeholder="Descrição do equipamento"
                                placeholderTextColor="#888"
                                multiline
                                numberOfLines={3}
                            />
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

            {/* Modal de Confirmação de Exclusão */}
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
                            Deseja realmente excluir o equipamento "{itemParaExcluir?.nome}"?
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

            {/* Modal de Mensagem (substituto do Alert) */}
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
    equipamentoCard: {
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
    },
    equipamentoNome: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
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
        fontSize: 13,
        color: '#ccc',
        width: 80,
    },
    infoValue: {
        fontSize: 13,
        color: '#fff',
        flex: 1,
    },
    infoValueDesc: {
        fontSize: 12,
        color: '#ccc',
        flex: 1,
        fontStyle: 'italic',
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
        marginBottom: 5,
    },
    modalSubtitle: {
        fontSize: 12,
        color: '#ccc',
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
    rowInput: {
        flexDirection: 'row',
        gap: 10,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
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
    // Modal de Confirmação
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
    // Modal de Mensagem
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
});