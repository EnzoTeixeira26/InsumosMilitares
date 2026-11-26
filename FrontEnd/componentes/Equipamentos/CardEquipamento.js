import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';

export default function CardEquipamento({ item, onEditar, onExcluir, usuarioPerfil }) {
    
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

    return (
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
                {item.validade && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Validade:</Text>
                        <Text style={styles.infoValue}>{item.validade}</Text>
                    </View>
                )}
                {item.descricao && (
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Descrição:</Text>
                        <Text style={styles.infoValueDesc}>{item.descricao}</Text>
                    </View>
                )}
            </View>
            
            {usuarioPerfil === 'ADMINISTRADOR' && (
                <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.editButton} onPress={() => onEditar(item)}>
                        <Ionicons name="create" size={16} color="#fff" />
                        <Text style={styles.actionText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => onExcluir(item)}>
                        <Ionicons name="trash" size={16} color="#fff" />
                        <Text style={styles.actionText}>Excluir</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
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
        fontSize: 12,
        color: '#ccc',
        width: 80,
    },
    infoValue: {
        fontSize: 12,
        color: '#fff',
        flex: 1,
    },
    infoValueDesc: {
        fontSize: 11,
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
});