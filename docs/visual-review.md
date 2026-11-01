# Revisão visual do AEGIS

Revisão de 31/10/2026 na branch `design/clean-aegis`, preparada no Vercel Sandbox sem modificar a cópia local do projeto. A entrega continua no PR #1 para revisão antes de integrar à main.

## Resultado

| Verificação | Resultado |
| --- | --- |
| Testes existentes do Node.js | 25 aprovados |
| Páginas e scripts | 13 HTMLs, 14 JavaScripts; sintaxe e referências válidas; CSS analisado com PostCSS |
| Layout e inicialização | 65 combinações de página/resolução; sem rolagem horizontal da página, imagens quebradas, erros de JavaScript, erros no console ou requisições malsucedidas |
| Login | Sem rolagem inicial nas cinco resoluções; Entrar e Solicitar acesso com largura e altura iguais |
| Acessibilidade automatizada | 26 análises axe, nas 13 telas em 1440×900 e 360×640, sem violações nas regras WCAG A/AA de 2.0 e 2.1 |
| Interações | 43 cenários aprovados em desktop e celular emulado |

As resoluções usadas foram 1440×900, 1366×768, 1280×720, 390×844 e 360×640. As cinco pranchas abaixo foram inspecionadas visualmente; os registros numéricos e os hashes dos arquivos testados estão em [verification.json](verification.json).

## Alterações verificadas

- Login com altura e espaçamento adaptáveis, rodapé no fluxo e ação Solicitar acesso branca com texto azul.
- Solicitação com fundo em toda a página, formulário integrado e protocolo com foco após o envio.
- Menu à esquerda, acionador antes da logo, navegação ativa, foco contido, Escape e retorno ao acionador, incluindo o Laboratório.
- Indicadores mais compactos no celular, tabelas com rolagem interna, campos e ações consistentes, mensagens de erro anunciadas.
- Contraste corrigido nos rótulos do painel, etapas do Laboratório e filtro ativo de movimentação.
- Contenção corrigida para textos acessíveis das tabelas e nomes institucionais de até 80 caracteres.

Os cenários exercitam validação e demonstração do login; menu nas dez telas internas com mouse, toque emulado e teclado; busca e lista vazia; cadastro, duplicidade, edição, recarga e exclusão de aluno; observações; acesso e encerramento PRB; preferências e consulta; suporte; solicitação e protocolo; exportação CSV; rolagem interna de tabelas; nome institucional longo; espaço reduzido e movimento reduzido.

## Capturas

| Estado | Evidência |
| --- | --- |
| Login, 1280×720 | [Desktop](visual/login-desktop.png) |
| Login, 360×640 | [Celular](visual/login-mobile.png) |
| Solicitação, 1440×900 | [Formulário integrado](visual/request-desktop.png) |
| Painel, 1440×900 | [Dados gerais](visual/dashboard-desktop.png) |
| Menu, 360×640 | [Navegação aberta](visual/menu-mobile.png) |
| Solicitação concluída, 360×640 | [Protocolo](visual/request-success-mobile.png) |

[Prancha 1440×900](visual/board-1440x900.jpg) · [Prancha 1366×768](visual/board-1366x768.jpg) · [Prancha 1280×720](visual/board-1280x720.jpg) · [Prancha 390×844](visual/board-390x844.jpg) · [Prancha 360×640](visual/board-360x640.jpg)

## Reproduzir

Ambiente usado: Node.js 24.22.1, Playwright 1.64.1, Chromium 156.0.8078.4, axe Playwright 4.14.0 e PostCSS 8.5.32. As dependências de revisão foram instaladas fora do código da aplicação.

Em um ambiente Linux isolado, na raiz do repositório:

```sh
node --test aegis_shared.test.cjs developer_frontend.test.cjs
npm install --prefix /tmp/aegis-qa playwright@1.64.1 @axe-core/playwright@4.14.0 postcss@8.5.32
node /tmp/aegis-qa/node_modules/playwright/cli.js install --with-deps chromium
python3 -m http.server 8080 --bind 0.0.0.0
```

Com o servidor em execução, em outro terminal:

```sh
NODE_PATH=/tmp/aegis-qa/node_modules node tests/browser-review.cjs
NODE_PATH=/tmp/aegis-qa/node_modules node tests/browser-flows.cjs
```

O Chromium resolve `aegis.test` para 127.0.0.1 apenas nesses testes. Isso reproduz a condição de hospedagem estática, mantendo o Laboratório no estado de servidor local necessário. `AEGIS_BASE_URL` permite escolher outra origem; `AEGIS_ARTIFACT_DIR` permite escolher a pasta das capturas e relatórios. Por padrão, os artefatos ficam na pasta temporária do sistema. Os cenários usam contextos de navegador isolados e dados de teste.

## Limites da verificação

A validação foi executada no Chromium headless. Os tamanhos de celular e os eventos de toque foram emulados. O cenário equivalente a zoom de 200% usa viewport CSS de 683×384 com escala 2; o teclado virtual foi representado por redução da altura disponível. Isso verifica reorganização, rolagem e acesso às ações, sem substituir testes com zoom do navegador e teclado em aparelho físico. Não foram verificados Safari, Firefox nem o processamento facial no servidor Python.

A ausência de violações no axe se refere às regras automatizadas executadas; não é uma certificação completa de acessibilidade.
