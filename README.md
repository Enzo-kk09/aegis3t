Link Git Pages: https://enzo-kk09.github.io/aegis3t/

## Checklist dos Critérios de Avaliação

| Critério | Como o AEGIS atende ao requisito |
|---|---|
| **1. Deploy e Funcionamento** | A aplicação está publicada por meio do GitHub Pages, permitindo o acesso direto pelo navegador. Os arquivos HTML, CSS e JavaScript estão organizados para garantir o carregamento correto das páginas e dos recursos do sistema. |
| **2. Interatividade sem Recarregamento** | As interações são realizadas por meio de JavaScript, utilizando o método `preventDefault()` para impedir o comportamento padrão dos formulários. Dessa forma, operações de cadastro, edição e remoção são processadas dinamicamente, sem a necessidade de recarregar a página. |
| **3. Persistência de Dados** | O sistema utiliza o `localStorage` para armazenar informações no próprio navegador. Os dados registrados e as alterações realizadas podem ser recuperados após a atualização da página, mantendo a continuidade das operações. |
| **4. Estabilidade do Console** | O código possui validações para o tratamento das operações e do armazenamento de dados. A estabilidade da aplicação deve ser verificada por meio de testes de navegação e interação com as funcionalidades, utilizando o Console das ferramentas de desenvolvedor do navegador. |
| **5. Adaptabilidade e Responsividade** | A interface utiliza a meta tag `viewport` e regras de CSS com media queries para adaptar a disposição dos elementos a diferentes tamanhos de tela. Também são utilizados recursos de HTML semântico, identificação de campos e elementos de acessibilidade para facilitar a navegação e a compreensão da interface. |
