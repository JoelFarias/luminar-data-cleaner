# 🚀 Deploy no GitHub Pages

Este guia mostra como fazer deploy do Luminar Data Cleaner no GitHub Pages.

## 📋 Pré-requisitos

- Conta no GitHub
- Git instalado
- Node.js instalado

## 🔧 Passos para Deploy

### 1. Criar Repositório no GitHub

1. Acesse [GitHub](https://github.com)
2. Clique em "New repository"
3. Nome do repositório: `luminar-data-cleaner`
4. Deixe público
5. Clique em "Create repository"

### 2. Inicializar Git Local

```bash
# No terminal, dentro da pasta do projeto:
git init
git add .
git commit -m "Initial commit: Luminar Data Cleaner"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/luminar-data-cleaner.git
git push -u origin main
```

### 3. Configurar GitHub Pages

1. No repositório do GitHub, vá em **Settings**
2. Na lateral esquerda, clique em **Pages**
3. Em "Source", selecione **GitHub Actions**
4. O workflow será executado automaticamente

### 4. Acessar o Site

Após alguns minutos, seu site estará disponível em:
```
https://SEU_USUARIO.github.io/luminar-data-cleaner/
```

## 🔄 Atualizações Futuras

Para fazer atualizações:

1. Modifique os arquivos
2. Execute o build:
   ```bash
   npm run build
   ```
3. Commit e push:
   ```bash
   git add .
   git commit -m "Atualização: descrição das mudanças"
   git push
   ```

O GitHub Actions automaticamente fará o deploy da nova versão.

## 📁 Arquivos Importantes

- **`.github/workflows/deploy.yml`** - Configuração do deploy automático
- **`vite.config.ts`** - Configuração do Vite com base path
- **`dist/`** - Pasta com os arquivos compilados
- **`.gitignore`** - Arquivos ignorados pelo Git

## 🛠 Comandos Úteis

```bash
# Instalar dependências
npm install --legacy-peer-deps

# Executar em desenvolvimento
npm run dev

# Fazer build para produção
npm run build

# Preview do build
npm run preview
```

## 🎯 Resultado

Seu site terá:
- ✅ URL personalizada no GitHub Pages
- ✅ Deploy automático a cada commit
- ✅ HTTPS habilitado
- ✅ Funcionalidades completas de limpeza de dados

---

**🎉 Seu Luminar Data Cleaner estará online e pronto para uso!**
