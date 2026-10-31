# AEGIS

Frontend de monitoramento de acesso escolar desenvolvido para o projeto de conclusão do curso técnico em Informática.

O sistema permite consultar identificações, acompanhar movimentações, gerenciar alunos, registrar observações e configurar preferências da instituição.

## Acesso

- Repositório público: https://github.com/Enzo-kk09/aegis3t
- Instituição para teste: `CIMOL`
- Senha de acesso: `AEGIS2026`
- Código da área PRB: `123456`

Este é um frontend acadêmico. A sessão e os cadastros são armazenados no navegador. Os registros iniciais de identificação são exemplos; a aplicação publicada não realiza autenticação de produção nem reconhecimento facial ao vivo. O laboratório Developer Test depende de um servidor Python local, separado deste repositório.

## Checklist dos critérios de avaliação

| Critério | Implementação e verificação |
| --- | --- |
| Deploy e funcionamento | HTML, CSS, JavaScript e imagens com caminhos relativos. As referências locais das 13 páginas foram verificadas. O endereço publicado consta abaixo quando a publicação estiver concluída. |
| Interatividade sem recarregamento | Formulários tratados com `preventDefault()`. Cadastro, edição e exclusão de alunos, observações de movimentação e validação PRB verificados em testes de DOM. A navegação entre páginas utiliza um HTML por tela. |
| Persistência de dados | Cadastros, observações, solicitações e preferências usam `localStorage`; a sessão usa `sessionStorage`. Testes verificam leitura após abrir novamente a página e proteção contra gravações de abas desatualizadas. |
| Estabilidade do console | Os 25 testes existentes e as verificações locais de inicialização das 13 páginas passaram. O laboratório informa sua dependência local sem tentar conectar automaticamente em hospedagem estática. A revisão final no console de um navegador real permanece pendente por indisponibilidade da ferramenta de navegador nesta execução. |
| Adaptabilidade, responsividade e acessibilidade | Layouts com grid flexível, menu recolhível, pontos de quebra para celular, tabelas com rolagem interna e acesso por teclado. HTML com `header`, `main`, `aside`, `nav`, `section`, `article` e `footer`, rótulos de campos, descrições de imagens e foco nos diálogos. A revisão visual em múltiplos tamanhos permanece pendente. |

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

Na atualização visual também foram executadas verificações de DOM com jsdom, análise sintática do CSS e checagem da sintaxe de todos os arquivos JavaScript. Esses testes não substituem a inspeção visual final em desktop e celular.

## Pendências acadêmicas fora do código

O PDF também exige caderno de campo, apresentação de até cinco minutos, documentação com citações indiretas e evidências de testes com usuários reais. O texto pede no mínimo cinco usuários, embora uma linha da rubrica mencione dois. Adotar cinco atende à exigência mais ampla. Testes automatizados não substituem esses participantes, e nenhum feedback de usuário foi inventado.
