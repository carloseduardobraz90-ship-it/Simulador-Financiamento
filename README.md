# 📊 Simulador de Financiamento Imobiliário: SAC vs. PRICE

[![Status](https://img.shields.io/badge/Status-Concluído-success?style=for-the-badge)]()
[![Tecnologias](https://img.shields.io/badge/Tecnologias-HTML5_%7C_CSS3_%7C_JavaScript-blue?style=for-the-badge)]()

Aplicação web desenvolvida como **Desafio Prático de APIs REST** para comparar os sistemas de amortização de financiamentos imobiliários **SAC (Sistema de Amortização Crescente)** e **PRICE (Tabela Price)**, integrando dados em tempo real do **Banco Central do Brasil**.

---

## 🚀 Funcionalidades da Aplicação

- **Integração com API do Banco Central (BCB):** Consulta automática da taxa de juros de referência ao carregar a página, com total liberdade para personalização manual.
- **Entrada Personalizada:** Permite informar o valor que você possui de entrada para calcular o saldo devedor real.
- **Análise Automática de Renda (Regra dos 30%):** Verifica se a maior parcela do financiamento compromete mais de 30% da sua renda mensal informada.
- **Calculadora Reversa de Entrada:** Caso a parcela ultrapasse o limite de 30%, o sistema calcula exatamente *quanto de entrada adicional* você precisa dar para aprovar o financiamento.
- **Tabela Comparativa de Evolução:** Exibe detalhadamente a amortização, os juros e as parcelas mês a mês para ambos os sistemas.
- **Máscaras e Formatação Monetária:** Entradas formatadas automaticamente no padrão de moeda brasileira (`R$`).

---

## 🛠️ Tecnologias Utilizadas

* **HTML5:** Estruturação semântica da página de formulário e resultados.
* **CSS3:** Estilização responsiva e moderna com variáveis, flexbox e design limpo.
* **JavaScript (ES6+):** Lógica matemática de amortização financeira, manipulação de DOM, máscaras de input e requisições assíncronas (`fetch`) com a API REST do Banco Central.

---

## 🖥️ Como Executar o Projeto Localmente

1. Clone o repositório em sua máquina:
   ```bash
   git clone [https://github.com/SEU_USUARIO/simulador-financiamento.git](https://github.com/SEU_USUARIO/simulador-financiamento.git)