# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.0.9] - 2024-01-XX

### Alterado
- **Reorganização do layout**: Widget do foco do dia movido para cima da seção combinada (tempo focado + ações rápidas)
- **Melhor hierarquia visual**: Foco do dia agora tem destaque maior no dashboard

## [1.0.8] - 2024-01-XX

### Alterado
- **Painel de ações rápidas simplificado**: Removidos botões "Criar Página Fixa", "Contar Palavras" e "Contar Todas as Palavras"
- **Interface mais limpa**: Mantido apenas o botão "Definir Foco do Dia" nas ações rápidas

## [1.0.7] - 2024-01-XX

### Adicionado
- **Sistema de tempo total focado**: Tempo acumulado que persiste entre sessões
- **Funcionalidade de reset inteligente**: Adiciona o tempo atual ao total antes de zerar

### Alterado
- **Painel de tempo focado**: Agora mostra o tempo total acumulado de todas as sessões
- **Comportamento do reset**: O botão reset agora preserva o tempo na contagem total

## [1.0.6] - 2024-01-XX

### Adicionado
- **Novo logo**: Ícone de lápis de escrita a tinta no header do dashboard
- **Identidade visual**: Logo mais representativo para o plugin de escrita

## [1.0.5] - 2024-01-XX

### Alterado
- **Remoção de duplicação**: Card "Tempo Focado" removido dos cards pequenos
- **Layout otimizado**: Tempo focado agora aparece apenas no painel ao lado das ações rápidas

## [1.0.4] - 2024-01-XX

### Corrigido
- **Painel de tempo focado**: Agora mostra apenas o tempo total acumulado, sem controles de timer
- **Layout simplificado**: Removidos botões de iniciar/pausar/reset do painel de tempo focado

## [1.0.3] - 2024-01-XX

### Adicionado
- **Modal de Foco do Dia**: Novo modal para definir o foco diário de escrita
- **Seleção de notas**: Possibilidade de selecionar notas existentes como foco do dia
- **Exibição do foco**: Seção no dashboard que mostra o foco definido para o dia
- **Botão de ação**: Botão "🎯 Definir Foco do Dia" no painel de ações rápidas
- **Persistência**: O foco do dia é salvo e mantido entre sessões

## [1.0.2] - 2024-01-XX

### Adicionado
- **Layout melhorado do dashboard**: Painel de tempo focado e ações rápidas agora ficam lado a lado em uma seção combinada
- **Design responsivo**: Em telas menores, os painéis se empilham verticalmente para melhor usabilidade
- **Timer dedicado**: Painel de tempo focado com display maior e controles centralizados

## [1.0.1] - 2024-01-XX

### Alterado
- **Dashboard agora abre na tela principal**: Ao clicar no ícone "FW" na barra lateral esquerda, o dashboard agora abre na área principal do Obsidian ao invés do painel lateral direito

## [1.0.0] - 2024-01-XX

### Adicionado
- Dashboard principal com métricas de escrita
- Sistema de cards para visualização de estatísticas
- Configurações básicas do plugin
- Comando para abrir o dashboard
- Ícone na barra lateral do Obsidian
- Interface de configurações com meta diária e notificações
- Estrutura básica do plugin com TypeScript
- Sistema de build com esbuild
- Documentação completa no README
- **Funcionalidade de página fixa do dashboard**
  - Botão nas configurações para criar página fixa
  - Página do dashboard criada automaticamente no topo do vault
  - Template pré-formatado com métricas e objetivos
  - Sistema de controle para evitar duplicação
  - Comando adicional para criar página fixa
- **Sistema de contagem de palavras funcional**
  - Contagem automática de palavras em arquivos markdown
  - Filtro inteligente para excluir dashboard e arquivos de sistema
  - Processamento de markdown para contagem precisa
  - Logs detalhados para debug
- **Comandos adicionais**
  - "Contar Palavras de Hoje" - conta palavras de arquivos do dia
  - "Contar Todas as Palavras" - conta palavras de todos os arquivos ativos
- **Interface melhorada**
  - Design moderno com gradientes e animações
  - Botões de ação rápida no dashboard
  - Seção de debug nas configurações
  - Informações detalhadas sobre arquivos e dados

### Funcionalidades Implementadas
- Visualização de palavras escritas hoje
- Acompanhamento de sequência de dias
- Total de palavras escritas
- Métricas de foco e humor
- Interface responsiva e moderna
- Integração com tema claro/escuro do Obsidian
- Criação automática de página fixa do dashboard
- **Contagem real de palavras** de arquivos markdown
- **Sistema de sequência** baseado em dias com palavras
- **Atualização automática** ao modificar arquivos
- **Persistência de dados** entre sessões

### Corrigido
- Lógica de contagem de palavras mais robusta
- Detecção de arquivos por data simplificada
- Tratamento de erros ao ler arquivos
- Interface de configurações mais informativa
- Tipos TypeScript corrigidos

### Técnico
- Configuração inicial do projeto
- Estrutura de arquivos do plugin Obsidian
- Sistema de tipos TypeScript
- Build automatizado
- Manifesto do plugin

---

## Próximas Versões

### [1.1.0] - Planejado
- Integração com arquivos de notas do Obsidian
- Sistema de conquistas funcional
- Gráficos interativos com dados reais

### [1.2.0] - Planejado
- Exportação de relatórios
- Análise de palavras mais usadas
- Sistema de lembretes

### [2.0.0] - Planejado
- Backup e sincronização de dados
- Integração com APIs externas
- Sistema de gamificação avançado 