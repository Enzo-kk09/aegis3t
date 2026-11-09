Link Git Pages: https://enzo-kk09.github.io/aegis3t/

DEPLOY E FUNCIONAMENTO:
 O projeto atual está com todas as telas funcionando, sem dar erro (404) ou tela branca.

INTERATIVIDADE SEM RECARREGAMENTO:
 Os formulários usam eventos JavaScript e event.preventDefault() para impedir o envio padrão. O cadastro, a edição e a exclusão de tarefas e documentos atualizam a interface dinamicamente, sem precisar recarregar a página.

PERSISTÊNCIA E DADOS:
 A aplicação salva informações no localStorage e recupera esses dados ao abrir as páginas. Nos testes da Agenda e de Documentos, os registros e suas alterações permaneceram após atualizar a página com F5; os itens excluídos continuaram removidos após atualizar.

ESTABILIDADE DO CONSOLE:
 Identificados nos testes realizados	O código possui validações de formulários e tratamento de falhas em operações de armazenamento. Não foram identificados erros do site durante a navegação por todas as telas.

ADAPTABILIDADE, RESPONSIVIDADE E ACESSIBILIDADE:
 O HTML possui meta viewport e o CSS usa media queries para reorganizar menus, grades e formulários em diferentes larguras. Há textos alternativos em imagens informativas, rótulos nos campos, elementos HTML semânticos, atributos ARIA, link para pular ao conteúdo e indicação visual de foco para navegação por teclado.

FEEDBACKS:
 Foi testado com um total de 20 pessoas (turma), onde foi apresentado todas as telas, o problema foi pertinente e único, a poluição visual. Onde foi de uma certa forma arrumado todas as telas visualmente, com um foco na tela de login, atribuindo uma novo logo, interface e reestruturação de paleta de cores.
