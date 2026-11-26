import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';
import { API } from "../../config/api";

export default function AtualizarDados({ navigation, route }) {
    const { user, trocaObrigatoria } = route.params || {};
    
    const [nome, setNome] = useState(user?.nome || '');
    const [email, setEmail] = useState(user?.email || '');
    const [telefone, setTelefone] = useState(user?.telefone || '');
    
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    
    const [loading, setLoading] = useState(false);

    const handleSalvar = async () => {
        if (!nome) {
            Alert.alert('Atenção', 'O nome é obrigatório');
            return;
        }

        if (trocaObrigatoria) {
            if (!novaSenha || !confirmarSenha) {
                Alert.alert('Atenção', 'Você precisa definir uma nova senha.');
                return;
            }
            if (novaSenha !== confirmarSenha) {
                Alert.alert('Atenção', 'As senhas não coincidem.');
                return;
            }
            if (novaSenha.length < 6) {
                Alert.alert('Atenção', 'A nova senha deve ter pelo menos 6 caracteres.');
                return;
            }
        }

        setLoading(true);
        
        try {
            const dadosAtualizados = {
                ...user,
                nome: nome,
                email: email,
                telefone: telefone
            };

            await axios.put(`${API.usuario}/${user.id}`, dadosAtualizados);

            if (trocaObrigatoria) {
                await axios.put(`${API.usuario}/${user.id}/trocar-senha`, {
                    novaSenha: novaSenha
                });
            }

            await AsyncStorage.setItem('usuarioCompleto', JSON.stringify({ ...dadosAtualizados, primeiroAcesso: false }));
            await AsyncStorage.setItem('usuarioNome', nome.split(' ')[0]);
            await AsyncStorage.setItem('usuarioEmail', email);
            await AsyncStorage.setItem('usuarioTelefone', telefone);

            if (trocaObrigatoria) {
                Alert.alert(
                    'Sucesso', 
                    'Senha alterada com sucesso! Por favor, faça login novamente.', 
                    [
                        { 
                            text: 'OK', 
                            onPress: async () => {
                                await AsyncStorage.clear(); 
                                navigation.replace('Login');
                            }
                        }
                    ]
                );
            } else {
                navigation.goBack();
            }
            
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            Alert.alert('Erro', 'Não foi possível atualizar os dados. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
               
                {!trocaObrigatoria && (
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#FFD700" />
                        <Text style={styles.backButtonText}>Voltar</Text>
                    </TouchableOpacity>
                )}
                
                <View style={styles.headerTop}>
                    <Ionicons name={trocaObrigatoria ? "lock-open" : "create"} size={32} color="#FFD700" />
                    <Text style={styles.headerTitle}>
                        {trocaObrigatoria ? 'Primeiro Acesso' : 'Editar Perfil'}
                    </Text>
                </View>
            </View>

            <View style={styles.formContainer}>
                
                {/* Aviso de Primeiro Acesso */}
                {trocaObrigatoria && (
                    <View style={styles.avisoContainer}>
                        <Ionicons name="warning" size={24} color="#D32F2F" />
                        <Text style={styles.avisoText}>
                            Bem-vindo ao sistema! Como este é seu primeiro acesso ou sua senha expirou, você precisa criar uma nova senha definitiva para continuar.
                        </Text>
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nome Completo</Text>
                    <TextInput
                        style={styles.input}
                        value={nome}
                        onChangeText={setNome}
                        placeholder="Digite seu nome"
                        placeholderTextColor="#888"
                        editable={!trocaObrigatoria} 
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                        style={styles.input}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Digite seu email"
                        keyboardType="email-address"
                        placeholderTextColor="#888"
                        editable={!trocaObrigatoria} 
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Telefone</Text>
                    <TextInput
                        style={styles.input}
                        value={telefone}
                        onChangeText={setTelefone}
                        placeholder="Digite seu telefone"
                        keyboardType="phone-pad"
                        placeholderTextColor="#888"
                    />
                </View>

                
                {trocaObrigatoria && (
                    <>
                        <View style={styles.divider}>
                            <Text style={styles.dividerText}>SEGURANÇA</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Nova Senha *</Text>
                            <TextInput
                                style={styles.input}
                                value={novaSenha}
                                onChangeText={setNovaSenha}
                                placeholder="Mínimo 6 caracteres"
                                secureTextEntry
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Confirmar Nova Senha *</Text>
                            <TextInput
                                style={styles.input}
                                value={confirmarSenha}
                                onChangeText={setConfirmarSenha}
                                placeholder="Confirme a nova senha"
                                secureTextEntry
                                placeholderTextColor="#888"
                            />
                            {novaSenha && confirmarSenha && novaSenha !== confirmarSenha && (
                                <Text style={styles.errorText}>As senhas não coincidem</Text>
                            )}
                        </View>
                    </>
                )}

                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={[styles.saveButton, loading && styles.buttonDisabled]} 
                        onPress={handleSalvar}
                        disabled={loading}
                    >
                        <Ionicons name={trocaObrigatoria ? "checkmark-circle" : "save"} size={20} color="#0a2a0a" />
                        <Text style={styles.saveButtonText}>
                            {loading ? 'SALVANDO...' : (trocaObrigatoria ? 'DEFINIR SENHA E ENTRAR' : 'SALVAR')}
                        </Text>
                    </TouchableOpacity>
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
    formContainer: {
        padding: 20,
    },
    avisoContainer: {
        backgroundColor: '#3a1a1a',
        padding: 15,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#D32F2F',
    },
    avisoText: {
        flex: 1,
        color: '#ff6b6b',
        fontSize: 13,
        lineHeight: 18,
        marginLeft: 10,
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
    input: {
        backgroundColor: '#2a4a2a',
        borderWidth: 1,
        borderColor: '#FFD700',
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: '#fff',
    },
    errorText: {
        fontSize: 11,
        color: '#ff6b6b',
        marginTop: 5,
        marginLeft: 5,
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
        marginTop: 20,
    },
    saveButton: {
        backgroundColor: '#FFD700',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        borderRadius: 25,
    },
    saveButtonText: {
        color: '#0a2a0a',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
});