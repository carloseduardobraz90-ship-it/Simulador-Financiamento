const temaButton = document.getElementById('btn-tema');

if (temaButton) {
    const aplicarTema = (tema) => {
        document.body.setAttribute('data-theme', tema);

        const icone = tema === 'light' ? '☀️' : '🌙';
        const span = temaButton.querySelector('span');

        if (span) {
            span.textContent = icone;
        }

        temaButton.setAttribute(
            'aria-label',
            tema === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'
        );
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

    const numero = Number(texto);
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

        // --- CÁLCULO SISTEMA PRICE ---
        let prestacaoPrice = 0;
        if (taxaMensal === 0) {
            prestacaoPrice = valorFinanciado / prazoMeses;
        } else {
            const fatorPrice = Math.pow(1 + taxaMensal, prazoMeses);
            prestacaoPrice = valorFinanciado * (taxaMensal * fatorPrice) / (fatorPrice - 1);
        }

        const totalPagoPrice = prestacaoPrice * prazoMeses;
        const totalJurosPrice = totalPagoPrice - valorFinanciado;

        // --- CÁLCULO SISTEMA SAC ---
        const amortizacaoSac = valorFinanciado / prazoMeses;
        let saldoDevedorSac = valorFinanciado;
        let totalPagoSac = 0;
        let totalJurosSac = 0;
        let primeiraParcelaSac = 0;
        let ultimaParcelaSac = 0;

        const estruturaGrafico = {
            labels: [],
            price: [],
            sac: []
        };

        let linhasTabelaHTML = '';

        for (let mes = 1; mes <= prazoMeses; mes++) {
            const jurosSac = saldoDevedorSac * taxaMensal;
            const prestacaoSac = amortizacaoSac + jurosSac;

            if (mes === 1) primeiraParcelaSac = prestacaoSac;
            if (mes === prazoMeses) ultimaParcelaSac = prestacaoSac;

            totalPagoSac += prestacaoSac;
            totalJurosSac += jurosSac;
            saldoDevedorSac -= amortizacaoSac;

            estruturaGrafico.labels.push(String(mes));
            estruturaGrafico.price.push(prestacaoPrice);
            estruturaGrafico.sac.push(prestacaoSac);

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

        const ctx = document.getElementById('graficoJuros');
        if (ctx) {
            if (window.graficoJurosInstancia) {
                window.graficoJurosInstancia.destroy();
            }

            window.graficoJurosInstancia = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: estruturaGrafico.labels,
                    datasets: [
                        {
                            label: 'Sistema PRICE',
                            data: estruturaGrafico.price,
                            borderColor: '#36A2EB',
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderWidth: 2,
                            tension: 0.2,
                            fill: false
                        },
                        {
                            label: 'Sistema SAC',
                            data: estruturaGrafico.sac,
                            borderColor: '#FF6384',
                            backgroundColor: 'rgba(255, 99, 132, 0.2)',
                            borderWidth: 2,
                            tension: 0.2,
                            fill: false
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: '#dfe6e9'
                            }
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                color: '#dfe6e9'
                            },
                            grid: {
                                color: 'rgba(255,255,255,0.08)'
                            }
                        },
                        y: {
                            ticks: {
                                color: '#dfe6e9',
                                callback: function(value) {
                                    return 'R$ ' + Number(value).toLocaleString('pt-BR', {
                                        maximumFractionDigits: 0
                                    });
                                }
                            },
                            grid: {
                                color: 'rgba(255,255,255,0.08)'
                            }
                        }
                    }
                }
            });
        }

        document.getElementById('resultados').classList.remove('oculto');
    });
}