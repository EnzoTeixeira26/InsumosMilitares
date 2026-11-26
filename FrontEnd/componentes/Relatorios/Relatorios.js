import { useState } from "react";
import {View,Text, ScrollView, StyleSheet, TouchableOpacity ,Modal , Platform,} from "react-native";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { API, VERSAO_ATUAL } from "../../config/api";

export default function Relatorios({ navigation }) {
    const [loading, setLoading] = useState(false);
    const [relatorioData, setRelatorioData] = useState(null);
    const [tipoRelatorio, setTipoRelatorio] = useState("EQUIPAMENTOS");
    const [pelotaoSelecionado, setPelotaoSelecionado] = useState("TODOS");
    const [modalVisible, setModalVisible] = useState(false);
    const [modalMensagem, setModalMensagem] = useState("");
    const [modalMensagemVisible, setModalMensagemVisible] = useState(false);

    const tiposRelatorio = [
        { id: "EQUIPAMENTOS", nome: "Relatório de Equipamentos", icone: "cube", descricao: "Lista completa de equipamentos por pelotão" },
        { id: "INSUMOS", nome: "Relatório de Insumos", icone: "stats-chart", descricao: "Estoque atual e movimentações" },
        { id: "PELOTOES", nome: "Relatório de Pelotões", icone: "people", descricao: "Efetivo e distribuição de soldados" },
        { id: "ALERTAS", nome: "Alertas de Estoque", icone: "warning", descricao: "Insumos com quantidade abaixo do mínimo" },
    ];

    const pelotoes = [
        { id: "TODOS", nome: "Todos os Pelotões" },
        { id: "SELVA", nome: "Pelotão Selva" },
        { id: "TANQUE", nome: "Pelotão Tanque" },
        { id: "JEEP", nome: "Pelotão Jeep" },
        { id: "PARAQUEDISTA", nome: "Pelotão Paraquedista" },
    ];

    const mostrarMensagem = (titulo, mensagem) => {
        setModalMensagem(`${titulo}: ${mensagem}`);
        setModalMensagemVisible(true);
        setTimeout(() => setModalMensagemVisible(false), 2500);
    };

    const gerarRelatorio = async () => {
        setLoading(true);
        setRelatorioData(null);

        try {
            let data = {};

            switch (tipoRelatorio) {
                case "EQUIPAMENTOS": {
                    const equipamentos = await axios.get(API.equipamento);
                    let equipamentosFiltrados = equipamentos.data;
                    if (pelotaoSelecionado !== "TODOS") {
                        equipamentosFiltrados = equipamentosFiltrados.filter(
                            (e) => e.tipoPelotao === pelotaoSelecionado.toLowerCase()
                        );
                    }
                    data = {
                        titulo: "Relatório de Equipamentos",
                        subtitulo: pelotaoSelecionado === "TODOS" ? "Todos os Pelotões" : pelotaoSelecionado,
                        dataGeracao: new Date().toLocaleString(),
                        itens: equipamentosFiltrados,
                        colunas: ["Nome", "Código", "Quantidade", "Status", "Pelotão"],
                    };
                    break;
                }

                case "INSUMOS": {
                    const insumos = await axios.get(API.insumo);
                    data = {
                        titulo: "Relatório de Insumos",
                        subtitulo: "Estoque atual",
                        dataGeracao: new Date().toLocaleString(),
                        itens: insumos.data,
                        colunas: ["Nome", "Categoria", "Quantidade", "Qtd Mínima", "Status"],
                    };
                    break;
                }

                case "PELOTOES": {
                    const soldados = await axios.get(API.soldado);
                    const pelotoesData = {};
                    soldados.data.forEach((s) => {
                        if (!pelotoesData[s.pelotao]) pelotoesData[s.pelotao] = [];
                        pelotoesData[s.pelotao].push(s);
                    });
                    data = {
                        titulo: "Relatório de Pelotões",
                        subtitulo: "Efetivo por unidade",
                        dataGeracao: new Date().toLocaleString(),
                        pelotoes: pelotoesData,
                        totalSoldados: soldados.data.length,
                    };
                    break;
                }

                case "ALERTAS": {
                    const insumosAlertas = await axios.get(API.insumo);
                    const alertas = insumosAlertas.data.filter((i) => i.quantidade <= i.quantidadeMinima);
                    data = {
                        titulo: "Alertas de Estoque",
                        subtitulo: "Insumos com quantidade abaixo do mínimo",
                        dataGeracao: new Date().toLocaleString(),
                        itens: alertas,
                        colunas: ["Nome", "Quantidade", "Qtd Mínima", "Unidade"],
                    };
                    break;
                }
            }

            setRelatorioData(data);
            setModalVisible(true);
        } catch (error) {
            console.error("Erro ao gerar relatório:", error);
            gerarRelatorioMock();
        } finally {
            setLoading(false);
        }
    };

    const gerarRelatorioMock = () => {
        let data = {};

        if (tipoRelatorio === "EQUIPAMENTOS") {
            data = {
                titulo: "Relatório de Equipamentos",
                subtitulo: pelotaoSelecionado === "TODOS" ? "Todos os Pelotões" : pelotaoSelecionado,
                dataGeracao: new Date().toLocaleString(),
                itens: [
                    { nome: "FACÃO", codigo: "SEL-001", quantidade: 50, status: "DISPONIVEL", tipoPelotao: "SELVA" },
                    { nome: "CANTIL", codigo: "SEL-002", quantidade: 100, status: "DISPONIVEL", tipoPelotao: "SELVA" },
                    { nome: "MUNIÇÃO 120mm", codigo: "TAN-001", quantidade: 200, status: "DISPONIVEL", tipoPelotao: "TANQUE" },
                    { nome: "RÁDIO TÁTICO", codigo: "JEEP-001", quantidade: 15, status: "MANUTENCAO", tipoPelotao: "JEEP" },
                    { nome: "PARAQUEDAS", codigo: "PAR-001", quantidade: 30, status: "DISPONIVEL", tipoPelotao: "PARAQUEDISTA" },
                ],
                colunas: ["Nome", "Código", "Quantidade", "Status", "Pelotão"],
            };
        } else if (tipoRelatorio === "INSUMOS") {
            data = {
                titulo: "Relatório de Insumos",
                subtitulo: "Estoque atual",
                dataGeracao: new Date().toLocaleString(),
                itens: [
                    { nome: "Munição 5.56mm", categoria: "MUNICAO", quantidade: 5000, quantidadeMinima: 1000, status: "OK" },
                    { nome: "Combustível Diesel", categoria: "COMBUSTIVEL", quantidade: 800, quantidadeMinima: 500, status: "OK" },
                    { nome: "Ração Operacional", categoria: "ALIMENTACAO", quantidade: 150, quantidadeMinima: 200, status: "BAIXO" },
                ],
                colunas: ["Nome", "Categoria", "Quantidade", "Qtd Mínima", "Status"],
            };
        } else if (tipoRelatorio === "PELOTOES") {
            data = {
                titulo: "Relatório de Pelotões",
                subtitulo: "Efetivo por unidade",
                dataGeracao: new Date().toLocaleString(),
                pelotoes: {
                    SELVA: [
                        { nome: "João Silva", patente: "Capitão", status: "ATIVO" },
                        { nome: "Pedro Santos", patente: "Tenente", status: "ATIVO" },
                    ],
                    TANQUE: [{ nome: "Carlos Souza", patente: "Major", status: "ATIVO" }],
                    JEEP: [{ nome: "Roberto Lima", patente: "Sargento", status: "LICENCA" }],
                    PARAQUEDISTA: [
                        { nome: "André Costa", patente: "Capitão", status: "ATIVO" },
                        { nome: "Felipe Rocha", patente: "Tenente", status: "ATIVO" },
                    ],
                },
                totalSoldados: 6,
            };
        } else if (tipoRelatorio === "ALERTAS") {
            data = {
                titulo: "Alertas de Estoque",
                subtitulo: "Insumos com quantidade abaixo do mínimo",
                dataGeracao: new Date().toLocaleString(),
                itens: [{ nome: "Ração Operacional", quantidade: 150, quantidadeMinima: 200, unidade: "KG"}],
                colunas: ["Nome", "Quantidade", "Qtd Mínima", "Unidade"],
            };
        }

        setRelatorioData(data);
        setModalVisible(true);
    };

    const gerarHTML = () => {
        if (!relatorioData) return "";

        let htmlContent = `
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #FFD700; padding-bottom: 20px; margin-bottom: 30px; }
                    .title { font-size: 24px; font-weight: bold; color: #1a3a1a; }
                    .subtitle { font-size: 16px; color: #666; margin-top: 5px; }
                    .date { font-size: 12px; color: #999; margin-top: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background-color: #1a3a1a; color: #FFD700; padding: 10px; text-align: left; border: 1px solid #ddd; }
                    td { padding: 8px; border: 1px solid #ddd; }
                    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #999; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">SGM-${VERSAO_ATUAL} - ${relatorioData.titulo}</div>
                    <div class="subtitle">${relatorioData.subtitulo}</div>
                    <div class="date">Gerado em: ${relatorioData.dataGeracao}</div>
                </div>
        `;

        if (tipoRelatorio === "PELOTOES") {
            for (const [pelotao, soldados] of Object.entries(relatorioData.pelotoes)) {
                htmlContent += `
                    <h3>${pelotao}</h3>
                    <table>
                        <thead>
                            <tr><th>Nome</th><th>Patente</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                `;
                soldados.forEach((soldado) => {
                    htmlContent += `
                        <tr>
                            <td>${soldado.nome}</td>
                            <td>${soldado.patente}</td>
                            <td>${soldado.status}</td>
                        </tr>
                    `;
                });
                htmlContent += `</tbody></table>`;
            }
            htmlContent += `<p><strong>Total de Soldados: ${relatorioData.totalSoldados}</strong></p>`;
        } else {
            htmlContent += `
                <table>
                    <thead>
                        <tr>${relatorioData.colunas.map((col) => `<th>${col}</th>`).join("")}</tr>
                    </thead>
                    <tbody>
            `;

            relatorioData.itens.forEach((item) => {
                htmlContent += "<tr>";
                if (tipoRelatorio === "EQUIPAMENTOS") {
                    htmlContent += `
                        <td>${item.nome}</td>
                        <td>${item.codigo}</td>
                        <td>${item.quantidade}</td>
                        <td>${item.status}</td>
                        <td>${item.tipoPelotao || pelotaoSelecionado}</td>
                    `;
                } else if (tipoRelatorio === "INSUMOS") {
                    htmlContent += `
                        <td>${item.nome}</td>
                        <td>${item.categoria}</td>
                        <td>${item.quantidade}</td>
                        <td>${item.quantidadeMinima}</td>
                        <td>${item.status}</td>
                    `;
                } else if (tipoRelatorio === "ALERTAS") {
                    htmlContent += `
                        <td>${item.nome}</td>
                        <td>${item.quantidade}</td>
                        <td>${item.quantidadeMinima}</td>
                        <td>${item.unidade}</td>
                    `;
                }
                htmlContent += "</tr>";
            });
            htmlContent += `</tbody></table>`;
        }

        htmlContent += `
                <div class="footer">
                    SGM-${VERSAO_ATUAL} - Sistema de Gestão Militar Integrada<br>
                    Exército Brasileiro - Documento Oficial
                </div>
            </body>
            </html>
        `;

        return htmlContent;
    };

    const exportarPDF = async () => {
        if (!relatorioData) return;

        const html = gerarHTML();
        const dataAtual = new Date();
        const dataStr = `${dataAtual.getFullYear()}-${dataAtual.getMonth() + 1}-${dataAtual.getDate()}_${dataAtual.getHours()}-${dataAtual.getMinutes()}`;
        const fileName = `${relatorioData.titulo.toLowerCase().replace(/ /g, "_")}_${dataStr}.pdf`;

        if (Platform.OS === "web") {
            try {
                const janela = window.open("", "_blank");

                if (!janela) {
                    mostrarMensagem("Erro", "Bloqueador de pop-up impediu a geração do PDF");
                    return;
                }

                janela.document.open();
                janela.document.write(html);
                janela.document.close();

                // Espera o conteúdo carregar antes de chamar print()
                janela.onload = () => {
                    janela.focus();
                    janela.print();

                    // Fecha a aba depois de um tempo
                    setTimeout(() => {
                        janela.close();
                    }, 1000);
                };

                // Fallback: alguns navegadores não disparam onload
                setTimeout(() => {
                    if (!janela.closed) {
                        try {
                            janela.focus();
                            janela.print();
                        } catch (e) {
                            // ignora
                        }
                    }
                }, 500);
            } catch (error) {
                console.error("Erro ao gerar PDF (Web):", error);
                mostrarMensagem("Erro", "Não foi possível gerar o PDF");
            }
            return;
        }

        // Versão pra mobile (Android / iOS)
        try {
            const { uri } = await Print.printToFileAsync({ html });

            const novoUri = `${FileSystem.cacheDirectory}${fileName}`;
            await FileSystem.moveAsync({ from: uri, to: novoUri });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(novoUri, {
                    mimeType: "application/pdf",
                    dialogTitle: "Salvar Relatório",
                    UTI: "com.adobe.pdf",
                });
            } else {
                mostrarMensagem("Sucesso", "PDF gerado com sucesso!");
            }
        } catch (error) {
            console.error("Erro ao gerar PDF (Mobile):", error);
            mostrarMensagem("Erro", "Não foi possível gerar o PDF");
        }
    };

    // CSV ( Planilhas ou excel e tal)
    const exportarCSV = async () => {
        if (!relatorioData || tipoRelatorio === "PELOTOES") {
            mostrarMensagem("Aviso", "Exportação CSV disponível apenas para relatórios tabulares");
            return;
        }

        try {
            let csvContent = relatorioData.colunas.join(",") + "\n";

            relatorioData.itens.forEach((item) => {
                let row = [];
                if (tipoRelatorio === "EQUIPAMENTOS") {
                    row = [`"${item.nome}"`, `"${item.codigo}"`, item.quantidade, `"${item.status}"`, `"${item.tipoPelotao || pelotaoSelecionado}"`];
                } else if (tipoRelatorio === "INSUMOS") {
                    row = [`"${item.nome}"`, `"${item.categoria}"`, item.quantidade, item.quantidadeMinima, `"${item.status}"`];
                } else if (tipoRelatorio === "ALERTAS") {
                    row = [`"${item.nome}"`, item.quantidade, item.quantidadeMinima, `"${item.unidade}"`];
                }
                csvContent += row.join(",") + "\n";
            });

            const dataAtual = new Date();
            const dataStr = `${dataAtual.getFullYear()}-${dataAtual.getMonth() + 1}-${dataAtual.getDate()}_${dataAtual.getHours()}-${dataAtual.getMinutes()}`;
            const fileName = `${relatorioData.titulo.toLowerCase().replace(/ /g, "_")}_${dataStr}.csv`;

            if (Platform.OS === "web") {
                const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.href = url;
                link.setAttribute("download", fileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                mostrarMensagem("Sucesso", "CSV baixado com sucesso!");
            } else {
                const filePath = `${FileSystem.cacheDirectory}${fileName}`;
                await FileSystem.writeAsStringAsync(filePath, csvContent, {
                    encoding: FileSystem.EncodingType.UTF8,
                });

                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(filePath, {
                        mimeType: "text/csv",
                        dialogTitle: "Salvar CSV",
                    });
                } else {
                    mostrarMensagem("Sucesso", "CSV gerado com sucesso!");
                }
            }
        } catch (error) {
            console.error("Erro ao exportar CSV:", error);
            mostrarMensagem("Erro", "Não foi possível exportar o CSV");
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1 }}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#FFD700" />
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
                <View style={styles.headerTop}>
                    <Ionicons name="document-text" size={32} color="#FFD700" />
                    <Text style={styles.headerTitle}>Relatórios</Text>
                </View>
                <Text style={styles.headerSubtitle}>Geração de relatórios gerenciais</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.sectionTitle}>Selecione o Tipo de Relatório</Text>

                {tiposRelatorio.map((tipo) => (
                    <TouchableOpacity
                        key={tipo.id}
                        style={[styles.tipoCard, tipoRelatorio === tipo.id && styles.tipoCardSelected]}
                        onPress={() => setTipoRelatorio(tipo.id)}
                    >
                        <View style={[styles.tipoIcone, { backgroundColor: tipoRelatorio === tipo.id ? "#FFD700" : "#2a4a2a" }]}>
                            <Ionicons name={tipo.icone} size={28} color={tipoRelatorio === tipo.id ? "#0a2a0a" : "#FFD700"} />
                        </View>
                        <View style={styles.tipoInfo}>
                            <Text style={[styles.tipoNome, tipoRelatorio === tipo.id && styles.tipoNomeSelected]}>{tipo.nome}</Text>
                            <Text style={styles.tipoDesc}>{tipo.descricao}</Text>
                        </View>
                        {tipoRelatorio === tipo.id && <Ionicons name="checkmark-circle" size={24} color="#FFD700" />}
                    </TouchableOpacity>
                ))}

                {tipoRelatorio === "EQUIPAMENTOS" && (
                    <View style={styles.filtroContainer}>
                        <Text style={styles.filtroLabel}>Filtrar por Pelotão:</Text>
                        <View style={styles.pelotaoContainer}>
                            {pelotoes.map((pelotao) => (
                                <TouchableOpacity
                                    key={pelotao.id}
                                    style={[styles.pelotaoFilter, pelotaoSelecionado === pelotao.id && styles.pelotaoFilterSelected]}
                                    onPress={() => setPelotaoSelecionado(pelotao.id)}
                                >
                                    <Text style={[styles.pelotaoFilterText, pelotaoSelecionado === pelotao.id && styles.pelotaoFilterTextSelected]}>
                                        {pelotao.nome}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.gerarButton, loading && styles.buttonDisabled]}
                    onPress={gerarRelatorio}
                    disabled={loading}
                >
                    <Ionicons name="document-text" size={24} color="#0a2a0a" />
                    <Text style={styles.gerarButtonText}>{loading ? "GERANDO..." : "GERAR RELATÓRIO"}</Text>
                </TouchableOpacity>
            </View>

            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{relatorioData?.titulo}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#FFD700" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            <Text style={styles.modalSubtitle}>{relatorioData?.subtitulo}</Text>
                            <Text style={styles.modalDate}>Gerado em: {relatorioData?.dataGeracao}</Text>

                            {tipoRelatorio === "PELOTOES" && relatorioData?.pelotoes ? (
                                Object.entries(relatorioData.pelotoes).map(([pelotao, soldados]) => (
                                    <View key={pelotao} style={styles.pelotaoSection}>
                                        <Text style={styles.pelotaoSectionTitle}>{pelotao}</Text>
                                        {soldados.map((soldado, index) => (
                                            <View key={index} style={styles.soldadoItem}>
                                                <Text style={styles.soldadoNome}>{soldado.nome}</Text>
                                                <Text style={styles.soldadoInfo}>
                                                    {soldado.patente} - {soldado.status}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                ))
                            ) : (
                                <View style={styles.tableContainer}>
                                    <View style={styles.tableHeader}>
                                        {relatorioData?.colunas?.map((col, index) => (
                                            <Text key={index} style={[styles.tableHeaderCell, { flex: 1 }]}>
                                                {col}
                                            </Text>
                                        ))}
                                    </View>
                                    {relatorioData?.itens?.map((item, idx) => (
                                        <View key={idx} style={styles.tableRow}>
                                            {tipoRelatorio === "EQUIPAMENTOS" && (
                                                <>
                                                    <Text style={styles.tableCell}>{item.nome}</Text>
                                                    <Text style={styles.tableCell}>{item.codigo}</Text>
                                                    <Text style={styles.tableCell}>{item.quantidade}</Text>
                                                    <Text style={styles.tableCell}>{item.status}</Text>
                                                    <Text style={styles.tableCell}>{item.tipoPelotao || pelotaoSelecionado}</Text>
                                                </>
                                            )}
                                            {tipoRelatorio === "INSUMOS" && (
                                                <>
                                                    <Text style={styles.tableCell}>{item.nome}</Text>
                                                    <Text style={styles.tableCell}>{item.categoria}</Text>
                                                    <Text style={styles.tableCell}>{item.quantidade}</Text>
                                                    <Text style={styles.tableCell}>{item.quantidadeMinima}</Text>
                                                    <Text style={[styles.tableCell, item.status === "BAIXO" && styles.statusWarning]}>
                                                        {item.status}
                                                    </Text>
                                                </>
                                            )}
                                            {tipoRelatorio === "ALERTAS" && (
                                                <>
                                                    <Text style={styles.tableCell}>{item.nome}</Text>
                                                    <Text style={styles.tableCell}>{item.quantidade}</Text>
                                                    <Text style={styles.tableCell}>{item.quantidadeMinima}</Text>
                                                    <Text style={styles.tableCell}>{item.unidade}</Text>
                                                </>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.exportButton} onPress={exportarPDF}>
                                <Ionicons name="document" size={20} color="#0a2a0a" />
                                <Text style={styles.exportButtonText}>PDF</Text>
                            </TouchableOpacity>
                            {tipoRelatorio !== "PELOTOES" && (
                                <TouchableOpacity style={styles.exportButton} onPress={exportarCSV}>
                                    <Ionicons name="tablet-portrait" size={20} color="#0a2a0a" />
                                    <Text style={styles.exportButtonText}>CSV</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal
                transparent={true}
                visible={modalMensagemVisible}
                animationType="fade"
                onRequestClose={() => setModalMensagemVisible(false)}
            >
                <View style={styles.modalMensagemOverlay}>
                    <View style={styles.modalMensagemContainer}>
                        <Ionicons name="checkmark-circle" size={50} color="#4CAF50" />
                        <Text style={styles.modalMensagemTitle}>{modalMensagem}</Text>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#1a3a1a",
    },
    header: {
        backgroundColor: "#0a2a0a",
        paddingVertical: 20,
        paddingHorizontal: 15,
        borderBottomWidth: 2,
        borderBottomColor: "#FFD700",
    },
    backButton: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    backButtonText: {
        color: "#FFD700",
        fontSize: 14,
        marginLeft: 5,
    },
    headerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFD700",
        fontFamily: "serif",
        letterSpacing: 1,
    },
    headerSubtitle: {
        fontSize: 12,
        color: "#ccc",
        textAlign: "center",
        marginTop: 5,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFD700",
        marginBottom: 15,
        textAlign: "center",
    },
    tipoCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#2a4a2a",
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "#FFD700",
    },
    tipoCardSelected: {
        backgroundColor: "#3a5a3a",
        borderWidth: 2,
    },
    tipoIcone: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 15,
    },
    tipoInfo: {
        flex: 1,
    },
    tipoNome: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFD700",
        marginBottom: 4,
    },
    tipoNomeSelected: {
        color: "#fff",
    },
    tipoDesc: {
        fontSize: 12,
        color: "#ccc",
    },
    filtroContainer: {
        marginTop: 20,
        marginBottom: 20,
        padding: 15,
        backgroundColor: "#2a4a2a",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#FFD700",
    },
    filtroLabel: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#FFD700",
        marginBottom: 10,
    },
    pelotaoContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    pelotaoFilter: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: "#1a3a1a",
        borderWidth: 1,
        borderColor: "#FFD700",
    },
    pelotaoFilterSelected: {
        backgroundColor: "#FFD700",
    },
    pelotaoFilterText: {
        fontSize: 12,
        color: "#FFD700",
        fontWeight: "bold",
    },
    pelotaoFilterTextSelected: {
        color: "#0a2a0a",
    },
    gerarButton: {
        backgroundColor: "#FFD700",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: 16,
        borderRadius: 25,
        marginTop: 20,
    },
    gerarButtonText: {
        color: "#0a2a0a",
        fontSize: 16,
        fontWeight: "bold",
        letterSpacing: 1,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(10, 42, 10, 0.95)",
    },
    modalContainer: {
        flex: 1,
        backgroundColor: "#2a4a2a",
        margin: 20,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: "#FFD700",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: "#FFD700",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFD700",
        flex: 1,
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    modalSubtitle: {
        fontSize: 14,
        color: "#ccc",
        textAlign: "center",
        marginBottom: 5,
    },
    modalDate: {
        fontSize: 11,
        color: "#888",
        textAlign: "center",
        marginBottom: 20,
    },
    pelotaoSection: {
        marginBottom: 20,
    },
    pelotaoSectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFD700",
        marginBottom: 10,
        paddingBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: "#FFD700",
    },
    soldadoItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: "#1a3a1a",
        borderRadius: 8,
        marginBottom: 5,
    },
    soldadoNome: {
        fontSize: 14,
        color: "#fff",
    },
    soldadoInfo: {
        fontSize: 12,
        color: "#ccc",
    },
    tableContainer: {
        marginTop: 10,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#1a3a1a",
        padding: 10,
        borderRadius: 8,
        marginBottom: 5,
    },
    tableHeaderCell: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#FFD700",
    },
    tableRow: {
        flexDirection: "row",
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#3a5a3a",
    },
    tableCell: {
        flex: 1,
        fontSize: 11,
        color: "#fff",
    },
    statusWarning: {
        color: "#FF9800",
        fontWeight: "bold",
    },
    modalFooter: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 20,
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: "#FFD700",
    },
    exportButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: "#FFD700",
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 25,
    },
    exportButtonText: {
        color: "#0a2a0a",
        fontSize: 14,
        fontWeight: "bold",
    },
    modalMensagemOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(10, 42, 10, 0.95)",
    },
    modalMensagemContainer: {
        backgroundColor: "#2a4a2a",
        padding: 25,
        borderRadius: 20,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#4CAF50",
        maxWidth: "85%",
    },
    modalMensagemTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#fff",
        marginTop: 10,
        textAlign: "center",
    },
});