# Awtorizei Mockup PDV

Mockup funcional em HTML, CSS e JavaScript puro para discutir fluxo e layout do PDV Awtorizei antes da API real.

## O que tem

- Login demonstrativo.
- Dashboard com indicadores, status fiscal e grafico semanal.
- Produtos, clientes e fornecedores com busca e cadastro em modal.
- Caixa/carrinho com pagamento, emissao fiscal simulada e baixa de estoque.
- Historico de vendas com documento fiscal clicavel.
- Tela de status fiscal com 11 estados.
- Configuracao fiscal com certificado mock, series e Homologacao/Producao.
- Banner de contingencia quando a SEFAZ fica offline.

## Regras de seguranca

- Sem API real.
- Sem CNPJ/CPF real.
- Sem certificado real.
- Sem chave fiscal real.
- Dados hardcoded apenas para mockup.

## Como abrir

Abra `index.html` no navegador. Ele e autonomo: CSS e JavaScript ficam embutidos para o mockup abrir com visual completo mesmo sem servidor.

Tambem pode rodar:

```bash
python3 -m http.server 8080
```

E acessar `http://localhost:8080`.
