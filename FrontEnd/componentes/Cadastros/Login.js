import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Modal } from "react-native";
import axios from "axios"; // Nota: Eu decidi usar a biblioteca axios porque ele tem algumas facilidades diferente do fetch - Enzo
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import { registrarAtividade, TIPO_ATIVIDADE } from '../Services/AtividadeService';
import { API, VERSAO_ATUAL } from "../../config/api";

export default function Login({ navigation }) {
    const [identificador, setIdentificador] = useState('');
    const [senha, setSenha] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [isCadastro, setIsCadastro] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [identificadorGerado, setIdentificadorGerado] = useState(''); 
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');
    const [patente, setPatente] = useState('');
    const [anoEntrada, setAnoEntrada] = useState('');
    const [perfil, setPerfil] = useState('OPERADOR');
    const [confirmarSenha, setConfirmarSenha] = useState('');

    // Estados do Modal de Primeiro Acesso
    const [modalAvisoVisible, setModalAvisoVisible] = useState(false);
    const [usuarioAviso, setUsuarioAviso] = useState(null);

    
    const gerarIdentificador = async (ano) => {
        try {
            const response = await axios.get(API.usuario);
            const usuarios = response.data;
            
            const usuariosMesmoAno = usuarios.filter(u => u.identificador && u.identificador.startsWith(ano));
            
            let numeroUnico;
            if (usuariosMesmoAno.length > 0) {
                // Pega o último número sequencial e incrementa
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

    const handleLogin = async () => {
        if (!identificador || !senha) {
            setMensagem("Preencha todos os campos!");
            return;
        }
        setLoading(true);
        
        try {
            const response = await axios.post(`${API.usuario}/login`, {
                identificador: identificador,
                senha: senha
            });

            const usuarioEncontrado = response.data;

            await AsyncStorage.multiSet([
                ['usuarioNome', usuarioEncontrado.nome],
                ['usuarioId', usuarioEncontrado.id.toString()],
                ['usuarioIdentificador', usuarioEncontrado.identificador],
                ['usuarioPerfil', usuarioEncontrado.perfil],
                ['usuarioPatente', usuarioEncontrado.patente],
                ['usuarioCompleto', JSON.stringify(usuarioEncontrado)]
            ]);

            await AsyncStorage.setItem('isLoggedIn', 'true');
            await registrarAtividade('Login', `Usuário realizou login no sistema`, TIPO_ATIVIDADE.LOGIN);

            setMensagem('');

            if (usuarioEncontrado.primeiroAcesso) {
                setUsuarioAviso(usuarioEncontrado);
                setModalAvisoVisible(true);
            } else {
                navigation.navigate('Principal');
            }

        } catch (error) {
            if (error.response && error.response.status === 403) {
                // Senha expirada: vai para a tela de troca obrigatória
                const u = await axios.get(`${API.usuario}/identificador/${identificador}`);
                navigation.navigate('AtualizarDados', { 
                    user: u.data, 
                    trocaObrigatoria: true
                });
            } else if (error.response && error.response.status === 401) {
                setMensagem('Identificador ou senha incorretos.');
            } else {
                console.error('Erro no login:', error);
                setMensagem('Erro ao conectar com o servidor.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleContinuar = () => {
        setModalAvisoVisible(false);
        navigation.navigate('Principal');
    };

    const handleTrocarAgora = () => {
        setModalAvisoVisible(false);
        navigation.navigate('AtualizarDados', { 
            user: usuarioAviso, 
            trocaObrigatoria: false 
        });
    };

    const handleCadastro = async () => {
        if (!nome || !patente || !anoEntrada || !senha || !confirmarSenha) {
            setMensagem('Preencha todos os campos obrigatórios');
            return;
        }

        if (senha !== confirmarSenha) {
            setMensagem('As senhas não coincidem');
            return;
        }

        if (senha.length < 6) {
            setMensagem('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (anoEntrada.length !== 4 || isNaN(anoEntrada)) {
            setMensagem('Ano de entrada deve ter 4 dígitos (ex: 2025)');
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

        try {
            const novoIdentificador = await gerarIdentificador(anoEntrada);
            
            const response = await axios.get(API.usuario);
            const users = response.data;
            
            if (email && users.some(user => user.email === email)) {
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
                email: email || null,
                senha: senha
            };

            await axios.post(API.usuario, userNovo);
            
            setIdentificadorGerado(novoIdentificador);
            setModalVisible(true);
            setMensagem('Cadastro realizado com sucesso!');
            
            setNome('');
            setPatente('');
            setAnoEntrada('');
            setPerfil('OPERADOR');
            setCpf('');
            setTelefone('');
            setEmail('');
            setSenha('');
            setConfirmarSenha('');
            setIsCadastro(false);
            
        } catch (error) {
            console.error('Erro ao cadastrar:', error);
            setMensagem('Erro ao realizar cadastro. Tente novamente.');
        } finally {
            setLoading(false);
        }
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
                <View style={styles.headerTop}>
                    <Ionicons name="shield" size={40} color="#FFD700" />
                    <Text style={styles.headerTitle}>SGM - {VERSAO_ATUAL}</Text>
                </View>
                <Text style={styles.headerSubtitle}>Sistema de Gestão Militar Integrada</Text>
                <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>🇧🇷 EXÉRCITO BRASILEIRO 🇧🇷</Text>
                </View>
            </View>

            <View style={styles.formContainer}>
                <Text style={styles.mainTitle}>ACESSO AO SISTEMA</Text>
                
                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                        <Ionicons name="id-card" size={16} color="#FFD700" /> Identificador Militar
                    </Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: 2026108102540249"
                            value={identificador}
                            onChangeText={setIdentificador}
                            keyboardType="numeric"
                            autoCapitalize="none"
                            placeholderTextColor="#888"
                        />
                    </View>
                    <Text style={styles.helperText}>Digite seu número de registro militar</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>
                        <Ionicons name="lock-closed" size={16} color="#FFD700" /> Senha
                    </Text>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Sua senha"
                            value={senha}
                            onChangeText={setSenha}
                            secureTextEntry
                            placeholderTextColor="#888"
                        />
                    </View>
                </View>

                <TouchableOpacity 
                    style={[styles.button, loading && styles.buttonDisabled]} 
                    onPress={handleLogin}
                    disabled={loading}
                >
                    <Ionicons name="log-in" size={20} color="#0a2a0a" />
                    <Text style={styles.buttonText}>
                        {loading ? 'ACESSANDO...' : 'ACESSAR SISTEMA'}
                    </Text>
                </TouchableOpacity>
                
                {/* Botão de registro comentado - Descomentar se necessário
                <TouchableOpacity onPress={() => {
                    setIsCadastro(true);
                    setMensagem('');
                }}>
                    <Text style={styles.toggleText}>
                        <Ionicons name="person-add" size={16} color="#FFD700" />
                        {' '}Não tem cadastro? → Cadastrar-se
                    </Text>
                </TouchableOpacity>
                */}
                
                {mensagem ? (
                    <Text style={[styles.mensagem, mensagem.includes('Erro') && styles.mensagemError]}>
                        {mensagem}
                    </Text>
                ) : null}
            </View>

            <View style={styles.footer}>
                <Text style={styles.footerText}>SGM - {VERSAO_ATUAL} © 2026 - Exército Brasileiro</Text>
                <Text style={styles.footerSubtext}>Sistema de Gestão Militar Integrada</Text>
            </View>

            <Modal
                transparent={true}
                animationType="fade"
                visible={isCadastro}
                onRequestClose={() => setIsCadastro(false)}
            >
                <ScrollView style={styles.modalOverlay} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>CADASTRO DE MILITAR</Text>
                        <Text style={styles.modalSubtitle}>Apenas Administradores</Text>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Nome Completo *</Text>
                            <TextInput style={styles.modalInput} value={nome} onChangeText={setNome} placeholder="Ex: Capitão João Silva" placeholderTextColor="#888" />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Patente *</Text>
                            <TextInput style={styles.modalInput} value={patente} onChangeText={setPatente} placeholder="Ex: Capitão, Major, Tenente, Sargento" placeholderTextColor="#888" />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Ano de Entrada *</Text>
                            <TextInput 
                                style={styles.modalInput} 
                                value={anoEntrada} 
                                onChangeText={setAnoEntrada} 
                                placeholder="Ex: 2026" 
                                keyboardType="numeric" 
                                placeholderTextColor="#888"
                                maxLength={4}
                            />
                            <Text style={styles.helperText}>O identificador será gerado automaticamente com base no ano</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Perfil *</Text>
                            <View style={styles.perfilContainer}>
                                <TouchableOpacity style={[styles.perfilOption, perfil === 'ADMINISTRADOR' && styles.perfilOptionSelected]} onPress={() => setPerfil('ADMINISTRADOR')}>
                                    <Text style={[styles.perfilOptionText, perfil === 'ADMINISTRADOR' && styles.perfilOptionTextSelected]}>Administrador</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.perfilOption, perfil === 'OPERADOR' && styles.perfilOptionSelected]} onPress={() => setPerfil('OPERADOR')}>
                                    <Text style={[styles.perfilOptionText, perfil === 'OPERADOR' && styles.perfilOptionTextSelected]}>Operador</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Email</Text>
                            <TextInput style={styles.modalInput} value={email} onChangeText={setEmail} placeholder="email@exercito.def.br" keyboardType="email-address" placeholderTextColor="#888" />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Telefone</Text>
                            <TextInput style={styles.modalInput} value={telefone} onChangeText={handleChangeTelefone} placeholder="11999999999" keyboardType="numeric" placeholderTextColor="#888" />
                            {telefone.length > 0 && (
                                <Text style={styles.helperText}>{formatarTelefone(telefone)}</Text>
                            )}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>CPF</Text>
                            <TextInput style={styles.modalInput} value={cpf} onChangeText={handleChangeCpf} placeholder="12345678900" keyboardType="numeric" placeholderTextColor="#888" />
                            {cpf.length > 0 && (
                                <Text style={styles.helperText}>{formatarCPF(cpf)}</Text>
                            )}
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Senha *</Text>
                            <TextInput style={styles.modalInput} value={senha} onChangeText={setSenha} secureTextEntry placeholder="Mínimo 6 caracteres" placeholderTextColor="#888" />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Confirmar Senha *</Text>
                            <TextInput style={styles.modalInput} value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry placeholderTextColor="#888" />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setIsCadastro(false)}>
                                <Text style={styles.modalButtonText}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleCadastro} disabled={loading}>
                                <Text style={styles.modalButtonText}>{loading ? 'CADASTRANDO...' : 'CADASTRAR'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </Modal>
           
            <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
                        <Text style={styles.modalTitle}>Cadastro Realizado!</Text>
                        <Text style={styles.modalText}>
                            Identificador gerado automaticamente:
                        </Text>
                        <View style={styles.identificadorContainer}>
                            <Text style={styles.identificadorTexto}>{identificadorGerado}</Text>
                        </View>
                        <Text style={styles.modalInfoText}>
                            📋 Anote este número!{'\n'}
                            Ele será usado para login no sistema.
                        </Text>
                        <TouchableOpacity style={styles.modalButtonConfirm} onPress={() => setModalVisible(false)}>
                            <Text style={styles.modalButtonConfirmText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal 
                transparent 
                visible={modalAvisoVisible} 
                animationType="fade" 
                onRequestClose={() => setModalAvisoVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { alignItems: 'center' }]}>
                        <Ionicons name="information-circle" size={60} color="#FFD700" />
                        
                        <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
                            Aviso de Segurança
                        </Text>
                        
                        <Text style={[styles.modalText, { textAlign: 'center', lineHeight: 20 }]}>
                            Você está usando uma <Text style={{ fontWeight: 'bold' }}>senha temporária</Text> de primeiro acesso.
                        </Text>
                        
                        <Text style={[styles.modalInfoText, { marginTop: 10 }]}>
                            Recomendamos fortemente que você altere sua senha agora para garantir a segurança da sua conta.
                        </Text>
                        
                        <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 20 }}>
                            <TouchableOpacity 
                                style={{ flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5, backgroundColor: '#555' }} 
                                onPress={handleTrocarAgora}
                            >
                                <Ionicons name="key" size={20} color="#fff" />
                                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>TROCAR AGORA</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                style={{ flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 5, backgroundColor: '#FFD700' }} 
                                onPress={handleContinuar}
                            >
                                <Ionicons name="arrow-forward" size={20} color="#0a2a0a" />
                                <Text style={{ color: '#0a2a0a', fontWeight: 'bold', fontSize: 13 }}>CONTINUAR</Text>
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
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: '#FFD700',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFD700',
        fontFamily: 'serif',
        letterSpacing: 2,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#fff',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    headerBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
    },
    headerBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0a2a0a',
        letterSpacing: 1,
    },
    formContainer: {
        flex: 1,
        padding: 25,
    },
    mainTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFD700',
        textAlign: 'center',
        marginBottom: 30,
        fontFamily: 'serif',
        letterSpacing: 1,
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2a4a2a',
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 12,
        paddingHorizontal: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        fontSize: 16,
        color: '#fff',
    },
    helperText: {
        fontSize: 12,
        color: '#FFD700',
        marginTop: 5,
        marginLeft: 5,
        fontStyle: 'italic',
    },
    button: {
        backgroundColor: '#FFD700',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        borderRadius: 25,
        marginVertical: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
    },
    buttonDisabled: {
        backgroundColor: '#888',
        opacity: 0.7,
    },
    buttonText: {
        color: '#0a2a0a',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    toggleText: {
        color: '#FFD700',
        textAlign: 'center',
        marginTop: 15,
        fontSize: 14,
        textDecorationLine: 'underline',
        fontWeight: '500',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
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
    footer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: '#0a2a0a',
        borderTopWidth: 1,
        borderTopColor: '#FFD700',
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
        backgroundColor: 'rgba(10, 42, 10, 0.95)',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#2a4a2a',
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
    modalInput: {
        backgroundColor: '#1a3a1a',
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 10,
        padding: 12,
        color: '#fff',
        fontSize: 14,
    },
    perfilContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    perfilOption: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        backgroundColor: '#1a3a1a',
        borderWidth: 1,
        borderColor: '#FFD700',
        alignItems: 'center',
    },
    perfilOptionSelected: {
        backgroundColor: '#FFD700',
    },
    perfilOptionText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    perfilOptionTextSelected: {
        color: '#0a2a0a',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    modalButton: {
        flex: 1,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalButtonCancel: {
        backgroundColor: '#555',
    },
    modalButtonConfirm: {
        backgroundColor: '#FFD700',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    modalButtonConfirmText: {
        fontWeight: 'bold',
        color: '#0a2a0a',
        fontSize: 16,
    },
    modalButtonText: {
        fontWeight: 'bold',
        color: '#fff',
    },
    modalText: {
        color: '#fff',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 10,
        fontSize: 14,
    },
    modalInfoText: {
        color: '#FFD700',
        textAlign: 'center',
        marginTop: 15,
        marginBottom: 10,
        fontSize: 12,
        fontStyle: 'italic',
    },
    identificadorContainer: {
        backgroundColor: '#1a3a1a',
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#FFD700',
        marginVertical: 10,
    },
    identificadorTexto: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 1,
    },
});