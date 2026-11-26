import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';
import { registrarAtividade, TIPO_ATIVIDADE } from '../Services/AtividadeService';
import { API } from "../../config/api";

const LOCALIZACOES_INSUMOS = [
    "Arsenal Central",
    "Paiol de Munição",
    "Depósito de Combustível",
    "Cozinha Central",
    "Enfermaria",
    "Almoxarifado",
    "Garagem",
    "Depósito de Alimentos"
];

export default function ControleInsumos({ navigation }) {
    const [insumos, setInsumos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [movimentoModalVisible, setMovimentoModalVisible] = useState(false);
    const [editando, setEditando] = useState(null);
    const [insumoSelecionado, setInsumoSelecionado] = useState(null);
    const [usuarioPerfil, setUsuarioPerfil] = useState('');
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [itemParaExcluir, setItemParaExcluir] = useState(null);
    const [mensagemModalVisible, setMensagemModalVisible] = useState(false);
    const [mensagemTitulo, setMensagemTitulo] = useState('');
    const [mensagemTexto, setMensagemTexto] = useState('');
    const [localizacaoModalVisible, setLocalizacaoModalVisible] = useState(false);

    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState('MUNICAO');
    const [quantidade, setQuantidade] = useState('');
    const [quantidadeMinima, setQuantidadeMinima] = useState('');
    const [unidade, setUnidade] = useState('UN');
    const [localizacao, setLocalizacao] = useState('');

    const [tipoMovimento, setTipoMovimento] = useState('ENTRADA');
    const [quantidadeMovimento, setQuantidadeMovimento] = useState('');
    const [observacaoMovimento, setObservacaoMovimento] = useState('');

    const mostrarMensagem = (titulo, texto) => {
        setMensagemTitulo(titulo);
        setMensagemTexto(texto);
        setMensagemModalVisible(true);
        setTimeout(() => setMensagemModalVisible(false), 2000);
    };

    useEffect(() => {
        const fetchUserPerfil = async () => {
            const perfil = await AsyncStorage.getItem('usuarioPerfil');
            setUsuarioPerfil(perfil || 'OPERADOR');
        };
        fetchUserPerfil();
        carregarInsumos();
    }, []);

    const carregarInsumos = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API.insumo);

            const dadosOrdenados = response.data.sort((a,b) => b.id  - a.id);
            setInsumos(dadosOrdenados);
        } catch (error) {
            console.error('Erro ao carregar insumos:', error);
            const mockInsumos = [
                { id: 1, nome: "Munição 5.56mm", categoria: "MUNICAO", quantidade: 5000, quantidadeMinima: 1000, unidade: "UN", localizacao: "Arsenal Central", status: "OK" },
                { id: 2, nome: "Combustível Diesel", categoria: "COMBUSTIVEL", quantidade: 800, quantidadeMinima: 500, unidade: "L", localizacao: "Depósito de Combustível", status: "OK" },
                { id: 3, nome: "Ração Operacional", categoria: "ALIMENTACAO", quantidade: 150, quantidadeMinima: 200, unidade: "KG", localizacao: "Cozinha Central", status: "BAIXO" },
            ];
            setInsumos(mockInsumos);
        } finally {
            setLoading(false);
        }
    };

    const limparFormulario = () => {
        setNome('');
        setCategoria('MUNICAO');
        setQuantidade('');
        setQuantidadeMinima('');
        setUnidade('UN');
        setLocalizacao('');
        setEditando(null);
    };

    const abrirModalCadastro = () => {
        limparFormulario();
        setModalVisible(true);
    };

    const abrirModalEdicao = (item) => {
        setEditando(item);
        setNome(item.nome);
        setCategoria(item.categoria);
        setQuantidade(item.quantidade.toString());
        setQuantidadeMinima(item.quantidadeMinima.toString());
        setUnidade(item.unidade);
        setLocalizacao(item.localizacao || '');
        setModalVisible(true);
    };

    const abrirModalMovimento = (item) => {
        setInsumoSelecionado(item);
        setTipoMovimento('ENTRADA');
        setQuantidadeMovimento('');
        setObservacaoMovimento('');
        setMovimentoModalVisible(true);
    };

    const handleExcluir = (item) => {
        setItemParaExcluir(item);
        setDeleteModalVisible(true);
    };

    const confirmarExclusao = async () => {
        if (!itemParaExcluir) return;

        setDeleteModalVisible(false);

        try {
            await axios.delete(`${API.insumo}/${itemParaExcluir.id}`);
            await registrarAtividade('Excluir Insumo', `Excluiu insumo: ${itemParaExcluir.nome} (${itemParaExcluir.categoria})`, TIPO_ATIVIDADE.EXCLUSAO);

            mostrarMensagem('Sucesso', 'Insumo excluído com sucesso!');
            carregarInsumos();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            const novosInsumos = insumos.filter(i => i.id !== itemParaExcluir.id);
            setInsumos(novosInsumos);
            mostrarMensagem('Sucesso', 'Insumo excluído com sucesso!');
        }
        setItemParaExcluir(null);
    };

    const handleSalvarInsumo = async () => {
        if (!nome || !quantidade || !quantidadeMinima) {
            mostrarMensagem('Atenção', 'Preencha os campos obrigatórios: Nome, Quantidade e Quantidade Mínima');
            return;
        }

        setLoading(true);

        const insumoData = {
            nome: nome,
            categoria: categoria,
            quantidade: parseInt(quantidade),
            quantidadeMinima: parseInt(quantidadeMinima),
            unidade: unidade,
            localizacao: localizacao || null
        };

        try {
            if (editando) {
                await axios.put(`${API.insumo}/${editando.id}`, insumoData);
                await registrarAtividade('Editar Insumo', `Editou insumo: ${nome} (${categoria})`, TIPO_ATIVIDADE.EDICAO);

                mostrarMensagem('Sucesso', 'Insumo atualizado com sucesso!');
            } else {
                await axios.post(API.insumo, insumoData);
                await registrarAtividade('Cadastrar Insumo', `Cadastrou insumo: ${nome} (${categoria})`, TIPO_ATIVIDADE.CADASTRO);

                mostrarMensagem('Sucesso', 'Insumo cadastrado com sucesso!');
            }
            setModalVisible(false);
            limparFormulario();
            carregarInsumos();
        } catch (error) {
            console.error('Erro ao salvar insumo:', error);
            mostrarMensagem('Erro', 'Não foi possível salvar o insumo');
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrarMovimento = async () => {
        if (!quantidadeMovimento || parseInt(quantidadeMovimento) <= 0) {
            mostrarMensagem('Atenção', 'Informe uma quantidade válida');
            return;
        }

        setLoading(true);

        const movimentoData = {
            insumoId: insumoSelecionado.id,
            tipo: tipoMovimento,
            quantidade: parseInt(quantidadeMovimento),
            observacao: observacaoMovimento || null,
            data: new Date().toISOString()
        };

        try {
            await axios.post(API.movimentacao, movimentoData);
            await registrarAtividade('Movimentar Estoque',`${tipoMovimento === 'ENTRADA' ? 'Entrada' : 'Saída'} de ${quantidadeMovimento} ${insumoSelecionado.unidade} de ${insumoSelecionado.nome}`, TIPO_ATIVIDADE.MOVIMENTACAO);
            mostrarMensagem('Sucesso', `${tipoMovimento === 'ENTRADA' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
            setMovimentoModalVisible(false);
            carregarInsumos();
        } catch (error) {
            console.error('Erro ao registrar movimento:', error);
            mostrarMensagem('Erro', 'Não foi possível registrar o movimento');
        } finally {
            setLoading(false);
        }
    };

    const getCategoriaIcon = (categoria) => {
        switch (categoria) {
            case 'MUNICAO': return 'bulb';
            case 'COMBUSTIVEL': return 'flame';
            case 'ALIMENTACAO': return 'restaurant';
            case 'MEDICAMENTO': return 'medical';
            case 'FERRAMENTA': return 'construct';
            default: return 'cube';
        }
    };

    const getStatusInsumo = (quantidade, quantidadeMinima) => {
        if (quantidade <= 0) return { text: 'ESGOTADO', color: '#F44336', icon: 'close-circle' };
        if (quantidade <= quantidadeMinima) return { text: 'BAIXO', color: '#FF9800', icon: 'warning' };
        return { text: 'OK', color: '#4CAF50', icon: 'checkmark-circle' };
    };

    const renderInsumo = ({ item }) => {
        const status = getStatusInsumo(item.quantidade, item.quantidadeMinima);

        return (
            <View style={[styles.insumoCard, status.color === '#FF9800' && styles.insumoCardWarning, status.color === '#F44336' && styles.insumoCardDanger]}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={[styles.categoriaBadge, { backgroundColor: status.color }]}>
                            <Ionicons name={getCategoriaIcon(item.categoria)} size={14} color="#fff" />
                            <Text style={styles.categoriaText}>{item.categoria}</Text>
                        </View>
                        <Text style={styles.insumoNome}>{item.nome}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                        <Ionicons name={status.icon} size={12} color="#fff" />
                        <Text style={styles.statusText}>{status.text}</Text>
                    </View>
                </View>

                <View style={styles.cardInfo}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Quantidade:</Text>
                        <Text style={[styles.infoValue, status.color === '#FF9800' && styles.warningText, status.color === '#F44336' && styles.dangerText]}>
                            {item.quantidade} {item.unidade}
                        </Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Qtd. Mínima:</Text>
                        <Text style={styles.infoValue}>{item.quantidadeMinima} {item.unidade}</Text>
                    </View>
                    {item.localizacao && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Localização:</Text>
                            <Text style={styles.infoValue}>{item.localizacao}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.movimentoButton} onPress={() => abrirModalMovimento(item)}>
                        <Ionicons name="swap-horizontal" size={16} color="#fff" />
                        <Text style={styles.actionText}>Movimento</Text>
                    </TouchableOpacity>
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
    };

    const categorias = [
        { id: 'MUNICAO', nome: 'Munição', icone: 'bulb' },
        { id: 'COMBUSTIVEL', nome: 'Combustível', icone: 'flame' },
        { id: 'ALIMENTACAO', nome: 'Alimentação', icone: 'restaurant' },
        { id: 'MEDICAMENTO', nome: 'Medicamento', icone: 'medical' },
        { id: 'FERRAMENTA', nome: 'Ferramenta', icone: 'construct' },
    ];

    const unidades = [
        { id: 'UN', nome: 'Unidade' },
        { id: 'KG', nome: 'Quilograma' },
        { id: 'L', nome: 'Litro' },
        { id: 'CX', nome: 'Caixa' },
        { id: 'PC', nome: 'Pacote' },
    ];

    const insumosAlertas = insumos.filter(i => i.quantidade <= i.quantidadeMinima);

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
                <View style={styles.headerTop}>
                    <Ionicons name="stats-chart" size={32} color="#FFD700" />
                    <Text style={styles.headerTitle}>Controle de Insumos</Text>
                </View>
                <Text style={styles.headerSubtitle}>Gerenciar estoque e movimentações</Text>
            </View>

            <View style={styles.content}>
                {insumosAlertas.length > 0 && (
                    <View style={styles.alertaContainer}>
                        <View style={styles.alertaHeader}>
                            <Ionicons name="warning" size={20} color="#FF9800" />
                            <Text style={styles.alertaTitle}>Alertas de Estoque Baixo</Text>
                        </View>
                        {insumosAlertas.map((item) => (
                            <View key={item.id} style={styles.alertaItem}>
                                <Text style={styles.alertaItemText}>• {item.nome}: {item.quantidade} {item.unidade} (mín: {item.quantidadeMinima})</Text>
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{insumos.length}</Text>
                        <Text style={styles.statLabel}>Total de Insumos</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {insumos.filter(i => i.quantidade <= i.quantidadeMinima && i.quantidade > 0).length}
                        </Text>
                        <Text style={styles.statLabel}>Em Alerta</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {insumos.filter(i => i.quantidade <= 0).length}
                        </Text>
                        <Text style={styles.statLabel}>Esgotados</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.addButton} onPress={abrirModalCadastro}>
                    <Ionicons name="add" size={24} color="#0a2a0a" />
                    <Text style={styles.addButtonText}>NOVO INSUMO</Text>
                </TouchableOpacity>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Ionicons name="refresh-circle" size={40} color="#FFD700" />
                        <Text style={styles.loadingText}>Carregando insumos...</Text>
                    </View>
                ) : insumos.length > 0 ? (
                    <FlatList
                        data={insumos}
                        renderItem={renderInsumo}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        style={styles.lista}
                    />
                ) : (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="cube-outline" size={60} color="#FFD700" />
                        <Text style={styles.emptyTitle}>Nenhum insumo cadastrado</Text>
                        <Text style={styles.emptyText}>
                            Clique em "NOVO INSUMO" para começar
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
                            {editando ? 'EDITAR INSUMO' : 'NOVO INSUMO'}
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Nome do Insumo *</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={nome}
                                onChangeText={setNome}
                                placeholder="Ex: Munição 5.56mm"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Categoria *</Text>
                            <View style={styles.categoriaContainer}>
                                {categorias.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.categoriaOption, categoria === cat.id && styles.categoriaOptionSelected]}
                                        onPress={() => setCategoria(cat.id)}
                                    >
                                        <Ionicons name={cat.icone} size={16} color={categoria === cat.id ? "#0a2a0a" : "#FFD700"} />
                                        <Text style={[styles.categoriaOptionText, categoria === cat.id && styles.categoriaOptionTextSelected]}>
                                            {cat.nome}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.rowInput}>
                            <View style={[styles.inputContainer, { flex: 2, marginRight: 10 }]}>
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
                                <Text style={styles.inputLabel}>Unidade *</Text>
                                <View style={styles.unidadePicker}>
                                    {unidades.map((unid) => (
                                        <TouchableOpacity
                                            key={unid.id}
                                            style={[styles.unidadeOption, unidade === unid.id && styles.unidadeOptionSelected]}
                                            onPress={() => setUnidade(unid.id)}
                                        >
                                            <Text style={[styles.unidadeOptionText, unidade === unid.id && styles.unidadeOptionTextSelected]}>
                                                {unid.nome}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Quantidade Mínima (Alerta) *</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={quantidadeMinima}
                                onChangeText={setQuantidadeMinima}
                                keyboardType="numeric"
                                placeholder="0"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Localização</Text>
                            <TouchableOpacity 
                                style={[styles.modalInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]} 
                                onPress={() => setLocalizacaoModalVisible(true)}
                            >
                                <Text style={{ color: localizacao ? '#fff' : '#888', fontSize: 14 }}>
                                    {localizacao ? localizacao : "Selecione a localização"}
                                </Text>
                                <Ionicons name="chevron-down" size={20} color="#FFD700" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => {
                                setModalVisible(false);
                                limparFormulario();
                            }}>
                                <Text style={styles.buttonText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSalvarInsumo} disabled={loading}>
                                <Text style={styles.saveButtonText}>{loading ? 'SALVANDO...' : 'SALVAR'}</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* Modal de Localização */}
            <Modal
                transparent={true}
                visible={localizacaoModalVisible}
                animationType="slide"
                onRequestClose={() => setLocalizacaoModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.pickerModalContainer}>
                        <View style={styles.pickerModalHeader}>
                            <Text style={styles.modalTitle}>Selecione a Localização</Text>
                            <TouchableOpacity onPress={() => setLocalizacaoModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFD700" />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={LOCALIZACOES_INSUMOS}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.pickerItem}
                                    onPress={() => {
                                        setLocalizacao(item);
                                        setLocalizacaoModalVisible(false);
                                    }}
                                >
                                    <Text style={[styles.pickerItemText, localizacao === item && { color: '#FFD700', fontWeight: 'bold' }]}>
                                        {item}
                                    </Text>
                                    {localizacao === item && <Ionicons name="checkmark" size={20} color="#FFD700" />}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* Modal de Movimentação */}
            <Modal
                transparent={true}
                visible={movimentoModalVisible}
                animationType="slide"
                onRequestClose={() => setMovimentoModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainerSmall}>
                        <Text style={styles.modalTitle}>
                            Movimentar Estoque
                        </Text>
                        <Text style={styles.modalSubtitle}>
                            {insumoSelecionado?.nome} - Atual: {insumoSelecionado?.quantidade} {insumoSelecionado?.unidade}
                        </Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Tipo de Movimento</Text>
                            <View style={styles.tipoMovimentoContainer}>
                                <TouchableOpacity
                                    style={[styles.tipoOption, tipoMovimento === 'ENTRADA' && styles.tipoOptionSelected]}
                                    onPress={() => setTipoMovimento('ENTRADA')}
                                >
                                    <Ionicons name="arrow-down" size={20} color={tipoMovimento === 'ENTRADA' ? "#0a2a0a" : "#4CAF50"} />
                                    <Text style={[styles.tipoOptionText, tipoMovimento === 'ENTRADA' && styles.tipoOptionTextSelected]}>ENTRADA</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tipoOption, tipoMovimento === 'SAIDA' && styles.tipoOptionSelected]}
                                    onPress={() => setTipoMovimento('SAIDA')}
                                >
                                    <Ionicons name="arrow-up" size={20} color={tipoMovimento === 'SAIDA' ? "#0a2a0a" : "#F44336"} />
                                    <Text style={[styles.tipoOptionText, tipoMovimento === 'SAIDA' && styles.tipoOptionTextSelected]}>SAÍDA</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Quantidade *</Text>
                            <TextInput
                                style={styles.modalInput}
                                value={quantidadeMovimento}
                                onChangeText={setQuantidadeMovimento}
                                keyboardType="numeric"
                                placeholder="Digite a quantidade"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Observação</Text>
                            <TextInput
                                style={[styles.modalInput, styles.textArea]}
                                value={observacaoMovimento}
                                onChangeText={setObservacaoMovimento}
                                placeholder="Motivo da movimentação"
                                placeholderTextColor="#888"
                                multiline
                                numberOfLines={3}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setMovimentoModalVisible(false)}>
                                <Text style={styles.buttonText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleRegistrarMovimento} disabled={loading}>
                                <Text style={styles.saveButtonText}>{loading ? 'PROCESSANDO...' : 'REGISTRAR'}</Text>
                            </TouchableOpacity>
                        </View>
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
                            Deseja realmente excluir o insumo "{itemParaExcluir?.nome}"?
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
    alertaContainer: {
        backgroundColor: '#3a2a1a',
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FF9800',
    },
    alertaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    alertaTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FF9800',
    },
    alertaItem: {
        marginLeft: 10,
        marginBottom: 5,
    },
    alertaItemText: {
        fontSize: 12,
        color: '#fff',
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
    insumoCard: {
        backgroundColor: '#2a4a2a',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    insumoCardWarning: {
        borderColor: '#FF9800',
        borderWidth: 2,
    },
    insumoCardDanger: {
        borderColor: '#F44336',
        borderWidth: 2,
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
    categoriaBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoriaText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    insumoNome: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#FFD700',
        flex: 1,
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
        fontSize: 12,
        color: '#ccc',
        width: 90,
    },
    infoValue: {
        fontSize: 12,
        color: '#fff',
        flex: 1,
    },
    warningText: {
        color: '#FF9800',
        fontWeight: 'bold',
    },
    dangerText: {
        color: '#F44336',
        fontWeight: 'bold',
    },
    cardActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 10,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#FFD700',
    },
    movimentoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#2196F3',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
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
    actionText: {
        color: '#fff',
        fontSize: 11,
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
    modalContainerSmall: {
        backgroundColor: '#2a4a2a',
        margin: 20,
        padding: 20,
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
    },
    categoriaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoriaOption: {
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
    categoriaOptionSelected: {
        backgroundColor: '#FFD700',
    },
    categoriaOptionText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
    },
    categoriaOptionTextSelected: {
        color: '#0a2a0a',
    },
    unidadePicker: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    unidadeOption: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#1a3a1a',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    unidadeOptionSelected: {
        backgroundColor: '#FFD700',
    },
    unidadeOptionText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
    },
    unidadeOptionTextSelected: {
        color: '#0a2a0a',
    },
    tipoMovimentoContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    tipoOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#1a3a1a',
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    tipoOptionSelected: {
        backgroundColor: '#FFD700',
    },
    tipoOptionText: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: 'bold',
    },
    tipoOptionTextSelected: {
        color: '#0a2a0a',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
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
    pickerModalContainer: {
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
    pickerModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#FFD700',
        paddingBottom: 10,
    },
    pickerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#3a5a3a',
    },
    pickerItemText: {
        fontSize: 16,
        color: '#fff',
    },
});