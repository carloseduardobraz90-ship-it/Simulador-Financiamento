document.getElementById('form-simulador').addEventListener('submit', function(e) {
    e.preventDefault();

    // Captura dos valores do formulário
    const valorPrincipal = parseFloat(document.getElementById('valor').value);
    const taxaAnual = parseFloat(document.getElementById('taxa').value);
    const prazoMeses = parseInt(document.getElementById('meses').value);
    const rendaMensal = parseFloat(document.getElementById('renda').value);

    // Taxa de juros mensal
    const taxaMensal = (taxaAnual / 100) / 12;

    // --- CÁLCULO SISTEMA PRICE ---
    // PMT = PV * [ i * (1 + i)^n ] / [ (1 + i)^n - 1 ]
    const fatorPrice = Math.pow(1 + taxaMensal, prazoMeses);
    const prestacaoPrice = valorPrincipal * (taxaMensal * fatorPrice) / (fatorPrice - 1);
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

        // Preenche as primeiras 12 linhas ou todas se forem poucas na tabela para não travar
        if (mes <= 60) {
            linhasTabelaHTML += `
                <tr>
                    <td>${mes}</td>
                    <td>R$ ${amortizacaoSac.toFixed(2)}</td>
                    <td>R$ ${jurosSac.toFixed(2)}</td>
                    <td>R$ ${prestacaoSac.toFixed(2)}</td>
                    <td>R$ ${prestacaoPrice.toFixed(2)}</td>
                </tr>
            `;
        }
    }

    // --- ANÁLISE DE RENDA (30%) ---
    const limiteRenda = rendaMensal * 0.30;
    const maiorParcela = Math.max(primeiraParcelaSac, prestacaoPrice);
    const alertaRenda = document.getElementById('alerta-renda');

    if (maiorParcela <= limiteRenda) {
        alertaRenda.className = 'alerta aprovado';
        alertaRenda.textContent = `Aprovado! A maior parcela (R$ ${maiorParcela.toFixed(2)}) compromete ${((maiorParcela / rendaMensal) * 100).toFixed(1)}% da sua renda, ficando abaixo do limite de 30% (R$ ${limiteRenda.toFixed(2)}).`;
    } else {
        alertaRenda.className = 'alerta reprovado';
        alertaRenda.textContent = `Atenção! A maior parcela (R$ ${maiorParcela.toFixed(2)}) compromete ${((maiorParcela / rendaMensal) * 100).toFixed(1)}% da sua renda, ultrapassando o limite recomendado de 30% (R$ ${limiteRenda.toFixed(2)}).`;
    }

    // --- PREENCHIMENTO DOS RESULTADOS NA TELA ---
    document.getElementById('price-parcela').textContent = `R$ ${prestacaoPrice.toFixed(2)}`;
    document.getElementById('price-total').textContent = `R$ ${totalPagoPrice.toFixed(2)}`;
    document.getElementById('price-juros').textContent = `R$ ${totalJurosPrice.toFixed(2)}`;

    document.getElementById('sac-primeira').textContent = `R$ ${primeiraParcelaSac.toFixed(2)}`;
    document.getElementById('sac-ultima').textContent = `R$ ${ultimaParcelaSac.toFixed(2)}`;
    document.getElementById('sac-total').textContent = `R$ ${totalPagoSac.toFixed(2)}`;
    document.getElementById('sac-juros').textContent = `R$ ${totalJurosSac.toFixed(2)}`;

    document.getElementById('corpo-tabela').innerHTML = linhasTabelaHTML;
    document.getElementById('resultados').classList.remove('oculto');
});