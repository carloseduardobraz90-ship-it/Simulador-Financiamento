const temaButton = document.getElementById('btn-tema');

if (temaButton) {
    const aplicarTema = (tema) => {
        document.body.setAttribute('data-theme', tema);
        const icone = tema === 'light' ? '☀️' : '🌙';
        const span = temaButton.querySelector('span');
        if (span) span.textContent = icone;
        temaButton.setAttribute('aria-label', tema === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro');
    };

    aplicarTema(document.body.getAttribute('data-theme') || 'dark');

    temaButton.addEventListener('click', () => {
        const temaAtual = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
        aplicarTema(temaAtual);
    });
}

const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(valor || 0));
};

const converterParaNumero = (valor) => {
    const texto = String(valor ?? '')
        .replace(/\./g, '')
        .replace(',', '.');
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : NaN;
};

const aplicarMascaraMoeda = (elemento) => {
    const texto = String(elemento.value ?? '').replace(/\D/g, '');
    if (!texto) {
        elemento.value = '';
        return;
    }
    const numero = Number(texto) / 100;
    elemento.value = formatarMoeda(numero);
};

const aplicarMascaraTaxa = (elemento) => {
    const texto = String(elemento.value ?? '').replace(',', '.');
    const somenteNumeros = texto.replace(/[^\d.]/g, '');
    if (!somenteNumeros || somenteNumeros === '.') {
        elemento.value = '';
        return;
    }
    const numero = Number(somenteNumeros);
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
const campoMeses = document.getElementById('meses');
const campoRenda = document.getElementById('renda');

if (campoValor) campoValor.addEventListener('input', () => aplicarMascaraMoeda(campoValor));
if (campoEntrada) campoEntrada.addEventListener('input', () => aplicarMascaraMoeda(campoEntrada));
if (campoRenda) campoRenda.addEventListener('input', () => aplicarMascaraMoeda(campoRenda));
if (campoTaxa) campoTaxa.addEventListener('input', () => aplicarMascaraTaxa(campoTaxa));
if (campoMeses) {
    campoMeses.addEventListener('input', () => {
        campoMeses.value = campoMeses.value.replace(/\D/g, '');
    });
}

// --- FUNÇÃO DE BUSCA DA TAXA NO BANCO CENTRAL (API SGS/BCB) ---
// Usamos a série 432 (Taxa média de juros de financiamento imobiliário PF) ou a 11 (Selic acumulada mensalizada). 
// Vamos buscar a série 432 como referência imobiliária padrão real.
async function buscarTaxaBancoCentral() {
    if (!campoTaxa) return;
    
    try {
        // API do Banco Central - último valor da série 432 (Crédito Imobiliário PF)
        const resposta = await fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');
        if (!resposta.ok) throw new Error('Erro ao buscar taxa da API');
        
        const dados = await resposta.json();
        if (dados && dados.length > 0) {
            const taxaBcb = Number(dados[0].valor);
            if (Number.isFinite(taxaBcb)) {
                // Formata para o padrão brasileiro (ex: 10,50)
                campoTaxa.value = taxaBcb.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }
        }
    } catch (erro) {
        console.warn('Não foi possível carregar a taxa do Banco Central automaticamente, mantendo valor padrão.', erro);
        // Fallback caso a API esteja bloqueada por CORS em algum ambiente restrito
        if (!campoTaxa.value) {
            campoTaxa.value = '10,50';
        }
    }
}

// Executa a busca assim que a página carrega
window.addEventListener('DOMContentLoaded', () => {
    buscarTaxaBancoCentral();
});

const formSimulador = document.getElementById('form-simulador');

if (formSimulador) {
    formSimulador.addEventListener('submit', function(e) {
        e.preventDefault();

        const valorPrincipal = converterParaNumero(document.getElementById('valor').value);
        const entrada = converterParaNumero(document.getElementById('entrada').value || '0');
        const taxaAnual = converterParaNumero(document.getElementById('taxa').value);
        const prazoMeses = parseInt(document.getElementById('meses').value.replace(/\D/g, ''), 10);
        const rendaMensal = converterParaNumero(document.getElementById('renda').value);
        const alertaRenda = document.getElementById('alerta-renda');

        const valorFinanciado = Math.max(valorPrincipal - entrada, 0);

        if (
            !Number.isFinite(valorPrincipal) || valorPrincipal <= 0 ||
            !Number.isFinite(taxaAnual) || taxaAnual < 0 ||
            !Number.isFinite(prazoMeses) || prazoMeses <= 0 ||
            !Number.isFinite(rendaMensal) || rendaMensal <= 0 ||
            valorFinanciado <= 0
        ) {
            alertaRenda.className = 'alerta reprovado';
            alertaRenda.textContent = 'Preencha todos os campos corretamente: valor maior que zero, prazo em meses válido, renda maior que zero e entrada não superior ao valor do imóvel.';
            document.getElementById('resultados').classList.add('oculto');
            return;
        }

        const taxaMensal = (taxaAnual / 100) / 12;

        let prestacaoPrice = 0;
        if (taxaMensal === 0) {
            prestacaoPrice = valorFinanciado / prazoMeses;
        } else {
            const fatorPrice = Math.pow(1 + taxaMensal, prazoMeses);
            prestacaoPrice = valorFinanciado * (taxaMensal * fatorPrice) / (fatorPrice - 1);
        }

        const totalPagoPrice = prestacaoPrice * prazoMeses;
        const totalJurosPrice = totalPagoPrice - valorFinanciado;

        const amortizacaoSac = valorFinanciado / prazoMeses;
        let saldoDevedorSac = valorFinanciado;
        let totalPagoSac = 0;
        let totalJurosSac = 0;
        let primeiraParcelaSac = 0;
        let ultimaParcelaSac = 0;

        const mesesRotulos = [];
        const valoresJurosSac = [];
        const valoresParcelaSac = [];
        const valoresParcelaPrice = [];
        let linhasTabelaHTML = '';

        for (let mes = 1; mes <= prazoMeses; mes++) {
            const jurosSac = saldoDevedorSac * taxaMensal;
            const prestacaoSac = amortizacaoSac + jurosSac;

            if (mes === 1) primeiraParcelaSac = prestacaoSac;
            if (mes === prazoMeses) ultimaParcelaSac = prestacaoSac;

            totalPagoSac += prestacaoSac;
            totalJurosSac += jurosSac;
            saldoDevedorSac -= amortizacaoSac;

            if (prazoMeses <= 60 || mes % 12 === 0 || mes === 1) {
                mesesRotulos.push(`Mês ${mes}`);
                valoresJurosSac.push(Number(jurosSac.toFixed(2)));
                valoresParcelaSac.push(Number(prestacaoSac.toFixed(2)));
                valoresParcelaPrice.push(Number(prestacaoPrice.toFixed(2)));
            }

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
            alertaRenda.className = 'alerta reprovado';
            alertaRenda.textContent = `Atenção! A maior parcela (R$ ${formatarMoeda(maiorParcela)}) compromete ${((maiorParcela / rendaMensal) * 100).toFixed(1)}% da sua renda, ultrapassando o limite recomendado de 30% (R$ ${formatarMoeda(limiteRenda)}).`;
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

        const ctx = document.getElementById('graficoJuros');
        if (ctx) {
            if (window.graficoJurosInstancia) {
                window.graficoJurosInstancia.destroy();
            }

            window.graficoJurosInstancia = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: mesesRotulos,
                    datasets: [
                        {
                            label: 'Juros Mensais (SAC)',
                            data: valoresJurosSac,
                            borderColor: '#e74c3c',
                            backgroundColor: 'rgba(231, 76, 60, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3
                        },
                        {
                            label: 'Parcela Mensal (SAC)',
                            data: valoresParcelaSac,
                            borderColor: '#3498db',
                            borderWidth: 2,
                            tension: 0.3
                        },
                        {
                            label: 'Parcela Fixa (PRICE)',
                            data: valoresParcelaPrice,
                            borderColor: '#2ecc71',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: getComputedStyle(document.body).getPropertyValue('--text-main')
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: getComputedStyle(document.body).getPropertyValue('--border')
                            },
                            ticks: {
                                color: getComputedStyle(document.body).getPropertyValue('--text-muted'),
                                callback: function(value) {
                                    return 'R$ ' + Number(value).toLocaleString('pt-BR');
                                }
                            }
                        },
                        x: {
                            grid: {
                                color: getComputedStyle(document.body).getPropertyValue('--border')
                            },
                            ticks: {
                                color: getComputedStyle(document.body).getPropertyValue('--text-muted')
                            }
                        }
                    }
                }
            });
        }
    });
}