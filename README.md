# ✨ Luminar Data Cleaner

Uma aplicação web inteligente para limpeza, análise e visualização de dados de planilhas, alimentada por inteligência artificial.

![Luminar Data Cleaner](https://img.shields.io/badge/Status-Ativo-brightgreen) ![Versão](https://img.shields.io/badge/Versão-1.0.0-blue) ![Licença](https://img.shields.io/badge/Licença-MIT-yellow)

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [Como Usar](#-como-usar)
- [Instalação e Desenvolvimento](#-instalação-e-desenvolvimento)
- [Deploy](#-deploy)
- [Contribuição](#-contribuição)
- [Licença](#-licença)
- [Contato](#-contato)

## 🎯 Sobre o Projeto

O **Luminar Data Cleaner** é uma ferramenta moderna e intuitiva para transformar dados desordenados em insights valiosos. Com uma interface amigável e recursos avançados de limpeza de dados, a aplicação permite que usuários de todos os níveis técnicos processem e analisem seus dados de forma eficiente.

### ✨ Principais Características

- **Interface Intuitiva**: Design moderno com tema escuro/claro
- **Suporte Múltiplos Formatos**: CSV e Excel (.xls, .xlsx)
- **Análise Inteligente**: Detecção automática de tipos de dados
- **Limpeza Avançada**: Remoção de duplicatas, valores vazios e mais
- **Visualizações Interativas**: Gráficos e estatísticas em tempo real
- **Análise Exploratória**: Insights automáticos sobre seus dados
- **Export Personalizado**: Download dos dados limpos em CSV

## 🚀 Funcionalidades

### 📤 Upload de Arquivos
- **Drag & Drop**: Arraste e solte arquivos diretamente na interface
- **Seleção Manual**: Clique para selecionar arquivos do computador
- **Validação Automática**: Verificação de formato e integridade
- **Suporte a Formatos**: CSV, XLS, XLSX

### 🔍 Análise de Dados
- **Detecção de Tipos**: Automática (numérico, texto, data)
- **Estatísticas Básicas**: Contagem, médias, medianas
- **Identificação de Problemas**: Valores ausentes, duplicatas
- **Análise de Qualidade**: Score de completude dos dados

### 🧹 Limpeza de Dados
- **Remoção de Duplicatas**: Identificação e eliminação automática
- **Tratamento de Valores Vazios**: 
  - Remoção de linhas/colunas vazias
  - Preenchimento com valores personalizados
  - Preenchimento com média (dados numéricos)
- **Normalização**: Remoção de espaços em branco
- **Validação**: Verificação de consistência

### 📊 Visualizações
- **Gráficos de Pizza**: Distribuição de tipos de dados
- **Histogramas**: Distribuição de valores numéricos
- **Gráficos de Barras**: Frequência de valores categóricos
- **Estatísticas Detalhadas**: Box plots, outliers, correlações

### 💾 Export e Download
- **Formato CSV**: Dados limpos prontos para uso
- **Nomenclatura Inteligente**: Arquivos com sufixo "_cleaned"
- **Preservação de Encoding**: Suporte a caracteres especiais

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18**: Biblioteca para interfaces de usuário
- **TypeScript**: Tipagem estática para JavaScript
- **Vite**: Build tool moderno e rápido
- **CSS3**: Estilização avançada com variáveis CSS

### Bibliotecas de Dados
- **PapaParse**: Processamento de arquivos CSV
- **SheetJS (XLSX)**: Leitura de arquivos Excel
- **Chart.js**: Criação de gráficos interativos
- **React Chart.js 2**: Integração React + Chart.js

### Ícones e UI
- **Lucide React**: Ícones modernos e consistentes
- **CSS Grid/Flexbox**: Layout responsivo
- **CSS Custom Properties**: Temas personalizáveis

## 📱 Como Usar

### 1. 📂 Seleção de Arquivo
1. **Acesse a aplicação** em seu navegador
2. **Arraste e solte** um arquivo CSV ou Excel na área indicada, ou
3. **Clique no botão** "Escolher Arquivo" para selecionar manualmente
4. **Aguarde** o processamento automático do arquivo

### 2. 📊 Visualização dos Dados
1. **Revise** as estatísticas básicas do seu dataset
2. **Explore** os gráficos de distribuição de dados
3. **Analise** os tipos de dados detectados automaticamente
4. **Identifique** problemas como valores ausentes ou duplicatas

### 3. 🔧 Configuração da Limpeza
1. **Selecione** as opções de limpeza desejadas:
   - ✅ Remover linhas duplicadas
   - ✅ Remover linhas completamente vazias
   - ✅ Remover espaços em branco extras
   - ✅ Tratar valores ausentes (remover ou preencher)
2. **Personalize** valores de preenchimento se necessário
3. **Clique** em "Limpar Dados" para processar

### 4. 📈 Análise Exploratória
1. **Selecione** uma coluna para análise detalhada
2. **Visualize** estatísticas específicas (média, mediana, desvio padrão)
3. **Identifique** outliers e padrões nos dados
4. **Explore** distribuições e frequências

### 5. 💾 Download dos Resultados
1. **Revise** o resumo de mudanças realizadas
2. **Clique** em "Baixar CSV Limpo" para download
3. **Utilize** os dados limpos em suas análises

## 🔧 Instalação e Desenvolvimento

### Pré-requisitos
- **Node.js** (versão 16 ou superior)
- **npm** (gerenciador de pacotes)
- **Git** (controle de versão)

### Instalação Local

```bash
# Clone o repositório
git clone https://github.com/JoelFarias/luminar-data-cleaner.git

# Entre no diretório
cd luminar-data-cleaner

# Instale as dependências
npm install

# Execute em modo de desenvolvimento
npm run dev

# Abra http://localhost:5173 no navegador
```

### Scripts Disponíveis

```bash
# Desenvolvimento com hot reload
npm run dev

# Build para produção
npm run build

# Preview do build de produção
npm run preview
```

### Estrutura do Projeto

```
luminar-data-cleaner/
├── public/
├── src/
│   ├── index.tsx        # Componente principal
│   ├── index.css        # Estilos globais
│   └── index.html       # Template HTML
├── dist/                # Build de produção
├── package.json         # Dependências e scripts
├── tsconfig.json        # Configuração TypeScript
├── vite.config.ts       # Configuração Vite
└── README.md           # Este arquivo
```

## 🌐 Deploy

### GitHub Pages (Recomendado)

O projeto está configurado para deploy automático no GitHub Pages:

1. **Fork** este repositório
2. **Ative** o GitHub Pages nas configurações
3. **Selecione** "GitHub Actions" como fonte
4. **Aguarde** o deploy automático
5. **Acesse** em `https://seu-usuario.github.io/luminar-data-cleaner/`

### Deploy Manual

```bash
# Build para produção
npm run build

# Os arquivos estarão em ./dist/
# Upload para seu servidor web favorito
```

### Outros Provedores

- **Netlify**: Conecte seu repositório GitHub
- **Vercel**: Deploy com um clique
- **Surge.sh**: Deploy via CLI

## 📊 Exemplos de Uso

### Limpeza de Dados de Vendas
```
Dados Originais: 1000 linhas, 50 duplicatas, 120 valores vazios
Dados Limpos: 950 linhas, 0 duplicatas, 0 valores vazios
Resultado: Aumento de 95% na qualidade dos dados
```

### Análise de Dataset de Clientes
```
Colunas Analisadas: Nome, Email, Idade, Cidade, Compras
Tipos Detectados: Texto, Email, Numérico, Categórico, Numérico
Outliers Encontrados: 5 idades suspeitas, 3 valores de compra atípicos
```

## 🤝 Contribuição

Contribuições são sempre bem-vindas! Veja como você pode ajudar:

### Como Contribuir

1. **Fork** o projeto
2. **Crie** sua branch de feature (`git checkout -b feature/MinhaFeature`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. **Push** para a branch (`git push origin feature/MinhaFeature`)
5. **Abra** um Pull Request

### Tipos de Contribuição

- 🐛 **Correção de bugs**
- ✨ **Novas funcionalidades**
- 📝 **Melhorias na documentação**
- 🎨 **Melhorias de UI/UX**
- ⚡ **Otimizações de performance**
- 🌍 **Traduções**

### Diretrizes

- Mantenha o código consistente com o padrão existente
- Adicione comentários em português
- Teste suas mudanças antes de enviar
- Atualize a documentação se necessário

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

### Resumo da Licença
- ✅ Uso comercial permitido
- ✅ Modificação permitida
- ✅ Distribuição permitida
- ✅ Uso privado permitido
- ❌ Sem garantia
- ❌ Autor não é responsável

## 📞 Contato

**Joel Farias** - Desenvolvedor Principal

- 📧 Email: [contato@exemplo.com](mailto:contato@exemplo.com)
- 🐙 GitHub: [@JoelFarias](https://github.com/JoelFarias)
- 💼 LinkedIn: [Joel Farias](https://linkedin.com/in/joelfarias)

**Link do Projeto**: [https://github.com/JoelFarias/luminar-data-cleaner](https://github.com/JoelFarias/luminar-data-cleaner)

---

## 🙏 Agradecimentos

- **React Team** - Framework excepcional
- **Chart.js** - Biblioteca de gráficos poderosa
- **PapaParse** - Parser CSV robusto
- **Lucide** - Ícones lindos e consistentes
- **Vite** - Build tool incrivelmente rápido

---

<div align="center">

**⭐ Se este projeto foi útil para você, considere dar uma estrela! ⭐**

*Transformando dados desordenados em insights valiosos* ✨

</div>