import { useState, FormEvent } from 'react';

interface ResultItem {
  name: string;
  sizeRange: [number, number];
  weightRange: [number, number];
  score: number;
  band: string;
  index: number;
}

interface QueryResponse {
  query: {
    size: number;
    weight: number;
    limit: number;
  };
  matched: ResultItem[];
  similar: ResultItem[];
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function App() {
  const [size, setSize] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [limit, setLimit] = useState<string>('5');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<QueryResponse | null>(null);

  const handleFillExample = () => {
    setSize('0.3');
    setWeight('1.73');
    setLimit('5');
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validation
    const sizeNum = Number(size);
    const weightNum = Number(weight);
    const limitNum = limit ? Number(limit) : 5;

    if (!size || !weight) {
      setError('尺寸和重量不能为空');
      return;
    }
    
    if (Number.isNaN(sizeNum) || Number.isNaN(weightNum)) {
      setError('尺寸和重量必须为有效数字');
      return;
    }

    if (!Number.isInteger(limitNum) || limitNum <= 0) {
      setError('返回数量必须为正整数');
      return;
    }

    setError(null);
    setIsLoading(true);
    setResults(null);

    try {
      const url = new URL(`${API_BASE_URL}/api/query`);
      url.searchParams.append('size', sizeNum.toString());
      url.searchParams.append('weight', weightNum.toString());
      if (limitNum) {
        url.searchParams.append('limit', limitNum.toString());
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `请求失败 (${response.status})`);
      }

      const data: QueryResponse = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求发生未知错误，请检查后端服务是否启动。');
    } finally {
      setIsLoading(false);
    }
  };

  const formatRange = (range: [number, number]) => {
    if (range[0] === range[1]) return range[0].toString();
    return `${range[0]} - ${range[1]}`;
  };

  const renderCard = (item: ResultItem, type: 'matched' | 'similar', i: number) => (
    <article 
      key={`${item.name}-${i}`} 
      className={`card ${type}`}
      style={{ animationDelay: `${i * 0.1}s` }}
    >
      <div className="card-header">
        <h3 className="card-title">{item.name}</h3>
        <span className="card-band">{item.band}档 #{item.index}</span>
      </div>
      <div className="card-details">
        <div className="detail-item">
          <span className="detail-label">尺寸区间</span>
          <span className="detail-value">{formatRange(item.sizeRange)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">重量区间</span>
          <span className="detail-value">{formatRange(item.weightRange)}</span>
        </div>
      </div>
      <div className="card-footer">
        <span>相似度分值: {item.score}</span>
        {type === 'similar' && item.score === 0 && <span>(完美匹配)</span>}
      </div>
    </article>
  );

  return (
    <main>
      <header>
        <h1>精灵查询系统</h1>
        <p className="subtitle">基于体型和重量精准定位洛克王国精灵</p>
      </header>

      <section className="search-card">
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="sizeInput">尺寸 (长)</label>
              <input
                id="sizeInput"
                type="number"
                step="0.01"
                min="0"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="例如: 0.3"
                aria-required="true"
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="weightInput">重量 (重)</label>
              <input
                id="weightInput"
                type="number"
                step="0.01"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="例如: 1.73"
                aria-required="true"
              />
            </div>

            <div className="form-field">
              <label htmlFor="limitInput">返回推荐数 (选填)</label>
              <input
                id="limitInput"
                type="number"
                step="1"
                min="1"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="默认: 5"
              />
            </div>
          </div>

          {error && (
            <div className="alert alert-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          <div className="actions">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={handleFillExample}
            >
              示例填充
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? '查询中...' : '开始查询'}
            </button>
          </div>
        </form>
      </section>

      {isLoading && (
        <div className="loading" aria-live="polite">
          <div className="spinner"></div>
          <p>正在分析精灵数据...</p>
        </div>
      )}

      {results && !isLoading && (
        <section className="results-section" aria-live="polite">
          {results.matched.length === 0 ? (
            <div className="alert alert-info">
              💡 未命中精确结果，以下是为您推荐的最相近精灵
            </div>
          ) : (
            <div className="result-group">
              <h2>
                精确命中 <span className="badge">{results.matched.length}</span>
              </h2>
              <div className="grid">
                {results.matched.map((item, i) => renderCard(item, 'matched', i))}
              </div>
            </div>
          )}

          {results.similar.length > 0 && (
            <div className="result-group">
              <h2>
                相近推荐 <span className="badge">{results.similar.length}</span>
              </h2>
              <div className="grid">
                {results.similar.map((item, i) => renderCard(item, 'similar', i))}
              </div>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default App;