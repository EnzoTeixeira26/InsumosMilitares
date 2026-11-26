export function validarSenhaForte(senha) {
    const erros = [];
    if (!senha || senha.length < 8) erros.push('Mínimo de 8 caracteres');
    if (!/[A-Z]/.test(senha)) erros.push('Uma letra maiúscula');
    if (!/[a-z]/.test(senha)) erros.push('Uma letra minúscula');
    if (!/[0-9]/.test(senha)) erros.push('Um número');
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/.test(senha)) erros.push('Um caractere especial');
    return { valida: erros.length === 0, erros };
}

export function calcularForcaSenha(senha) {
    if (!senha) return { nivel: 0, label: 'Vazia', cor: '#666', percentual: 0 };

    let pontos = 0;
    if (senha.length >= 8) pontos++;
    if (senha.length >= 12) pontos++;
    if (/[A-Z]/.test(senha)) pontos++;
    if (/[a-z]/.test(senha)) pontos++;
    if (/[0-9]/.test(senha)) pontos++;
    if (/[!@#$%^&*(),.?":{}|<>_\-+=/\\[\];'`~]/.test(senha)) pontos++;

    if (pontos <= 2) return { nivel: 1, label: 'Fraca', cor: '#F44336', percentual: 20 };
    if (pontos <= 3) return { nivel: 2, label: 'Média', cor: '#FF9800', percentual: 40 };
    if (pontos <= 4) return { nivel: 3, label: 'Boa', cor: '#FFC107', percentual: 60 };
    if (pontos <= 5) return { nivel: 4, label: 'Forte', cor: '#4CAF50', percentual: 80 };
    return { nivel: 5, label: 'Muito Forte', cor: '#2E7D32', percentual: 100 };
}