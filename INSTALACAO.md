# 🚀 Instalação Rápida - Focus Write

## Para Usuários Finais

### Passo 1: Preparar o Plugin
1. Clone ou baixe este repositório
2. Abra o terminal na pasta do projeto
3. Execute: `npm install`
4. Execute: `npm run build`

### Passo 2: Instalar no Obsidian
1. Abra o Obsidian
2. Vá em **Configurações** (⚙️)
3. Clique em **Plugins da Comunidade**
4. Desative o **Modo Seguro**
5. Clique em **Instalar plugin do arquivo**
6. Selecione o arquivo `main.js` gerado

### Passo 3: Ativar o Plugin
1. Na lista de plugins, procure por **Focus Write**
2. Clique no toggle para ativar
3. Clique no ícone do livro na barra lateral para abrir o dashboard

## 🛠️ Para Desenvolvedores

### Desenvolvimento
```bash
# Instalar dependências
npm install

# Modo desenvolvimento (watch)
npm run dev

# Build de produção
npm run build
```

### Estrutura do Projeto
```
focusWrite/
├── main.ts                 # Arquivo principal do plugin
├── WritingDashboardView.ts # View customizada
├── writing_dashboard.tsx   # Componente React (futuro)
├── manifest.json          # Configuração do plugin
├── package.json           # Dependências
├── tsconfig.json          # Configuração TypeScript
├── esbuild.config.mjs     # Configuração de build
├── types.d.ts             # Tipos TypeScript
├── README.md              # Documentação
├── CHANGELOG.md           # Histórico de mudanças
└── .gitignore             # Arquivos ignorados
```

## 🎯 Próximos Passos

1. **Teste o plugin** no Obsidian
2. **Configure suas metas** nas configurações
3. **Explore o dashboard** clicando no ícone
4. **Reporte bugs** ou sugestões no GitHub

## ❓ Problemas Comuns

### Plugin não aparece
- Verifique se o `main.js` foi gerado corretamente
- Confirme que o plugin está ativado nas configurações

### Erros de build
- Certifique-se de que o Node.js está instalado
- Execute `npm install` novamente
- Verifique se todas as dependências estão instaladas

### Dashboard não carrega
- Verifique o console do Obsidian (Ctrl+Shift+I)
- Confirme que não há erros de JavaScript

---

**Precisa de ajuda?** Abra uma issue no GitHub ou entre em contato! 