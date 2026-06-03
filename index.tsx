import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Upload, FileText, Download, BarChart3, AlertCircle, CheckCircle, Filter, Sparkles } from 'lucide-react';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

interface FileStats {
  totalRows: number;
  totalColumns: number;
  missingValues: number;
  duplicateRows: number;
  dataTypes: Record<string, string>;
}

interface CleaningOptions {
  removeDuplicates: boolean;
  fillMissingValues: string;
  customFillValue: string;
  trimWhitespace: boolean;
  removeEmptyRows: boolean;
}

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileStats, setFileStats] = useState<FileStats | null>(null);
  const [cleaningOptions, setCleaningOptions] = useState<CleaningOptions>({
    removeDuplicates: true,
    fillMissingValues: 'remove',
    customFillValue: '',
    trimWhitespace: true,
    removeEmptyRows: true
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [exploratoryAnalysis, setExploratoryAnalysis] = useState<any>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [progress, setProgress] = useState<{message: string, percentage: number}>({
    message: '',
    percentage: 0
  });

  // Detecta os tipos de dados das colunas automaticamente
  const detectarTiposDados = (data: any[], headers: string[]) => {
    const types: Record<string, string> = {};
    
    headers.forEach(header => {
      const values = data.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '');
      
      if (values.length === 0) {
        types[header] = 'empty';
        return;
      }
      
      const numericValues = values.filter(val => !isNaN(Number(val)));
      const dateValues = values.filter(val => !isNaN(Date.parse(val)));
      
      if (numericValues.length === values.length) {
        types[header] = 'numeric';
      } else if (dateValues.length === values.length) {
        types[header] = 'date';
      } else {
        types[header] = 'text';
      }
    });
    
    return types;
  };

  // Calcula estatísticas básicas do dataset
  const calcularEstatisticas = (data: any[], headers: string[]) => {
    const totalRows = data.length;
    const totalColumns = headers.length;
    
    let missingValues = 0;
    data.forEach(row => {
      headers.forEach(header => {
        if (row[header] === null || row[header] === undefined || row[header] === '') {
          missingValues++;
        }
      });
    });
    
    // Detecção simples de duplicatas baseada em JSON stringify
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    const duplicateRows = totalRows - uniqueRows.size;
    
    const dataTypes = detectarTiposDados(data, headers);
    
    return {
      totalRows,
      totalColumns,
      missingValues,
      duplicateRows,
      dataTypes
    };
  };

  // Manipula o evento de arrastar sobre a área de upload
  const manipularArrastarSobre = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  // Manipula o evento de arrastar para fora da área de upload
  const manipularArrastarSair = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Manipula o evento de soltar arquivo na área de upload
  const manipularSoltar = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      processarArquivoSelecionado(droppedFiles[0] as File);
    }
  };

  // Manipula mudança no input de arquivo
  const manipularMudancaArquivo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      processarArquivoSelecionado(selectedFile);
    }
  };

  // Processa o arquivo selecionado pelo usuário
  const processarArquivoSelecionado = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setSuccess(null);
    setData([]);
    setOriginalData([]);
    setHeaders([]);
    setFileStats(null);
    setCurrentStep(2);
    
    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') {
      setFileType('CSV');
    } else if (extension === 'xls' || extension === 'xlsx') {
      setFileType('Excel');
    } else {
      setFileType('Desconhecido');
      setError('Tipo de arquivo não suportado. Por favor, envie arquivos CSV ou Excel.');
      setFile(null);
      setCurrentStep(1);
      return;
    }
  };

  // Processa o arquivo carregado (CSV ou Excel)
  const processarArquivo = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setProgress({message: 'Iniciando processamento...', percentage: 10});
    
    try {
      if (fileType === 'CSV') {
        setProgress({message: 'Lendo arquivo CSV...', percentage: 30});
        const text = await file.text();
        setProgress({message: 'Analisando estrutura do CSV...', percentage: 50});
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
          complete: (results) => {
            if (results.errors.length > 0) {
              setError(`Erro ao analisar CSV: ${results.errors[0].message}`);
              setData([]);
              setHeaders([]);
            } else {
              setProgress({message: 'Processando dados...', percentage: 70});
              const cleanedData = results.data as any[];
              const headerList = results.meta.fields || [];
              
              setHeaders(headerList);
              setData(cleanedData);
              setOriginalData([...cleanedData]);
              setProgress({message: 'Calculando estatísticas...', percentage: 85});
              setFileStats(calcularEstatisticas(cleanedData, headerList));
              setProgress({message: 'Realizando análise exploratória...', percentage: 95});
              setExploratoryAnalysis(realizarAnaliseExploratoria(cleanedData, headerList));
              setCurrentStep(3);
              setProgress({message: 'Concluído!', percentage: 100});
              setSuccess('Arquivo CSV processado com sucesso!');
            }
            setIsLoading(false);
          },
          error: (err: any) => {
            setError(`Erro ao analisar CSV: ${err.message}`);
            setIsLoading(false);
            setProgress({message: '', percentage: 0});
          }
        });
      } else if (fileType === 'Excel') {
        setProgress({message: 'Lendo arquivo Excel...', percentage: 30});
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            setProgress({message: 'Processando planilha Excel...', percentage: 50});
            const arrayBuffer = e.target?.result;
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            if (jsonData.length > 0) {
              setProgress({message: 'Organizando dados...', percentage: 70});
              const headerList = jsonData[0] as string[];
              const dataRows = jsonData.slice(1).map(rowArray => {
                const rowObject: any = {};
                headerList.forEach((header, index) => {
                  rowObject[header] = rowArray[index];
                });
                return rowObject;
              });
              
              setHeaders(headerList);
              setData(dataRows);
              setOriginalData([...dataRows]);
              setProgress({message: 'Calculando estatísticas...', percentage: 85});
              setFileStats(calcularEstatisticas(dataRows, headerList));
              setProgress({message: 'Realizando análise exploratória...', percentage: 95});
              setExploratoryAnalysis(realizarAnaliseExploratoria(dataRows, headerList));
              setCurrentStep(3);
              setProgress({message: 'Concluído!', percentage: 100});
              setSuccess('Arquivo Excel processado com sucesso!');
            } else {
              setError('Arquivo Excel está vazio ou não pôde ser lido.');
              setData([]);
              setHeaders([]);
            }
            setIsLoading(false);
          } catch (err: any) {
            setError(`Erro ao analisar Excel: ${err.message}`);
            setIsLoading(false);
            setProgress({message: '', percentage: 0});
          }
        };
        reader.onerror = () => {
          setError('Erro ao ler arquivo Excel.');
          setIsLoading(false);
          setProgress({message: '', percentage: 0});
        };
        reader.readAsArrayBuffer(file);
      }
    } catch (e: any) {
      setError(`Falha ao processar o arquivo: ${e.message}`);
      setData([]);
      setHeaders([]);
      setIsLoading(false);
      setProgress({message: '', percentage: 0});
    }
  }, [file, fileType]);

  // Limpa os dados aplicando as opções selecionadas pelo usuário
  const limparDados = () => {
    if (!originalData.length) return;
    
    setIsLoading(true);
    setProgress({message: 'Iniciando limpeza dos dados...', percentage: 10});
    
    setTimeout(() => {
      let cleanedData = [...originalData];
      
      // Remove linhas vazias
      if (cleaningOptions.removeEmptyRows) {
        setProgress({message: 'Removendo linhas vazias...', percentage: 25});
        cleanedData = cleanedData.filter(row => 
          headers.some(header => row[header] !== null && row[header] !== undefined && row[header] !== '')
        );
      }
      
      // Remove espaços em branco
      if (cleaningOptions.trimWhitespace) {
        setProgress({message: 'Removendo espaços desnecessários...', percentage: 40});
        cleanedData = cleanedData.map(row => {
          const newRow: any = {};
          headers.forEach(header => {
            const value = row[header];
            newRow[header] = typeof value === 'string' ? value.trim() : value;
          });
          return newRow;
        });
      }
      
      // Remove duplicatas
      if (cleaningOptions.removeDuplicates) {
        setProgress({message: 'Identificando e removendo duplicatas...', percentage: 60});
        const seen = new Set();
        cleanedData = cleanedData.filter(row => {
          const key = JSON.stringify(row);
          if (seen.has(key)) {
            return false;
          }
          seen.add(key);
          return true;
        });
      }
      
      // Trata valores ausentes
      if (cleaningOptions.fillMissingValues !== 'keep') {
        setProgress({message: 'Tratando valores ausentes...', percentage: 80});
        cleanedData = cleanedData.map(row => {
          const newRow = { ...row };
          headers.forEach(header => {
            if (newRow[header] === null || newRow[header] === undefined || newRow[header] === '') {
              if (cleaningOptions.fillMissingValues === 'remove') {
                // Será tratado pela filtragem posterior
              } else if (cleaningOptions.fillMissingValues === 'custom') {
                newRow[header] = cleaningOptions.customFillValue;
              } else if (cleaningOptions.fillMissingValues === 'mean') {
                const numericValues = cleanedData
                  .map(r => r[header])
                  .filter(v => v !== null && v !== undefined && v !== '' && !isNaN(Number(v)))
                  .map(Number);
                if (numericValues.length > 0) {
                  const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
                  newRow[header] = mean.toFixed(2);
                }
              }
            }
          });
          return newRow;
        });
        
        // Remove linhas com valores ausentes se a opção estiver selecionada
        if (cleaningOptions.fillMissingValues === 'remove') {
          cleanedData = cleanedData.filter(row =>
            headers.every(header => row[header] !== null && row[header] !== undefined && row[header] !== '')
          );
        }
      }
      
      setProgress({message: 'Finalizando limpeza...', percentage: 95});
      setData(cleanedData);
      setFileStats(calcularEstatisticas(cleanedData, headers));
      setCurrentStep(4);
      setProgress({message: 'Limpeza concluída!', percentage: 100});
      setSuccess(`Dados limpos com sucesso! ${originalData.length - cleanedData.length} linhas foram removidas/modificadas.`);
      setIsLoading(false);
    }, 1000);
  };

  // Baixa os dados limpos como arquivo CSV
  const baixarDadosLimpos = () => {
    if (!data.length) return;
    
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${file?.name.split('.')[0]}_cleaned.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    setSuccess('Arquivo baixado com sucesso!');
  };

  // Reinicia a aplicação para o estado inicial
  const reiniciarApp = () => {
    setFile(null);
    setFileType(null);
    setData([]);
    setOriginalData([]);
    setHeaders([]);
    setError(null);
    setSuccess(null);
    setFileStats(null);
    setCurrentStep(1);
    setProgress({message: '', percentage: 0});
    setExploratoryAnalysis(null);
    setSelectedColumn('');
  };

  useEffect(() => {
    if (file && currentStep === 2) {
      processarArquivo();
    }
  }, [file, processarArquivo, currentStep]);

  // Obtém dados para gráficos de distribuição de tipos
  const obterDadosGrafico = () => {
    if (!fileStats) return null;
    
    const typeCount = Object.values(fileStats.dataTypes).reduce((acc: Record<string, number>, type: string) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      labels: Object.keys(typeCount),
      datasets: [{
        data: Object.values(typeCount),
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0
      }]
    };
  };

  // Realiza análise exploratória completa dos dados
  const realizarAnaliseExploratoria = (data: any[], headers: string[]) => {
    const analysis: any = {
      summary: {},
      correlations: {},
      distributions: {},
      outliers: {},
      nullValues: {},
      uniqueValues: {}
    };

    headers.forEach(header => {
      const values = data.map(row => row[header]).filter(val => val !== null && val !== undefined && val !== '');
      const allValues = data.map(row => row[header]);
      
      // Contagem de valores nulos
      analysis.nullValues[header] = allValues.length - values.length;
      
      // Valores únicos
      analysis.uniqueValues[header] = new Set(values).size;
      
      // Se é numérico
      const numericValues = values.filter(val => !isNaN(Number(val))).map(Number);
      
      if (numericValues.length > values.length * 0.8) { // Se 80% são numéricos
        const sorted = numericValues.sort((a, b) => a - b);
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        const std = Math.sqrt(numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length);
        
        // Quartis
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        const iqr = q3 - q1;
        
        // Outliers (método IQR)
        const outlierThresholdLow = q1 - 1.5 * iqr;
        const outlierThresholdHigh = q3 + 1.5 * iqr;
        const outliers = numericValues.filter(val => val < outlierThresholdLow || val > outlierThresholdHigh);
        
        analysis.summary[header] = {
          type: 'numeric',
          count: numericValues.length,
          mean: Number(mean.toFixed(2)),
          median: Number(median.toFixed(2)),
          std: Number(std.toFixed(2)),
          min,
          max,
          q1,
          q3,
          iqr: Number(iqr.toFixed(2))
        };
        
        analysis.outliers[header] = {
          count: outliers.length,
          percentage: Number(((outliers.length / numericValues.length) * 100).toFixed(1)),
          values: outliers.slice(0, 10) // Primeiros 10 outliers
        };
        
        // Distribuição (histograma)
        const bins = 10;
        const binSize = (max - min) / bins;
        const distribution = Array(bins).fill(0);
        numericValues.forEach(val => {
          const binIndex = Math.min(Math.floor((val - min) / binSize), bins - 1);
          distribution[binIndex]++;
        });
        
        analysis.distributions[header] = {
          bins: Array.from({length: bins}, (_, i) => ({
            range: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
            count: distribution[i]
          }))
        };
      } else {
        // Análise categórica
        const frequency: Record<string, number> = {};
        values.forEach(val => {
          const key = String(val);
          frequency[key] = (frequency[key] || 0) + 1;
        });
        
        const sortedFreq = Object.entries(frequency)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10); // Top 10 mais frequentes
        
        analysis.summary[header] = {
          type: 'categorical',
          count: values.length,
          uniqueCount: Object.keys(frequency).length,
          mostFrequent: sortedFreq[0]?.[0],
          mostFrequentCount: sortedFreq[0]?.[1]
        };
        
        analysis.distributions[header] = {
          frequency: sortedFreq.map(([value, count]) => ({
            value,
            count,
            percentage: Number(((count / values.length) * 100).toFixed(1))
          }))
        };
      }
    });
    
    return analysis;
  };

  return (
    <div className="app-container">
      <div className="main-content">
        {/* Header */}
        <header className="app-header fade-in">
          <h1 className="app-title">
            <Sparkles className="inline w-12 h-12 mr-4" />
            Luminar Data Cleaner
          </h1>
          <p className="app-subtitle">
            Transforme seus dados desordenados em insights valiosos com nossa ferramenta de limpeza de dados alimentada por IA
          </p>
        </header>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>

        {/* Step 1: File Upload */}
        <div className="feature-card fade-in">
          <div className="card-header">
            <div className="step-number">1</div>
            <div className="card-icon">
              <Upload className="w-6 h-6" />
            </div>
            <h2 className="card-title">Upload do Arquivo</h2>
          </div>
          
          <div 
            className={`upload-zone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={manipularArrastarSobre}
            onDragLeave={manipularArrastarSair}
            onDrop={manipularSoltar}
          >
            <input
              type="file"
              className="file-input"
              accept=".csv,.xlsx,.xls"
              onChange={manipularMudancaArquivo}
            />
            <Upload className="upload-icon" />
            <div className="upload-text">
              {file ? `Arquivo selecionado: ${file.name}` : 'Arraste e solte seu arquivo aqui'}
            </div>
            <div className="upload-subtext">
              ou clique para selecionar (CSV, Excel)
            </div>
          </div>
          
          {file && !error && (
            <div className="file-details">
              <div className="file-detail-item">
                <span className="file-detail-label">Nome:</span>
                <span className="file-detail-value">{file.name}</span>
              </div>
              <div className="file-detail-item">
                <span className="file-detail-label">Tipo:</span>
                <span className="file-detail-value">{fileType}</span>
              </div>
              <div className="file-detail-item">
                <span className="file-detail-label">Tamanho:</span>
                <span className="file-detail-value">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            </div>
          )}
        </div>

        {/* Loading State with Progress */}
        {isLoading && (
          <div className="feature-card fade-in">
            <div className="loading-container">
              <div className="spinner"></div>
              <div className="loading-text">{progress.message || 'Processando seu arquivo...'}</div>
              <div className="progress-bar-container" style={{width: '100%', marginTop: '1rem'}}>
                <div className="progress-bar" style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div className="progress-fill" style={{
                    width: `${progress.percentage}%`,
                    height: '100%',
                    backgroundColor: '#3b82f6',
                    transition: 'width 0.3s ease',
                    borderRadius: '4px'
                  }}></div>
                </div>
                <div className="progress-text" style={{
                  textAlign: 'center',
                  marginTop: '0.5rem',
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  {progress.percentage}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="error-message fade-in">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="success-message fade-in">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Step 2: Data Preview */}
        {!isLoading && data.length > 0 && (
          <div className="feature-card fade-in">
            <div className="card-header">
              <div className="step-number">2</div>
              <div className="card-icon">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="card-title">Prévia dos Dados</h2>
            </div>
            
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {headers.slice(0, 6).map(header => (
                      <th key={header}>{header}</th>
                    ))}
                    {headers.length > 6 && <th>...</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 5).map((row, index) => (
                    <tr key={index}>
                      {headers.slice(0, 6).map(header => (
                        <td key={header}>
                          {row[header] === null || row[header] === undefined || row[header] === '' 
                            ? <span className="empty-cell">(vazio)</span>
                            : String(row[header])
                          }
                        </td>
                      ))}
                      {headers.length > 6 && <td>...</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {data.length > 5 && (
              <p className="text-gray-600 mt-2">
                Mostrando 5 de {data.length} linhas
              </p>
            )}
          </div>
        )}

        {/* Step 3: Data Statistics */}
        {fileStats && (
          <div className="feature-card fade-in">
            <div className="card-header">
              <div className="step-number">3</div>
              <div className="card-icon">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h2 className="card-title">Estatísticas dos Dados</h2>
            </div>
            
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-value">{fileStats.totalRows}</div>
                <div className="stat-label">Total de Linhas</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{fileStats.totalColumns}</div>
                <div className="stat-label">Total de Colunas</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{fileStats.missingValues}</div>
                <div className="stat-label">Valores Ausentes</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{fileStats.duplicateRows}</div>
                <div className="stat-label">Linhas Duplicadas</div>
              </div>
            </div>
            
            {/* Data Types Chart */}
            <div className="chart-container">
              <h3 className="chart-title">Distribuição de Tipos de Dados</h3>
              {obterDadosGrafico() && (
                <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                  <Pie 
                    data={obterDadosGrafico()!} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }} 
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exploratory Data Analysis */}
        {exploratoryAnalysis && (
          <div className="feature-card fade-in">
            <div className="card-header">
              <div className="step-number">3.5</div>
              <div className="card-icon">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h2 className="card-title">Análise Exploratória dos Dados</h2>
            </div>
            
            {/* Column Selector */}
            <div className="form-group">
              <label className="form-label">Selecione uma coluna para análise detalhada:</label>
              <select
                className="form-select"
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
              >
                <option value="">Escolha uma coluna...</option>
                {headers.map(header => (
                  <option key={header} value={header}>{header}</option>
                ))}
              </select>
            </div>

            {/* Summary Statistics Grid */}
            <div className="dashboard-grid">
              {headers.slice(0, 4).map(header => {
                const summary = exploratoryAnalysis.summary[header];
                const nulls = exploratoryAnalysis.nullValues[header];
                const unique = exploratoryAnalysis.uniqueValues[header];
                
                return (
                  <div key={header} className="stat-card">
                    <h4 style={{marginBottom: '1rem', color: 'var(--primary-color)'}}>{header}</h4>
                    
                    {summary?.type === 'numeric' ? (
                      <>
                        <div className="stat-value">{summary.mean}</div>
                        <div className="stat-label">Média</div>
                        <div style={{marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
                          Min: {summary.min} | Max: {summary.max}<br/>
                          Mediana: {summary.median} | DP: {summary.std}<br/>
                          Nulos: {nulls} | Únicos: {unique}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="stat-value">{unique}</div>
                        <div className="stat-label">Valores Únicos</div>
                        <div style={{marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)'}}>
                          Total: {summary?.count || 0}<br/>
                          Nulos: {nulls}<br/>
                          Mais frequente: {summary?.mostFrequent || 'N/A'}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Detailed Analysis for Selected Column */}
            {selectedColumn && exploratoryAnalysis.summary[selectedColumn] && (
              <div className="chart-container">
                <h3 className="chart-title">Análise Detalhada: {selectedColumn}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Distribution Chart */}
                  <div>
                    <h4 style={{marginBottom: '1rem'}}>Distribuição</h4>
                    {exploratoryAnalysis.summary[selectedColumn].type === 'numeric' ? (
                      <Bar 
                        data={{
                          labels: exploratoryAnalysis.distributions[selectedColumn]?.bins?.map((bin: any) => bin.range) || [],
                          datasets: [{
                            label: 'Frequência',
                            data: exploratoryAnalysis.distributions[selectedColumn]?.bins?.map((bin: any) => bin.count) || [],
                            backgroundColor: 'rgba(59, 130, 246, 0.6)',
                            borderColor: 'rgba(59, 130, 246, 1)',
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false }
                          },
                          scales: {
                            y: { beginAtZero: true }
                          }
                        }}
                      />
                    ) : (
                      <Bar 
                        data={{
                          labels: exploratoryAnalysis.distributions[selectedColumn]?.frequency?.map((item: any) => item.value) || [],
                          datasets: [{
                            label: 'Frequência',
                            data: exploratoryAnalysis.distributions[selectedColumn]?.frequency?.map((item: any) => item.count) || [],
                            backgroundColor: 'rgba(16, 185, 129, 0.6)',
                            borderColor: 'rgba(16, 185, 129, 1)',
                            borderWidth: 1
                          }]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { display: false }
                          },
                          scales: {
                            y: { beginAtZero: true }
                          }
                        }}
                      />
                    )}
                  </div>

                  {/* Detailed Statistics */}
                  <div>
                    <h4 style={{marginBottom: '1rem'}}>Estatísticas Detalhadas</h4>
                    <div style={{background: '#f8fafc', padding: '1rem', borderRadius: '8px'}}>
                      {exploratoryAnalysis.summary[selectedColumn].type === 'numeric' ? (
                        <div style={{fontSize: '0.9rem', lineHeight: '1.6'}}>
                          <div><strong>Estatísticas Descritivas:</strong></div>
                          <div>• Média: {exploratoryAnalysis.summary[selectedColumn].mean}</div>
                          <div>• Mediana: {exploratoryAnalysis.summary[selectedColumn].median}</div>
                          <div>• Desvio Padrão: {exploratoryAnalysis.summary[selectedColumn].std}</div>
                          <div>• Mínimo: {exploratoryAnalysis.summary[selectedColumn].min}</div>
                          <div>• Máximo: {exploratoryAnalysis.summary[selectedColumn].max}</div>
                          <div>• Q1: {exploratoryAnalysis.summary[selectedColumn].q1}</div>
                          <div>• Q3: {exploratoryAnalysis.summary[selectedColumn].q3}</div>
                          <div>• IQR: {exploratoryAnalysis.summary[selectedColumn].iqr}</div>
                          
                          <div style={{marginTop: '1rem'}}><strong>Qualidade dos Dados:</strong></div>
                          <div>• Valores Nulos: {exploratoryAnalysis.nullValues[selectedColumn]}</div>
                          <div>• Valores Únicos: {exploratoryAnalysis.uniqueValues[selectedColumn]}</div>
                          <div>• Outliers: {exploratoryAnalysis.outliers[selectedColumn]?.count || 0} ({exploratoryAnalysis.outliers[selectedColumn]?.percentage || 0}%)</div>
                        </div>
                      ) : (
                        <div style={{fontSize: '0.9rem', lineHeight: '1.6'}}>
                          <div><strong>Análise Categórica:</strong></div>
                          <div>• Total de registros: {exploratoryAnalysis.summary[selectedColumn].count}</div>
                          <div>• Valores únicos: {exploratoryAnalysis.summary[selectedColumn].uniqueCount}</div>
                          <div>• Valor mais frequente: {exploratoryAnalysis.summary[selectedColumn].mostFrequent}</div>
                          <div>• Frequência máxima: {exploratoryAnalysis.summary[selectedColumn].mostFrequentCount}</div>
                          <div>• Valores nulos: {exploratoryAnalysis.nullValues[selectedColumn]}</div>
                          
                          <div style={{marginTop: '1rem'}}><strong>Top 5 Valores:</strong></div>
                          {exploratoryAnalysis.distributions[selectedColumn]?.frequency?.slice(0, 5).map((item: any, index: number) => (
                            <div key={index}>• {item.value}: {item.count} ({item.percentage}%)</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Data Quality Insights */}
                <div style={{marginTop: '2rem', padding: '1rem', background: '#f0f9ff', borderLeft: '4px solid var(--primary-color)', borderRadius: '0 8px 8px 0'}}>
                  <h4 style={{margin: '0 0 0.5rem 0', color: 'var(--primary-color)'}}>💡 Insights de Qualidade</h4>
                  <div style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>
                    {exploratoryAnalysis.nullValues[selectedColumn] > 0 && (
                      <div>⚠️ Esta coluna possui {exploratoryAnalysis.nullValues[selectedColumn]} valores ausentes</div>
                    )}
                    {exploratoryAnalysis.summary[selectedColumn].type === 'numeric' && exploratoryAnalysis.outliers[selectedColumn]?.count > 0 && (
                      <div>📊 Detectados {exploratoryAnalysis.outliers[selectedColumn].count} possíveis outliers ({exploratoryAnalysis.outliers[selectedColumn].percentage}%)</div>
                    )}
                    {exploratoryAnalysis.summary[selectedColumn].type === 'categorical' && exploratoryAnalysis.summary[selectedColumn].uniqueCount === exploratoryAnalysis.summary[selectedColumn].count && (
                      <div>🔑 Esta coluna parece ser um identificador único (todos os valores são diferentes)</div>
                    )}
                    {exploratoryAnalysis.summary[selectedColumn].type === 'categorical' && exploratoryAnalysis.summary[selectedColumn].uniqueCount < 10 && (
                      <div>📋 Esta coluna tem poucos valores únicos, ideal para categorização</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Cleaning Options */}
        {data.length > 0 && !isLoading && (
          <div className="feature-card fade-in">
            <div className="card-header">
              <div className="step-number">4</div>
              <div className="card-icon">
                <Filter className="w-6 h-6" />
              </div>
              <h2 className="card-title">Opções de Limpeza</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label" title="Remove linhas idênticas que aparecem múltiplas vezes no dataset">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.removeDuplicates}
                    onChange={(e) => setCleaningOptions(prev => ({
                      ...prev,
                      removeDuplicates: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  Remover linhas duplicadas
                </label>
                <div className="help-text">
                  💡 Remove linhas que possuem valores idênticos em todas as colunas
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label" title="Remove espaços desnecessários no início e fim dos textos">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.trimWhitespace}
                    onChange={(e) => setCleaningOptions(prev => ({
                      ...prev,
                      trimWhitespace: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  Remover espaços em branco
                </label>
                <div className="help-text">
                  💡 Limpa espaços extras no início e fim dos valores de texto
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label" title="Remove linhas que estão completamente vazias">
                  <input
                    type="checkbox"
                    checked={cleaningOptions.removeEmptyRows}
                    onChange={(e) => setCleaningOptions(prev => ({
                      ...prev,
                      removeEmptyRows: e.target.checked
                    }))}
                    className="mr-2"
                  />
                  Remover linhas vazias
                </label>
                <div className="help-text">
                  💡 Remove linhas que não possuem dados em nenhuma coluna
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Tratar valores ausentes:</label>
                <select
                  className="form-select"
                  value={cleaningOptions.fillMissingValues}
                  onChange={(e) => setCleaningOptions(prev => ({
                    ...prev,
                    fillMissingValues: e.target.value
                  }))}
                >
                  <option value="keep">Manter como está</option>
                  <option value="remove">Remover linhas</option>
                  <option value="mean">Preencher com média (numéricos)</option>
                  <option value="custom">Valor personalizado</option>
                </select>
                
                {cleaningOptions.fillMissingValues === 'custom' && (
                  <input
                    type="text"
                    className="form-select mt-2"
                    placeholder="Valor personalizado"
                    value={cleaningOptions.customFillValue}
                    onChange={(e) => setCleaningOptions(prev => ({
                      ...prev,
                      customFillValue: e.target.value
                    }))}
                  />
                )}
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button className="btn btn-primary" onClick={limparDados}>
                <Filter className="w-4 h-4" />
                Aplicar Limpeza
              </button>
              <button className="btn btn-outline" onClick={reiniciarApp}>
                Novo Arquivo
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Download */}
        {currentStep >= 4 && data.length > 0 && (
          <div className="feature-card fade-in">
            <div className="card-header">
              <div className="step-number">5</div>
              <div className="card-icon">
                <Download className="w-6 h-6" />
              </div>
              <h2 className="card-title">Download dos Dados Limpos</h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              Seus dados foram processados e estão prontos para download!
            </p>
            
            <button className="btn btn-success" onClick={baixarDadosLimpos}>
              <Download className="w-4 h-4" />
              Baixar CSV Limpo
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Luminar Data Cleaner. Transformando dados em insights.</p>
      </footer>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Falha ao encontrar o elemento raiz para renderização do React.');
}