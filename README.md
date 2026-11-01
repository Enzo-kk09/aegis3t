# AEGIS

Frontend de monitoramento de acesso escolar desenvolvido para o projeto de conclusão do curso técnico em Informática.

O sistema permite consultar identificações, acompanhar movimentações, gerenciar alunos, registrar observações e configurar preferências da instituição.

## Acesso

- Atualização visual e prévia atual: [PR #1](https://github.com/Enzo-kk09/aegis3t/pull/1).
- Evidências e procedimento de teste: [revisão visual](docs/visual-review.md).
- Repositório público: https://github.com/Enzo-kk09/aegis3t
- Instituição para teste: `CIMOL`
- Senha de acesso: `AEGIS2026`
- Código da área PRB: `123456`

Este é um frontend acadêmico. A sessão e os cadastros são armazenados no navegador. Os registros iniciais de identificação são exemplos; a aplicação publicada não realiza autenticação de produção nem reconhecimento facial ao vivo. O laboratório Developer Test depende de um servidor Python local, separado deste repositório.

## Checklist dos critérios de avaliação

| Critério | Implementação e verificação |
| --- | --- |
| Deploy e funcionamento | HTML, CSS, JavaScript e imagens com caminhos relativos. As referências das 13 páginas foram verificadas. A prévia usa a proteção padrão da conta Vercel e está vinculada ao PR #1. A integração à main permanece para revisão. |
| Interatividade sem recarregamento | Formulários tratados com `preventDefault()`. Cadastro, edição e exclusão de alunos, observações de movimentação e validação PRB verificados em testes de DOM. A navegação entre páginas utiliza um HTML por tela. |
| Persistência de dados | Cadastros, observações, solicitações e preferências usam `localStorage`; a sessão usa `sessionStorage`. Testes verificam leitura após abrir novamente a página e proteção contra gravações de abas desatualizadas. |
| Estabilidade do console | Os 25 testes Node.js e 43 cenários no Chromium passaram. As 13 páginas foram renderizadas em cinco resoluções sem erros de JavaScript, mensagens de erro no console ou requisições malsucedidas. O laboratório mantém sua dependência de servidor Python local. |
| Adaptabilidade, responsividade e acessibilidade | Layouts com grid flexível, menu recolhível, pontos de quebra para celular, tabelas com rolagem interna e acesso por teclado. HTML com `header`, `main`, `aside`, `nav`, `section`, `article` e `footer`, rótulos de campos, descrições de imagens e foco nos diálogos. Foram revisadas 65 combinações de tela e resolução, com 26 verificações axe sem violações automáticas nas regras WCAG A/AA de 2.0 e 2.1. Menu, foco, toque emulado, textos longos e persistência foram verificados; aparelhos físicos e outros navegadores não fazem parte desta execução. |

## Organização

- Um HTML e um JavaScript específico para cada tela.
- `AegisShared.js` reúne navegação, identidade visual e utilitários compartilhados.
- `style.css` é a única folha de estilos.
- `assets/` contém o fundo, a logo PNG transparente e o símbolo SVG.
- A nova apresentação preserva as chaves de armazenamento e os dados existentes.

## Validação

Os testes existentes podem ser executados com Node.js:

```sh
node --test aegis_shared.test.cjs developer_frontend.test.cjs
```

A revisão atual inclui análise sintática do CSS e dos JavaScripts, verificação de referências, 65 renderizações, 26 análises axe e 43 cenários de interação no Chromium. Os scripts reproduzíveis, comandos, capturas e limites estão no [relatório de revisão visual](docs/visual-review.md).

## Pendências acadêmicas fora do código

O PDF também exige caderno de campo, apresentação de até cinco minutos, documentação com citações indiretas e evidências de testes com usuários reais. O texto pede no mínimo cinco usuários, embora uma linha da rubrica mencione dois. Adotar cinco atende à exigência mais ampla. Testes automatizados não substituem esses participantes, e nenhum feedback de usuário foi inventado.
