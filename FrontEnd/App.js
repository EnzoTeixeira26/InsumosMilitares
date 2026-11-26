import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Login from './componentes/Cadastros/Login';
import Principal from './componentes/Principal/Principal';
import GestaoEquipamentos from './componentes/Equipamentos/GestaoEquipamentos';
import GestaoPelotao from './componentes/Pelotoes/GestaoPelotao';
import ControleInsumos from './componentes/Insumos/ControleInsumos';
import Relatorios from './componentes/Relatorios/Relatorios';
import PerfilUsuario from './componentes/Usuario/PerfilUsuario';
import CadastroUsuario from './componentes/Cadastros/CadastroUsuario';
import GerenciarUsuarios from './componentes/Usuario/GerenciarUsuarios';
import AtualizarDados from './componentes/Usuario/AtualizarDados';
import Atividades from './componentes/Usuario/Atividades';
import AtribuirEquipamento from './componentes/Equipamentos/AtribuirEquipamento';
import { IdleProvider } from './componentes/Usuario/utils/IdleProvider';

const Stack = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const usuarioNome = await AsyncStorage.getItem("usuarioNome");
                setIsLoggedIn(!!usuarioNome);
            } catch (error) {
                console.error('Erro ao verificar login:', error);
                setIsLoggedIn(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkLoginStatus();
    }, []);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    return (
        <IdleProvider navigationRef={navigationRef}>
            <NavigationContainer ref={navigationRef}>
                <Stack.Navigator initialRouteName={isLoggedIn ? "Principal" : "Login"}>
                    <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
                    <Stack.Screen name="Principal" component={Principal} options={{ headerShown: false }} />
                    <Stack.Screen name="CadastroUsuario" component={CadastroUsuario} options={{ headerShown: false }} />
                    <Stack.Screen name="Relatorios" component={Relatorios} options={{ headerShown: false }} />
                    <Stack.Screen name="PerfilUsuario" component={PerfilUsuario} options={{ headerShown: false }} />
                    <Stack.Screen name="AtualizarDados" component={AtualizarDados} options={{ headerShown: false }} />
                    <Stack.Screen name="ControleInsumos" component={ControleInsumos} options={{ headerShown: false }} />
                    <Stack.Screen name="GestaoPelotao" component={GestaoPelotao} options={{ headerShown: false }} />
                    <Stack.Screen name="GestaoEquipamentos" component={GestaoEquipamentos} options={{ headerShown: false }} />
                    <Stack.Screen name="GerenciarUsuarios" component={GerenciarUsuarios} options={{ headerShown: false }} />
                    <Stack.Screen name="Atividades" component={Atividades} options={{ headerShown: false }} />
                    <Stack.Screen name="AtribuirEquipamento" component={AtribuirEquipamento} options={{ headerShown: false }} />
                </Stack.Navigator>
            </NavigationContainer>
        </IdleProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1a3a1a',
    },
});