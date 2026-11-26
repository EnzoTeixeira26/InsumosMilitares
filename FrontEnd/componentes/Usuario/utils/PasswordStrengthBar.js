import { View, Text, StyleSheet } from 'react-native';
import { calcularForcaSenha, validarSenhaForte } from './ValidacaoSenha';

export default function PasswordStrengthBar({ senha }) {
    const forca = calcularForcaSenha(senha);
    const { erros } = validarSenhaForte(senha);

    if (!senha) return null;

    return (
        <View style={styles.container}>
            <View style={styles.barBackground}>
                <View style={[styles.barFill, { width: `${forca.percentual}%`, backgroundColor: forca.cor }]} />
            </View>
            <Text style={[styles.label, { color: forca.cor }]}>Força: {forca.label}</Text>
            {erros.length > 0 && (
                <View style={styles.errosContainer}>
                    {erros.map((e, i) => (
                        <Text key={i} style={styles.erroText}>• {e}</Text>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { marginTop: 8, marginHorizontal: 5 },
    barBackground: { height: 6, backgroundColor: '#1a3a1a', borderRadius: 3, overflow: 'hidden' },
    barFill: { height: 6, borderRadius: 3 },
    label: { fontSize: 11, fontWeight: 'bold', marginTop: 4 },
    errosContainer: { marginTop: 5 },
    erroText: { fontSize: 11, color: '#ff6b6b', marginLeft: 4 },
});