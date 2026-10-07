# AEGIS

Site demonstrativo de acompanhamento escolar, com um laboratório local de identificação facial por IA. Na área Developer Test, cadastre seu rosto com uma a cinco imagens, teste a câmera ou uma foto e compare velocidade e identificação em diferentes escalas.

O resumo da revisão técnica, com as alterações de cada arquivo, está em [REVISAO.md](REVISAO.md).

## Organização do código

As páginas carregam `AegisShared.js` antes do script específico da tela. O módulo comum reúne imagens, ícones, datas, rotas, validação de dados, armazenamento e exportação CSV. Cada script de página mantém sua apresentação e seus eventos. `Privacidade.html` preserva o conteúdo acessível também sem JavaScript.

Os dados da interface escolar permanecem no navegador. O login e o código PRB são demonstrativos. 