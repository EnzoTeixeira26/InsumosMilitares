import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList, RefreshControl } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';
import { registrarAtividade, TIPO_ATIVIDADE } from '../Services/AtividadeService';
import { API } from "../../config/api";

//const API_ATRIBUICAO = 'http://localhost:8080/api/v1/soldado-equipamento';
//const API_SOLDADO = 'http://localhost:8080/api/v1/soldado';
//const API_EQUIPAMENTO = 'http://localhost:8080/api/v1/equipamento';

export default function AtribuirEquipamento({ navigation }) {
    const [atribuicoes, setAtribuicoes] = useState([]);
    const [soldados, setSoldados] = useState([]);
    const [equipamentos, setEquipamentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [usuarioPerfil, setUsuarioPerfil] = useState('');
    const [usuarioId, setUsuarioId] = useState(null);

    // Modal de nova atribuição
    const [modalVisible, setModalVisible] = useState(false);
    const [soldadoSelecionado, setSoldadoSelecionado] = useState(null);
    const [equipamentoSelecionado, setEquipamentoSelecionado] = useState(null);
    const [quantidade, setQuantidade] = useState('1');
    const [observacao, setObservacao] = useState('');
    const [pickerSoldadoVisible, setPickerSoldadoVisible] = useState(false);
    const [pickerEquipamentoVisible, setPickerEquipamentoVisible] = useState(false);

    // Modal de exclusão específica
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [itemParaExcluir, setItemParaExcluir] = useState(null);

    // Modal de exclusão total do soldado
    const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
    const [soldadoParaLimpar, setSoldadoParaLimpar] = useState(null);

    // Modal de mensagem
    const [mensagemModalVisible, setMensagemModalVisible] = useState(false);
    const [mensagemTitulo, setMensagemTitulo] = useState('');
    const [mensagemTexto, setMensagemTexto] = useState('');

    // Filtros
    const [filtroSoldado, setFiltroSoldado] = useState('');
    const [filtroEquipamento, setFiltroEquipamento] = useState('');
    const [filtroPelotao, setFiltroPelotao] = useState('TODOS');
    const [filtroModalVisible, setFiltroModalVisible] = useState(false);

    const mostrarMensagem = (titulo, texto) => {
        setMensagemTitulo(titulo);
        setMensagemTexto(texto);
        setMensagemModalVisible(true);
        setTimeout(() => setMensagemModalVisible(false), 2000);
    };

    const carregarDados = async () => {
        setLoading(true);
        try {
            const [resAtrib, resSold, resEquip] = await Promise.all([
                axios.get(API.soldadoEquipamento),
                axios.get(API.soldado),
                axios.get(API.equipamento)
            ]);

            setAtribuicoes(resAtrib.data.sort((a, b) => b.idSoldadoEquipamento - a.idSoldadoEquipamento));
            setSoldados(resSold.data);
            setEquipamentos(resEquip.data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            mostrarMensagem('Erro', 'Não foi possível carregar os dados');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            const perfil = await AsyncStorage.getItem('usuarioPerfil');
            const id = await AsyncStorage.getItem('usuarioId');
            setUsuarioPerfil(perfil || 'OPERADOR');
            setUsuarioId(id ? parseInt(id) : null);
            carregarDados();
        };
        init();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await carregarDados();
        setRefreshing(false);
    }, []);

    const getSoldado = (id) => soldados.find(s => s.id === id);
    const getEquipamento = (id) => equipamentos.find(e => e.id === id);

    const abrirModalAtribuicao = () => {
        setSoldadoSelecionado(null);
        setEquipamentoSelecionado(null);
        setQuantidade('1');
        setObservacao('');
        setModalVisible(true);
    };

    const handleSalvar = async () => {
        if (!soldadoSelecionado || !equipamentoSelecionado) {
            mostrarMensagem('Atenção', 'Selecione um soldado e um equipamento');
            return;
        }

        const qtd = parseInt(quantidade);
        if (!qtd || qtd <= 0) {
            mostrarMensagem('Atenção', 'Informe uma quantidade válida');
            return;
        }

        setLoading(true);

        const atribuicaoData = {
            soldadoId: soldadoSelecionado.id,
            equipamentoId: equipamentoSelecionado.id,
            quantidade: qtd,
            observacao: observacao || null,
            usuarioId: usuarioId
        };

        try {
            // Verifica se já existia (para dar mensagem correta)
            const jaExistia = atribuicoes.some(
                a => a.soldadoId === soldadoSelecionado.id &&
                     a.equipamentoId === equipamentoSelecionado.id
            );

            await axios.post(API.soldadoEquipamento, atribuicaoData);
            await registrarAtividade(
                jaExistia ? 'Somar Quantidade de Equipamento' : 'Atribuir Equipamento',
                jaExistia
                    ? `Somou ${qtd}x "${equipamentoSelecionado.nome}" ao soldado ${soldadoSelecionado.nome}`
                    : `Atribuiu ${qtd}x "${equipamentoSelecionado.nome}" ao soldado ${soldadoSelecionado.nome}`,
                TIPO_ATIVIDADE.CADASTRO
            );

            mostrarMensagem(
                'Sucesso',
                jaExistia
                    ? `Quantidade somada! ${soldadoSelecionado.nome} agora tem mais ${qtd}x ${equipamentoSelecionado.nome}.`
                    : 'Equipamento atribuído com sucesso!'
            );
            setModalVisible(false);
            carregarDados();
        } catch (error) {
            console.error('Erro ao atribuir:', error);
            const msg = error.response?.data?.message || 'Não foi possível atribuir o equipamento';
            mostrarMensagem('Erro', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleExcluir = (item) => {
        setItemParaExcluir(item);
        setDeleteModalVisible(true);
    };

    const confirmarExclusao = async () => {
        if (!itemParaExcluir) return;
        setDeleteModalVisible(false);

        try {
            await axios.delete(`${API.soldadoEquipamento}/${itemParaExcluir.idSoldadoEquipamento}`);
            const sold = getSoldado(itemParaExcluir.soldadoId);
            const equip = getEquipamento(itemParaExcluir.equipamentoId);
            await registrarAtividade(
                'Remover Atribuição',
                `Removeu "${equip?.nome || 'equipamento'}" do soldado ${sold?.nome || 'soldado'}`,
                TIPO_ATIVIDADE.EXCLUSAO
            );

            mostrarMensagem('Sucesso', 'Atribuição removida com sucesso!');
            carregarDados();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            mostrarMensagem('Erro', 'Não foi possível remover a atribuição');
        }
        setItemParaExcluir(null);
    };

    // NOVO: remover todos os equipamentos de um soldado
    const handleExcluirTodos = (soldadoId) => {
        setSoldadoParaLimpar(soldadoId);
        setDeleteAllModalVisible(true);
    };

    const confirmarExclusaoTodos = async () => {
        if (!soldadoParaLimpar) return;
        setDeleteAllModalVisible(false);

        try {
            await axios.delete(`${API.soldadoEquipamento}/soldado/${soldadoParaLimpar}/todos`);
            const sold = getSoldado(soldadoParaLimpar);
            await registrarAtividade(
                'Remover Todos os Equipamentos',
                `Removeu todos os equipamentos do soldado ${sold?.nome || 'soldado'}`,
                TIPO_ATIVIDADE.EXCLUSAO
            );

            mostrarMensagem('Sucesso', 'Todos os equipamentos foram removidos!');
            carregarDados();
        } catch (error) {
            console.error('Erro ao remover todos:', error);
            mostrarMensagem('Erro', 'Não foi possível remover os equipamentos');
        }
        setSoldadoParaLimpar(null);
    };

    const limparFiltros = () => {
        setFiltroSoldado('');
        setFiltroEquipamento('');
        setFiltroPelotao('TODOS');
    };

    const atribuicoesFiltradas = () => {
        let lista = [...atribuicoes];

        if (filtroSoldado) {
            lista = lista.filter(a => a.soldadoId === parseInt(filtroSoldado));
        }
        if (filtroEquipamento) {
            lista = lista.filter(a => a.equipamentoId === parseInt(filtroEquipamento));
        }
        if (filtroPelotao !== 'TODOS') {
            lista = lista.filter(a => {
                const sold = getSoldado(a.soldadoId);
                return sold?.pelotao === filtroPelotao;
            });
        }
        return lista;
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

    const renderAtribuicao = ({ item }) => {
        const soldado = getSoldado(item.soldadoId);
        const equipamento = getEquipamento(item.equipamentoId);

        // Conta quantos equipamentos esse soldado tem no total
        const totalDoSoldado = atribuicoes.filter(a => a.soldadoId === item.soldadoId).length;

        return (
            <View style={styles.atribuicaoCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={[styles.pelotaoBadge, { backgroundColor: getPelotaoColor(soldado?.pelotao) }]}>
                            <Ionicons name="people" size={12} color="#FFD700" />
                            <Text style={styles.pelotaoBadgeText}>{soldado?.pelotao || '—'}</Text>
                        </View>
                        <Text style={styles.cardTitle}>{soldado?.nome || `Soldado #${item.soldadoId}`}</Text>
                    </View>
                </View>

                <View style={styles.cardInfo}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Equipamento:</Text>
                        <Text style={styles.infoValue}>{equipamento?.nome || `#${item.equipamentoId}`}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Código:</Text>
                        <Text style={styles.infoValue}>{equipamento?.codigo || '—'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Quantidade:</Text>
                        <Text style={[styles.infoValue, { color: '#FFD700', fontWeight: 'bold' }]}>
                            {item.quantidade} un
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Atribuído em:</Text>
                        <Text style={styles.infoValue}>
                            {item.dataAtribuicao ? new Date(item.dataAtribuicao).toLocaleString() : '—'}
                        </Text>
                    </View>
                    {item.observacao && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Observação:</Text>
                            <Text style={styles.infoValueDesc}>{item.observacao}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleExcluir(item)}
                    >
                        <Ionicons name="trash" size={16} color="#fff" />
                        <Text style={styles.actionText}>Remover Este</Text>
                    </TouchableOpacity>

                    {totalDoSoldado > 1 && (
                        <TouchableOpacity
                            style={styles.deleteAllButton}
                            onPress={() => handleExcluirTodos(item.soldadoId)}
                        >
                            <Ionicons name="trash-bin" size={16} color="#fff" />
                            <Text style={styles.actionText}>Remover Todos ({totalDoSoldado})</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const pelotoes = ['TODOS', 'SELVA', 'TANQUE', 'JEEP', 'PARAQUEDISTA'];

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ flexGrow: 1 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FFD700"]} />}
        >
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
                <View style={styles.headerTop}>
                    <Ionicons name="link" size={32} color="#FFD700" />
                    <Text style={styles.headerTitle}>Atribuir Equipamento</Text>
                </View>
                <Text style={styles.headerSubtitle}>Vincular equipamentos aos soldados</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{atribuicoes.length}</Text>
                        <Text style={styles.statLabel}>Atribuições</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {new Set(atribuicoes.map(a => a.soldadoId)).size}
                        </Text>
                        <Text style={styles.statLabel}>Soldados</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {new Set(atribuicoes.map(a => a.equipamentoId)).size}
                        </Text>
                        <Text style={styles.statLabel}>Equipamentos</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.addButton} onPress={abrirModalAtribuicao}>
                    <Ionicons name="add" size={24} color="#0a2a0a" />
                    <Text style={styles.addButtonText}>NOVA ATRIBUIÇÃO</Text>
                </TouchableOpacity>

                <View style={styles.filtroBar}>
                    <TouchableOpacity style={styles.filtroButton} onPress={() => setFiltroModalVisible(true)}>
                        <Ionicons name="filter" size={18} color="#FFD700" />
                        <Text style={styles.filtroButtonText}>Filtrar</Text>
                    </TouchableOpacity>
                    {(filtroSoldado || filtroEquipamento || filtroPelotao !== 'TODOS') && (
                        <TouchableOpacity style={styles.limparFiltroButton} onPress={limparFiltros}>
                            <Ionicons name="close-circle" size={16} color="#FF9800" />
                            <Text style={styles.limparFiltroText}>Limpar</Text>
                        </TouchableOpacity>
                    )}
                    <Text style={styles.contadorText}>{atribuicoesFiltradas().length} resultado(s)</Text>
                </View>

                {loading && atribuicoes.length === 0 ? (
                    <View style={styles.loadingContainer}>
                        <Ionicons name="refresh-circle" size={40} color="#FFD700" />
                        <Text style={styles.loadingText}>Carregando atribuições...</Text>
                    </View>
                ) : atribuicoesFiltradas().length > 0 ? (
                    <FlatList
                        data={atribuicoesFiltradas()}
                        renderItem={renderAtribuicao}
                        keyExtractor={(item) => item.idSoldadoEquipamento.toString()}
                        scrollEnabled={false}
                        style={styles.lista}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="link-outline" size={60} color="#FFD700" />
                        <Text style={styles.emptyTitle}>Nenhuma atribuição encontrada</Text>
                        <Text style={styles.emptyText}>
                            Clique em "NOVA ATRIBUIÇÃO" para vincular um equipamento a um soldado
                        </Text>
                    </View>
                )}
            </View>

            {/* Modal de Nova Atribuição */}
            <Modal transparent visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modalContainer} contentContainerStyle={{ padding: 20 }}>
                        <Text style={styles.modalTitle}>NOVA ATRIBUIÇÃO</Text>
                        <Text style={styles.modalSubtitle}>
                            Se o soldado já tiver este equipamento, a quantidade será somada
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Soldado *</Text>
                            <TouchableOpacity style={styles.selectInput} onPress={() => setPickerSoldadoVisible(true)}>
                                <Text style={soldadoSelecionado ? styles.selectText : styles.selectPlaceholder}>
                                    {soldadoSelecionado
                                        ? `${soldadoSelecionado.nome} (${soldadoSelecionado.pelotao})`
                                        : 'Selecione um soldado'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#FFD700" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Equipamento *</Text>
                            <TouchableOpacity style={styles.selectInput} onPress={() => setPickerEquipamentoVisible(true)}>
                                <Text style={equipamentoSelecionado ? styles.selectText : styles.selectPlaceholder}>
                                    {equipamentoSelecionado
                                        ? `${equipamentoSelecionado.nome} (${equipamentoSelecionado.codigo})`
                                        : 'Selecione um equipamento'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#FFD700" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Quantidade *</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={quantidade}
                                onChangeText={setQuantidade}
                                keyboardType="numeric"
                                placeholder="1"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Observação</Text>
                            <TextInput
                                style={[styles.modalInput, styles.textArea]}
                                value={observacao}
                                onChangeText={setObservacao}
                                placeholder="Motivo da atribuição (opcional)"
                                placeholderTextColor="#888"
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                                <Text style={styles.buttonText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSalvar} disabled={loading}>
                                <Text style={styles.saveButtonText}>{loading ? 'SALVANDO...' : 'ATRIBUIR'}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* Picker Soldado */}
            <Modal transparent visible={pickerSoldadoVisible} animationType="slide" onRequestClose={() => setPickerSoldadoVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerContainer}>
                        <Text style={styles.modalTitle}>Selecione o Soldado</Text>
                        <FlatList
                            data={soldados}
                            keyExtractor={(item) => item.id.toString()}
                            style={{ maxHeight: 400 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.pickerItem}
                                    onPress={() => {
                                        setSoldadoSelecionado(item);
                                        setPickerSoldadoVisible(false);
                                    }}
                                >
                                    <Text style={styles.pickerItemTitle}>{item.nome}</Text>
                                    <Text style={styles.pickerItemSub}>{item.patente} • {item.pelotao}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum soldado cadastrado</Text>}
                        />
                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setPickerSoldadoVisible(false)}>
                            <Text style={styles.buttonText}>FECHAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Picker Equipamento */}
            <Modal transparent visible={pickerEquipamentoVisible} animationType="slide" onRequestClose={() => setPickerEquipamentoVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerContainer}>
                        <Text style={styles.modalTitle}>Selecione o Equipamento</Text>
                        <FlatList
                            data={equipamentos}
                            keyExtractor={(item) => item.id.toString()}
                            style={{ maxHeight: 400 }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.pickerItem}
                                    onPress={() => {
                                        setEquipamentoSelecionado(item);
                                        setPickerEquipamentoVisible(false);
                                    }}
                                >
                                    <Text style={styles.pickerItemTitle}>{item.nome}</Text>
                                    <Text style={styles.pickerItemSub}>{item.codigo} • {item.tipoPelotao}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={<Text style={styles.emptyText}>Nenhum equipamento cadastrado</Text>}
                        />
                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setPickerEquipamentoVisible(false)}>
                            <Text style={styles.buttonText}>FECHAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal de Filtros */}
            <Modal transparent visible={filtroModalVisible} animationType="slide" onRequestClose={() => setFiltroModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <ScrollView style={styles.modalContainer} contentContainerStyle={{ padding: 20 }}>
                        <Text style={styles.modalTitle}>Filtrar Atribuições</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Soldado</Text>
                            <TouchableOpacity
                                style={styles.selectInput}
                                onPress={() => {
                                    setFiltroModalVisible(false);
                                    setPickerSoldadoVisible(true);
                                }}
                            >
                                <Text style={filtroSoldado ? styles.selectText : styles.selectPlaceholder}>
                                    {filtroSoldado
                                        ? (getSoldado(parseInt(filtroSoldado))?.nome || 'Selecionado')
                                        : 'Todos os soldados'}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#FFD700" />
                            </TouchableOpacity>
                            {filtroSoldado && (
                                <TouchableOpacity onPress={() => setFiltroSoldado('')}>
                                    <Text style={styles.clearLink}>Limpar seleção</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Pelotão</Text>
                            <View style={styles.pelotaoContainer}>
                                {pelotoes.map((p) => (
                                    <TouchableOpacity
                                        key={p}
                                        style={[styles.pelotaoOption, filtroPelotao === p && styles.pelotaoOptionSelected]}
                                        onPress={() => setFiltroPelotao(p)}
                                    >
                                        <Text style={[styles.pelotaoOptionText, filtroPelotao === p && styles.pelotaoOptionTextSelected]}>
                                            {p}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setFiltroModalVisible(false)}>
                                <Text style={styles.buttonText}>FECHAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={limparFiltros}>
                                <Text style={styles.saveButtonText}>LIMPAR</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* Modal de Confirmação de Exclusão Específica */}
            <Modal transparent visible={deleteModalVisible} animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalConfirmContainer}>
                        <Ionicons name="trash" size={50} color="#F44336" />
                        <Text style={styles.modalConfirmTitle}>Remover Este Equipamento</Text>
                        <Text style={styles.modalConfirmText}>
                            Deseja remover "{getEquipamento(itemParaExcluir?.equipamentoId)?.nome}" do soldado "{getSoldado(itemParaExcluir?.soldadoId)?.nome}"?
                        </Text>
                        <View style={styles.modalConfirmButtons}>
                            <TouchableOpacity style={[styles.modalConfirmButton, styles.cancelConfirmButton]} onPress={() => setDeleteModalVisible(false)}>
                                <Text style={styles.cancelConfirmButtonText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalConfirmButton, styles.confirmDeleteButton]} onPress={confirmarExclusao}>
                                <Text style={styles.confirmDeleteButtonText}>REMOVER</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de Confirmação de Exclusão TOTAL */}
            <Modal transparent visible={deleteAllModalVisible} animationType="fade" onRequestClose={() => setDeleteAllModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalConfirmContainer, { borderColor: '#D32F2F' }]}>
                        <Ionicons name="warning" size={50} color="#D32F2F" />
                        <Text style={styles.modalConfirmTitle}>Remover TODOS os Equipamentos</Text>
                        <Text style={styles.modalConfirmText}>
                            Tem certeza que deseja remover TODOS os equipamentos do soldado "{getSoldado(soldadoParaLimpar)?.nome}"?
                        </Text>
                        <Text style={styles.modalConfirmWarning}>
                            ⚠️ Esta ação não pode ser desfeita.
                        </Text>
                        <View style={styles.modalConfirmButtons}>
                            <TouchableOpacity style={[styles.modalConfirmButton, styles.cancelConfirmButton]} onPress={() => setDeleteAllModalVisible(false)}>
                                <Text style={styles.cancelConfirmButtonText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalConfirmButton, styles.confirmDeleteButton]} onPress={confirmarExclusaoTodos}>
                                <Text style={styles.confirmDeleteButtonText}>REMOVER TODOS</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de Mensagem */}
            <Modal transparent visible={mensagemModalVisible} animationType="fade" onRequestClose={() => setMensagemModalVisible(false)}>
                <View style={styles.modalMensagemOverlay}>
                    <View style={styles.modalMensagemContainer}>
                        <Ionicons
                            name={mensagemTitulo === 'Sucesso' ? 'checkmark-circle' : 'warning'}
                            size={50}
                            color={mensagemTitulo === 'Sucesso' ? '#4CAF50' : '#FF9800'}
                        />
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
    container: { flex: 1, backgroundColor: '#1a3a1a' },
    header: {
        backgroundColor: '#0a2a0a',
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderBottomWidth: 2,
        borderBottomColor: '#FFD700',
    },
    backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    backButtonText: { color: '#FFD700', fontSize: 14, marginLeft: 5 },
    headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700', fontFamily: 'serif', letterSpacing: 1 },
    headerSubtitle: { fontSize: 12, color: '#ccc', textAlign: 'center', marginTop: 5 },
    content: { flex: 1, padding: 15 },
    statsContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    statCard: {
        flex: 1,
        backgroundColor: '#2a4a2a',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    statNumber: { fontSize: 22, fontWeight: 'bold', color: '#FFD700' },
    statLabel: { fontSize: 10, color: '#fff', marginTop: 3, textAlign: 'center' },
    addButton: {
        backgroundColor: '#FFD700',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 25,
        marginBottom: 15,
    },
    addButtonText: { color: '#0a2a0a', fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
    filtroBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#2a4a2a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    filtroButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#1a3a1a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    filtroButtonText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },
    limparFiltroButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    limparFiltroText: { color: '#FF9800', fontSize: 11 },
    contadorText: { marginLeft: 'auto', color: '#ccc', fontSize: 11 },
    lista: { marginBottom: 20 },
    atribuicaoCard: {
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
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' },
    pelotaoBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    pelotaoBadgeText: { color: '#FFD700', fontSize: 10, fontWeight: 'bold' },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#FFD700', flex: 1 },
    cardInfo: { gap: 6, marginBottom: 12 },
    infoRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
    infoLabel: { fontSize: 12, color: '#ccc', width: 100 },
    infoValue: { fontSize: 12, color: '#fff', flex: 1 },
    infoValueDesc: { fontSize: 11, color: '#ccc', flex: 1, fontStyle: 'italic' },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#FFD700',
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#F44336',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    deleteAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#8B0000',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    actionText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    loadingContainer: { alignItems: 'center', padding: 40 },
    loadingText: { color: '#FFD700', marginTop: 10, fontSize: 14 },
    emptyContainer: { alignItems: 'center', padding: 50 },
    emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFD700', marginTop: 20, textAlign: 'center' },
    emptyText: { fontSize: 13, color: '#ccc', textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(10, 42, 10, 0.95)', justifyContent: 'center' },
    modalContainer: {
        flex: 1,
        backgroundColor: '#2a4a2a',
        margin: 20,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    pickerContainer: {
        backgroundColor: '#2a4a2a',
        margin: 20,
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFD700', textAlign: 'center', marginBottom: 5 },
    modalSubtitle: { fontSize: 12, color: '#ccc', textAlign: 'center', marginBottom: 20 },
    inputContainer: { marginBottom: 15 },
    inputLabel: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 5 },
    modalInput: {
        backgroundColor: '#1a3a1a',
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 10,
        padding: 12,
        color: '#fff',
        fontSize: 14,
    },
    selectInput: {
        backgroundColor: '#1a3a1a',
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 10,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectText: { color: '#fff', fontSize: 14, flex: 1 },
    selectPlaceholder: { color: '#888', fontSize: 14, flex: 1 },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    pickerItem: {
        paddingVertical: 12,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#3a5a3a',
    },
    pickerItemTitle: { color: '#FFD700', fontSize: 14, fontWeight: 'bold' },
    pickerItemSub: { color: '#ccc', fontSize: 11, marginTop: 2 },
    clearLink: { color: '#FF9800', fontSize: 11, marginTop: 5, textAlign: 'right' },
    pelotaoContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pelotaoOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1a3a1a',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    pelotaoOptionSelected: { backgroundColor: '#FFD700' },
    pelotaoOptionText: { color: '#FFD700', fontSize: 12, fontWeight: 'bold' },
    pelotaoOptionTextSelected: { color: '#0a2a0a' },
    modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20, marginBottom: 10 },
    modalButton: { flex: 1, padding: 14, borderRadius: 25, alignItems: 'center' },
    saveButton: { backgroundColor: '#FFD700' },
    cancelButton: { backgroundColor: '#555' },
    saveButtonText: { color: '#0a2a0a', fontSize: 14, fontWeight: 'bold' },
    buttonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
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
    modalConfirmTitle: { fontSize: 20, fontWeight: 'bold', color: '#F44336', marginTop: 15, marginBottom: 10, textAlign: 'center' },
    modalConfirmText: { fontSize: 14, color: '#fff', textAlign: 'center', marginBottom: 10 },
    modalConfirmWarning: { fontSize: 12, color: '#FF9800', textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },
    modalConfirmButtons: { flexDirection: 'row', gap: 15, width: '100%' },
    modalConfirmButton: { flex: 1, paddingVertical: 12, borderRadius: 25, alignItems: 'center' },
    cancelConfirmButton: { backgroundColor: '#555' },
    confirmDeleteButton: { backgroundColor: '#F44336' },
    cancelConfirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    confirmDeleteButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
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
    modalMensagemTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFD700', marginTop: 15, marginBottom: 5 },
    modalMensagemText: { fontSize: 14, color: '#fff', textAlign: 'center', marginBottom: 20 },
    modalMensagemButton: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 25,
    },
    modalMensagemButtonText: { color: '#0a2a0a', fontWeight: 'bold', fontSize: 14 },
});