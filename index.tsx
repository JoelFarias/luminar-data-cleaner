import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Upload, FileText, Download, BarChart3, AlertCircle, CheckCircle, TrendingUp, Database, Filter, Sparkles } from 'lucide-react';

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

  const detectDataTypes = (data: any[], headers: string[]) => {
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

  const calculateStats = (data: any[], headers: string[]) => {
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
    
    // Simple duplicate detection based on JSON stringify
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    const duplicateRows = totalRows - uniqueRows.size;
    
    const dataTypes = detectDataTypes(data, headers);
    
    return {
      totalRows,
      totalColumns,
      missingValues,
      duplicateRows,
      dataTypes
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      processSelectedFile(droppedFiles[0]);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      processSelectedFile(selectedFile);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
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

  const processFile = useCallback(async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    
    try {
      if (fileType === 'CSV') {
        const text = await file.text();
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
              const cleanedData = results.data as any[];
              const headerList = results.meta.fields || [];
              
              setHeaders(headerList);
              setData(cleanedData);
              setOriginalData([...cleanedData]);
              setFileStats(calculateStats(cleanedData, headerList));
              setCurrentStep(3);
              setSuccess('Arquivo CSV processado com sucesso!');
            }
            setIsLoading(false);
          },
          error: (err: any) => {
            setError(`Erro ao analisar CSV: ${err.message}`);
            setIsLoading(false);
          }
        });
      } else if (fileType === 'Excel') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const arrayBuffer = e.target?.result;
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            
            if (jsonData.length > 0) {
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
              setFileStats(calculateStats(dataRows, headerList));
              setCurrentStep(3);
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
          }
        };
        reader.onerror = () => {
          setError('Erro ao ler arquivo Excel.');
          setIsLoading(false);
        };
        reader.readAsArrayBuffer(file);
      }
    } catch (e: any) {
      setError(`Falha ao processar o arquivo: ${e.message}`);
      setData([]);
      setHeaders([]);
      setIsLoading(false);
    }
  }, [file, fileType]);

  const cleanData = () => {
    if (!originalData.length) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      let cleanedData = [...originalData];
      
      // Remove empty rows
      if (cleaningOptions.removeEmptyRows) {
        cleanedData = cleanedData.filter(row => 
          headers.some(header => row[header] !== null && row[header] !== undefined && row[header] !== '')
        );
      }
      
      // Trim whitespace
      if (cleaningOptions.trimWhitespace) {
        cleanedData = cleanedData.map(row => {
          const newRow: any = {};
          headers.forEach(header => {
            const value = row[header];
            newRow[header] = typeof value === 'string' ? value.trim() : value;
          });
          return newRow;
        });
      }
      
      // Remove duplicates
      if (cleaningOptions.removeDuplicates) {
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
      
      // Handle missing values
      if (cleaningOptions.fillMissingValues !== 'keep') {
        cleanedData = cleanedData.map(row => {
          const newRow = { ...row };
          headers.forEach(header => {
            if (newRow[header] === null || newRow[header] === undefined || newRow[header] === '') {
              if (cleaningOptions.fillMissingValues === 'remove') {
                // Will be handled by filtering later
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
        
        // Remove rows with missing values if option is selected
        if (cleaningOptions.fillMissingValues === 'remove') {
          cleanedData = cleanedData.filter(row =>
            headers.every(header => row[header] !== null && row[header] !== undefined && row[header] !== '')
          );
        }
      }
      
      setData(cleanedData);
      setFileStats(calculateStats(cleanedData, headers));
      setCurrentStep(4);
      setSuccess(`Dados limpos com sucesso! ${originalData.length - cleanedData.length} linhas foram removidas/modificadas.`);
      setIsLoading(false);
    }, 1000);
  };

  const downloadCleanedData = () => {
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

  const resetApp = () => {
    setFile(null);
    setFileType(null);
    setData([]);
    setOriginalData([]);
    setHeaders([]);
    setError(null);
    setSuccess(null);
    setFileStats(null);
    setCurrentStep(1);
  };

  useEffect(() => {
    if (file && currentStep === 2) {
      processFile();
    }
  }, [file, processFile, currentStep]);

  const getChartData = () => {
    if (!fileStats) return null;
    
    const typeCount = Object.values(fileStats.dataTypes).reduce((acc, type) => {
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
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              className="file-input"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
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

        {/* Loading State */}
        {isLoading && (
          <div className="feature-card fade-in">
            <div className="loading-container">
              <div className="spinner"></div>
              <div className="loading-text">Processando seu arquivo...</div>
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
              {getChartData() && (
                <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                  <Pie 
                    data={getChartData()!} 
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
                <label className="form-label">
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
              </div>
              
              <div className="form-group">
                <label className="form-label">
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
              </div>
              
              <div className="form-group">
                <label className="form-label">
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
              <button className="btn btn-primary" onClick={cleanData}>
                <Filter className="w-4 h-4" />
                Aplicar Limpeza
              </button>
              <button className="btn btn-outline" onClick={resetApp}>
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
            
            <button className="btn btn-success" onClick={downloadCleanedData}>
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