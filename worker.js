import items from './data.json';
import { buildMatcher } from './src/matcher.js';

const matcher = buildMatcher(items);

function toApiRecord(record) {
  return {
    name: record.name,
    sizeRange: [record.sizeRange.min, record.sizeRange.max],
    weightRange: [record.weightRange.min, record.weightRange.max],
    score: Number(record.score.toFixed(6)),
    band: record.band,
    index: record.index,
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // 配置跨域 (CORS)
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    // 处理浏览器发出的预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      if (url.pathname === '/api/health') {
        const payload = JSON.stringify({ status: 'ok', count: items.length });
        return new Response(payload, {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (url.pathname === '/api/query') {
        const sizeParam = url.searchParams.get('size');
        const weightParam = url.searchParams.get('weight');
        const limitParam = url.searchParams.get('limit');

        const size = Number(sizeParam);
        const weight = Number(weightParam);

        if (!sizeParam || !weightParam || !Number.isFinite(size) || !Number.isFinite(weight)) {
          return new Response(JSON.stringify({ error: 'size and weight are required and must be valid numbers' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        let limit = 5;
        if (limitParam !== null) {
          limit = Number(limitParam);
          if (!Number.isInteger(limit) || limit <= 0) {
            return new Response(JSON.stringify({ error: 'limit must be a positive integer when provided' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }
        }

        const result = matcher.query({ size, weight, limit });
        const payload = JSON.stringify({
          query: { size, weight, limit },
          matched: result.matched.map(toApiRecord),
          similar: result.similar.map(toApiRecord),
        });

        return new Response(payload, {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
      
    } catch (e) {
      console.error(e);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};