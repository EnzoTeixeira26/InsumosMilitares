import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Modal, Alert, FlatList } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import { API } from "../../config/api";
import { registrarAtividade, TIPO_ATIVIDADE } from '../Services/AtividadeService';

const PATENTES_EXERCITO = [
    "General de Exército",
    "General de Divisão",
    "General de Brigada",
    "Coronel",
    "Tenente-Coronel",
    "Major",
    "Capitão",
    "1º Tenente",
    "2º Tenente",
    "Aspirante a Oficial",
    "Subtenente",
    "1º Sargento",
    "2º Sargento",
    "3º Sargento",
    "Cabo",
    "Soldado"
];

export default function CadastroUsuario({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [mensagem, setMensagem] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [identificadorGerado, setIdentificadorGerado] = useState('');
    const [observacao, setObservacao] = useState('');
    const [patenteModalVisible, setPatenteModalVisible] = useState(false);
    
    const [nome, setNome] = useState('');
    const [patente, setPatente] = useState('');
    const [anoEntrada, setAnoEntrada] = useState('');
    const [perfil, setPerfil] = useState('OPERADOR');
    const [email, setEmail] = useState('');
    const [telefone, setTelefone] = useState('');
    const [cpf, setCpf] = useState('');
    
    const [usuarioPerfil, setUsuarioPerfil] = useState('');

    useEffect(() => {
        const fetchUserPerfil = async () => {
            const perfil = await AsyncStorage.getItem('usuarioPerfil');
            if (perfil !== 'ADMINISTRADOR') {
                Alert.alert('Acesso Negado', 'Apenas administradores podem acessar esta tela.');
                navigation.goBack();
            }
            setUsuarioPerfil(perfil);
        };
        fetchUserPerfil();
    }, []);

    const gerarIdentificador = async (ano) => {
        try {
            const response = await axios.get(API.usuario);
            const usuarios = response.data;
            
            const usuariosMesmoAno = usuarios.filter(u => u.identificador && u.identificador.startsWith(ano));
            
            let numeroUnico;
            if (usuariosMesmoAno.length > 0) {
                const ultimoIdentificador = usuariosMesmoAno[usuariosMesmoAno.length - 1].identificador;
                const ultimoNumero = parseInt(ultimoIdentificador.slice(-12));
                numeroUnico = (ultimoNumero + 1).toString().padStart(12, '0');
            } else {
                numeroUnico = '000000000001';
            }
            
            if (numeroUnico.length > 12) {
                numeroUnico = numeroUnico.slice(-12);
            }
            
            return `${ano}${numeroUnico}`;
        } catch (error) {
            console.error('Erro ao gerar identificador:', error);
            const timestamp = Date.now().toString().slice(-12);
            return `${ano}${timestamp}`;
        }
    };

    const handleCadastro = async () => {
        if (!nome || !patente || !anoEntrada || !email) {
            setMensagem('Preencha os campos obrigatórios (*). O e-mail é obrigatório para receber a senha.');
            return;
        }

        if (anoEntrada.length !== 4 || isNaN(anoEntrada)) {
            setMensagem('Ano de entrada deve ter 4 dígitos (ex: 2026)');
            return;
        }

        if (telefone && telefone.length < 10) {
            setMensagem('Telefone deve ter pelo menos 10 dígitos');
            return;
        }

        if (cpf && cpf.length !== 11) {
            setMensagem('CPF deve ter 11 dígitos');
            return;
        }

        setLoading(true);
        setMensagem('');

        try {
            const novoIdentificador = await gerarIdentificador(anoEntrada);
            
            const response = await axios.get(API.usuario);
            const users = response.data;
            
            if (users.some(user => user.email === email)) {
                setMensagem('Já existe um cadastro com este email');
                setLoading(false);
                return;
            }

            if (cpf && users.some(user => user.cpf === cpf)) {
                setMensagem('Já existe um cadastro com este CPF');
                setLoading(false);
                return;
            }

            const userNovo = {
                nome: nome,
                identificador: novoIdentificador,
                patente: patente,
                anoEntrada: anoEntrada,
                perfil: perfil,
                cpf: cpf || null,
                telefone: telefone || null,
                email: email,
                observacao: observacao || null 
            };

            await axios.post(API.usuario, userNovo);

            await registrarAtividade(
                'Cadastrar Usuário',
                `Cadastrou o militar ${nome} (${novoIdentificador})`,
                TIPO_ATIVIDADE.CADASTRO
            );
            
            setModalVisible(true);
            
            setNome('');
            setPatente('');
            setAnoEntrada('');
            setPerfil('OPERADOR');
            setCpf('');
            setTelefone('');
            setEmail('');
            setObservacao(''); 
            
        } catch (error) {
            console.error('Erro ao cadastrar:', error);
            setMensagem('Erro ao realizar cadastro. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const limparFormulario = () => {
        setNome('');
        setPatente('');
        setAnoEntrada('');
        setPerfil('OPERADOR');
        setCpf('');
        setTelefone('');
        setEmail('');
        setObservacao('');
        setMensagem('');
    };

    const handleChangeTelefone = (text) => {
        if (/^[0-9]*$/.test(text)) {
            setTelefone(text);
        }
    };

    const handleChangeCpf = (text) => {
        if (/^[0-9]*$/.test(text)) {
            setCpf(text);
        }
    };

    const formatarCPF = (cpf) => {
        if (!cpf) return '';
        if (cpf.length <= 3) return cpf;
        if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
        if (cpf.length <= 9) return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
        return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
    };

    const formatarTelefone = (text) => {
        if (!text) return '';
        if (text.length <= 2) return text;
        if (text.length <= 6) return `(${text.slice(0, 2)}) ${text.slice(2)}`;
        return `(${text.slice(0, 2)}) ${text.slice(2, 7)}-${text.slice(7, 11)}`;
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
                <View style={styles.headerTop}>
                    <Ionicons name="person-add" size={32} color="#FFD700" />
                    <Text style={styles.headerTitle}>Cadastrar Militar</Text>
                </View>
                <Text style={styles.headerSubtitle}>Registrar novo usuário no sistema</Text>
            </View>

            <View style={styles.formContainer}>
                
                <View style={styles.avisoContainer}>
                    <Ionicons name="information-circle" size={24} color="#0a2a0a" style={styles.avisoIcon} />
                    <Text style={styles.avisoText}>
                        <Text style={styles.avisoTitle}>Bem-vindo ao SGM-017!</Text>{'\n'}
                        Ao cadastrar o militar, uma senha temporária será gerada e enviada automaticamente para o e-mail informado. O militar deverá alterá-la no primeiro acesso.
                    </Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nome Completo *</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="person" size={20} color="#FFD700" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Capitão João Silva"
                            value={nome}
                            onChangeText={setNome}
                            placeholderTextColor="#888"
                        />
                    </View>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Patente *</Text>
                    <TouchableOpacity 
                        style={[styles.inputWrapper, { paddingVertical: 14 }]} 
                        onPress={() => setPatenteModalVisible(true)}
                    >
                        <Ionicons name="ribbon" size={20} color="#FFD700" style={styles.inputIcon} />
                        <Text style={[styles.input, { color: patente ? '#fff' : '#888' }]}>
                            {patente ? patente : "Selecione a patente"}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#FFD700" />
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Ano de Entrada *</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="calendar" size={20} color="#FFD700" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: 2026"
                            value={anoEntrada}
                            onChangeText={setAnoEntrada}
                            keyboardType="numeric"
                            maxLength={4}
                            placeholderTextColor="#888"
                        />
                    </View>
                    <Text style={styles.helperText}>O identificador será gerado automaticamente: ANO + NÚMERO ÚNICO</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Perfil *</Text>
                    <View style={styles.perfilContainer}>
                        <TouchableOpacity 
                            style={[styles.perfilOption, perfil === 'ADMINISTRADOR' && styles.perfilOptionSelected]} 
                            onPress={() => setPerfil('ADMINISTRADOR')}
                        >
                            <Ionicons name="shield" size={20} color={perfil === 'ADMINISTRADOR' ? "#0a2a0a" : "#FFD700"} />
                            <Text style={[styles.perfilOptionText, perfil === 'ADMINISTRADOR' && styles.perfilOptionTextSelected]}>Administrador</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.perfilOption, perfil === 'OPERADOR' && styles.perfilOptionSelected]} 
                            onPress={() => setPerfil('OPERADOR')}
                        >
                            <Ionicons name="person" size={20} color={perfil === 'OPERADOR' ? "#0a2a0a" : "#FFD700"} />
                            <Text style={[styles.perfilOptionText, perfil === 'OPERADOR' && styles.perfilOptionTextSelected]}>Operador</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.divider}>
                    <Text style={styles.dividerText}>DADOS DE CONTATO</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email *</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="mail" size={20} color="#FFD700" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="email@exercito.def.br"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            placeholderTextColor="#888"
                        />
                    </View>
                    <Text style={styles.helperText}>A senha temporária será enviada para este e-mail.</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Observação (Opcional)</Text>
                    <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingTop: 10, height: 90 }]}>
                        <Ionicons name="document-text" size={20} color="#FFD700" style={[styles.inputIcon, { marginTop: 2 }]} />
                        <TextInput
                            style={[styles.input, { textAlignVertical: 'top', height: '100%' }]}
                            placeholder="Ex: Apresentar-se ao comando no primeiro dia."
                            value={observacao}
                            onChangeText={setObservacao}
                            multiline
                            numberOfLines={3}
                            placeholderTextColor="#888"
                        />
                    </View>
                    <Text style={styles.helperText}>Esta mensagem será enviada no e-mail do militar.</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Telefone</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="call" size={20} color="#FFD700" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="11999999999"
                            value={telefone}
                            onChangeText={handleChangeTelefone}
                            keyboardType="numeric"
                            maxLength={11}
                            placeholderTextColor="#888"
                        />
                    </View>
                    {telefone.length > 0 && (
                        <Text style={styles.helperText}>{formatarTelefone(telefone)}</Text>
                    )}
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>CPF</Text>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="card" size={20} color="#FFD700" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="12345678900"
                            value={cpf}
                            onChangeText={handleChangeCpf}
                            keyboardType="numeric"
                            maxLength={11}
                            placeholderTextColor="#888"
                        />
                    </View>
                    {cpf.length > 0 && (
                        <Text style={styles.helperText}>{formatarCPF(cpf)}</Text>
                    )}
                </View>

                {mensagem ? (
                    <Text style={[styles.mensagem, mensagem.includes('Erro') && styles.mensagemError]}>
                        {mensagem}
                    </Text>
                ) : null}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={limparFormulario}>
                        <Ionicons name="trash" size={20} color="#fff" />
                        <Text style={styles.buttonText}>LIMPAR</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.button, styles.saveButton, loading && styles.buttonDisabled]} 
                        onPress={handleCadastro}
                        disabled={loading}
                    >
                        <Ionicons name="save" size={20} color="#0a2a0a" />
                        <Text style={styles.saveButtonText}>
                            {loading ? 'CADASTRANDO...' : 'CADASTRAR'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

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

            <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Ionicons name="mail-open" size={60} color="#4CAF50" />
                        <Text style={styles.modalTitle}>Cadastro Realizado!</Text>
                        
                        <Text style={styles.modalText}>
                            Um e-mail foi enviado para <Text style={{ fontWeight: 'bold' }}>{email}</Text> contendo:
                        </Text>
                        
                        <View style={styles.emailInfoContainer}>
                            <View style={styles.emailInfoRow}>
                                <Ionicons name="id-card" size={18} color="#FFD700" />
                                <Text style={styles.emailInfoText}>O Identificador Militar</Text>
                            </View>
                            <View style={styles.emailInfoRow}>
                                <Ionicons name="key" size={18} color="#FFD700" />
                                <Text style={styles.emailInfoText}>A Senha Temporária</Text>
                            </View>
                            <View style={styles.emailInfoRow}>
                                <Ionicons name="time" size={18} color="#FFD700" />
                                <Text style={styles.emailInfoText}>A Data de Expiração (30 dias)</Text>
                            </View>
                        </View>

                        <Text style={styles.modalInfoText}>
                            O militar deverá trocar a senha no primeiro acesso.
                        </Text>
                        
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonNew]} 
                                onPress={() => {
                                    setModalVisible(false);
                                    limparFormulario();
                                }}
                            >
                                <Ionicons name="add" size={20} color="#0a2a0a" />
                                <Text style={styles.modalButtonNewText}>NOVO CADASTRO</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalButtonClose]} 
                                onPress={() => {
                                    setModalVisible(false);
                                    navigation.goBack();
                                }}
                            >
                                <Ionicons name="arrow-back" size={20} color="#fff" />
                                <Text style={styles.modalButtonCloseText}>VOLTAR</Text>
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
        fontSize: 22,
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
    formContainer: {
        flex: 1,
        padding: 20,
    },
    avisoContainer: {
        backgroundColor: '#e6f4ea',
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#2E7D32',
    },
    avisoIcon: {
        marginRight: 10,
        marginTop: 2,
    },
    avisoText: {
        flex: 1,
        color: '#0a2a0a',
        fontSize: 13,
        lineHeight: 18,
    },
    avisoTitle: {
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
        marginLeft: 5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a4a2a',
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 12,
        paddingHorizontal: 15,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: '#fff',
    },
    helperText: {
        fontSize: 11,
        color: '#FFD700',
        marginTop: 5,
        marginLeft: 5,
        fontStyle: 'italic',
    },
    perfilContainer: {
        flexDirection: 'row',
        gap: 15,
    },
    perfilOption: {
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
    perfilOptionSelected: {
        backgroundColor: '#FFD700',
    },
    perfilOptionText: {
        color: '#FFD700',
        fontWeight: 'bold',
        fontSize: 14,
    },
    perfilOptionTextSelected: {
        color: '#0a2a0a',
    },
    divider: {
        marginVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#FFD700',
        alignItems: 'center',
    },
    dividerText: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: 'bold',
        backgroundColor: '#1a3a1a',
        paddingHorizontal: 10,
        marginBottom: -8,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 20,
        marginBottom: 30,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 25,
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
        letterSpacing: 1,
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    mensagem: {
        textAlign: 'center',
        fontWeight: 'bold',
        color: '#FFD700',
        marginTop: 15,
        fontSize: 14,
        padding: 10,
        backgroundColor: '#2a4a2a',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FFD700',
    },
    mensagemError: {
        color: '#ff6b6b',
        backgroundColor: '#3a1a1a',
        borderColor: '#ff6b6b',
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
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 5,
        marginTop: 10,
    },
    modalText: {
        color: '#fff',
        textAlign: 'center',
        marginTop: 10,
        fontSize: 14,
    },
    emailInfoContainer: {
        backgroundColor: '#1a3a1a',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFD700',
        marginVertical: 15,
        width: '100%',
        gap: 10,
    },
    emailInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    emailInfoText: {
        color: '#fff',
        fontSize: 14,
    },
    modalInfoText: {
        color: '#FFD700',
        textAlign: 'center',
        marginTop: 5,
        fontSize: 12,
        fontStyle: 'italic',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
    },
    modalButtonNew: {
        backgroundColor: '#FFD700',
    },
    modalButtonClose: {
        backgroundColor: '#555',
    },
    modalButtonNewText: {
        color: '#0a2a0a',
        fontWeight: 'bold',
    },
    modalButtonCloseText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    patenteModalContainer: {
        backgroundColor: '#2a4a2a',
        width: '90%',
        maxHeight: '80%',
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFD700',
        padding: 20,
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