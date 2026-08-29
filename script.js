const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valor);
};

const converterParaNumero = (valor) => {
    const valorLimpo = String(valor ?? '')
        .replace(/\./g, '')
        .replace(',', '.');

    const numero = Number(valorLimpo);
    return Number.isFinite(numero) ? numero : NaN;
};

const aplicarMascaraMoeda = (elemento) => {
    const valorAtual = elemento.value;
    const apenasNumeros = valorAtual.replace(/[^\d]/g, '');

    if (!apenasNumeros) {
        elemento.value = '';
        return;
    }

    const numero = Number(apenasNumeros) / 100;
    elemento.value = formatarMoeda(numero);
};

const aplicarMascaraTaxa = (elemento) => {
    const valorAtual = elemento.value;
    const apenasNumeros = valorAtual.replace(/[^\d,]/g, '').replace(',', '.');

    if (!apenasNumeros || apenasNumeros === '.') {
        elemento.value = '';
        return;
    }

    const numero = Number(apenasNumeros);
    if (!Number.isFinite(numero)) {
        elemento.value = '';
        return;
    }

    elemento.value = numero.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
};

const campoValor = document.getElementById('valor');
const campoEntrada = document.getElementById('entrada');
const campoTaxa = document.getElementById('taxa');
const campoRenda = document.getElementById('renda');
const campoMeses = document.getElementById('meses');

// --- BUSCAR TAXA DO BANCO CENTRAL AO CARREGAR A PÁGINA ---
async function buscarTaxaBancoCentral() {
    try {
        const resposta = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.4391/dados/ultimos/1?formato=json');
        const dados = await resposta.json();
        
        if (dados && dados.length > 0) {
            const valorTaxaDiaria = parseFloat(dados[0].valor);
            const taxaAnualEstimada = (valorTaxaDiaria * 12).toFixed(2).replace('.', ',');
            
            if (campoTaxa && !campoTaxa.value) {
                campoTaxa.value = taxaAnualEstimada;
            }
        }
    } catch (error) {
        console.error('Não foi possível carregar a taxa do Banco Central:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    buscarTaxaBancoCentral();
});

if (campoValor) {
    campoValor.addEventListener('input', () => aplicarMascaraMoeda(campoValor));
}

if (campoEntrada) {
    campoEntrada.addEventListener('input', () => aplicarMascaraMoeda(campoEntrada));
}

if (campoRenda) {
    campoRenda.addEventListener('input', () => aplicarMascaraMoeda(campoRenda));
}

if (campoTaxa) {
    campoTaxa.addEventListener('input', () => aplicarMascaraTaxa(campoTaxa));
}

if (campoMeses) {
    campoMeses.addEventListener('input', () => {
        campoMeses.value = campoMeses.value.replace(/\D/g, '');
    });
}

document.getElementById('form-simulador').addEventListener('submit', function(e) {
    e.preventDefault();

    const valorImovel = converterParaNumero(document.getElementById('valor').value);
    const valorEntrada = converterParaNumero(document.getElementById('entrada').value) || 0;
    const taxaAnual = converterParaNumero(document.getElementById('taxa').value);
    const prazoMeses = parseInt(document.getElementById('meses').value.replace(/\D/g, ''), 10);
    const rendaMensal = converterParaNumero(document.getElementById('renda').value);
    const alertaRenda = document.getElementById('alerta-renda');

    if (
        !Number.isFinite(valorImovel) || valorImovel <= 0 ||
        valorEntrada < 0 || valorEntrada >= valorImovel ||
        !Number.isFinite(taxaAnual) || taxaAnual < 0 ||
        !Number.isFinite(prazoMeses) || prazoMeses <= 0 ||
        !Number.isFinite(rendaMensal) || rendaMensal <= 0
    ) {
        alertaRenda.className = 'alerta reprovado';
        alertaRenda.textContent = 'Preencha valores válidos. A entrada não pode ser maior ou igual ao valor total do imóvel.';
        document.getElementById('resultados').classList.add('oculto');
        return;
    }

    // O valor principal financiado é o total do imóvel menos a entrada informada
    const valorPrincipal = valorImovel - valorEntrada;
    const taxaMensal = (taxaAnual / 100) / 12;

    // --- CÁLCULO SISTEMA PRICE ---
    let prestacaoPrice = 0;
    if (taxaMensal === 0) {
        prestacaoPrice = valorPrincipal / prazoMeses;
    } else {
        const fatorPrice = Math.pow(1 + taxaMensal, prazoMeses);
        prestacaoPrice = valorPrincipal * (taxaMensal * fatorPrice) / (fatorPrice - 1);
    }

    const totalPagoPrice = prestacaoPrice * prazoMeses;
    const totalJurosPrice = totalPagoPrice - valorPrincipal;

    // --- CÁLCULO SISTEMA SAC ---
    const amortizacaoSac = valorPrincipal / prazoMeses;
    let saldoDevedorSac = valorPrincipal;
    let totalPagoSac = 0;
    let totalJurosSac = 0;
    let primeiraParcelaSac = 0;
    let ultimaParcelaSac = 0;

    let linhasTabelaHTML = '';

    for (let mes = 1; mes <= prazoMeses; mes++) {
        const jurosSac = saldoDevedorSac * taxaMensal;
        const prestacaoSac = amortizacaoSac + jurosSac;

        if (mes === 1) primeiraParcelaSac = prestacaoSac;
        if (mes === prazoMeses) ultimaParcelaSac = prestacaoSac;

        totalPagoSac += prestacaoSac;
        totalJurosSac += jurosSac;
        saldoDevedorSac -= amortizacaoSac;

        if (mes <= 60) {
            linhasTabelaHTML += `
                <tr>
                    <td>${mes}</td>
                    <td>R$ ${formatarMoeda(amortizacaoSac)}</td>
                    <td>R$ ${formatarMoeda(jurosSac)}</td>
                    <td>R$ ${formatarMoeda(prestacaoSac)}</td>
                    <td>R$ ${formatarMoeda(prestacaoPrice)}</td>
                </tr>
            `;
        }
    }

    const limiteRenda = rendaMensal * 0.30;
    const maiorParcela = Math.max(primeiraParcelaSac, prestacaoPrice);

    if (maiorParcela <= limiteRenda) {
        alertaRenda.className = 'alerta aprovado';
        alertaRenda.textContent = `Aprovado! A maior parcela (R$ ${formatarMoeda(maiorParcela)}) compromete ${((maiorParcela / rendaMensal) * 100).toFixed(1)}% da sua renda, ficando abaixo do limite de 30% (R$ ${formatarMoeda(limiteRenda)}).`;
    } else {
        // --- CÁLCULO DA ENTRADA NECESSÁRIA PARA APROVAÇÃO ---
        // Quanto o valor principal deveria ser para que a maior parcela fosse igual ao limiteRenda?
        // Como o financiamento é linear em relação ao principal, podemos fazer uma proporção:
        const principalMaxPermitido = valorPrincipal * (limiteRenda / maiorParcela);
        const valorTotalFinanciamentoNecessario = valorImovel - principalMaxPermitido;
        const entradaAdicionalNecessaria = valorTotalFinanciamentoNecessario - valorEntrada;

        alertaRenda.className = 'alerta reprovado';
        alertaRenda.innerHTML = `Atenção! A maior parcela (R$ ${formatarMoeda(maiorParcela)}) compromete ${((maiorParcela / rendaMensal) * 100).toFixed(1)}% da sua renda (limite de 30% = R$ ${formatarMoeda(limiteRenda)}).<br><br>` +
            `💡 <strong>Dica do Simulador:</strong> Para caber no seu orçamento, você precisa dar uma <strong>entrada adicional de R$ ${formatarMoeda(entradaAdicionalNecessaria)}</strong> (totalizando uma entrada de R$ ${formatarMoeda(valorTotalFinanciamentoNecessario)}).`;
    }

    document.getElementById('price-parcela').textContent = `R$ ${formatarMoeda(prestacaoPrice)}`;
    document.getElementById('price-total').textContent = `R$ ${formatarMoeda(totalPagoPrice)}`;
    document.getElementById('price-juros').textContent = `R$ ${formatarMoeda(totalJurosPrice)}`;

    document.getElementById('sac-primeira').textContent = `R$ ${formatarMoeda(primeiraParcelaSac)}`;
    document.getElementById('sac-ultima').textContent = `R$ ${formatarMoeda(ultimaParcelaSac)}`;
    document.getElementById('sac-total').textContent = `R$ ${formatarMoeda(totalPagoSac)}`;
    document.getElementById('sac-juros').textContent = `R$ ${formatarMoeda(totalJurosSac)}`;

    document.getElementById('corpo-tabela').innerHTML = linhasTabelaHTML;
    document.getElementById('resultados').classList.remove('oculto');
});