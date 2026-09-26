import { getStore } from '@netlify/blobs';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }
  try {
    const body = await req.json();
    const negocio = typeof body.negocio==='string'?body.negocio.trim().slice(0,200):'';
    const contactoRaw = typeof body.contacto==='string'?body.contacto.trim().toLowerCase().slice(0,200):'';
    const referidoPor = typeof body.referido_por==='string'?body.referido_por.trim().slice(0,100):'';
    const identificador = contactoRaw || negocio.trim().toLowerCase();

    if (!referidoPor || !contactoRaw || !negocio) {
      return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    if (body.visitor_id === referidoPor || identificador === referidoPor.toLowerCase() || negocio.toLowerCase().replace(/\s+/g,'-') === referidoPor.toLowerCase()) {
      // evita que alguien se auto-refiera con el mismo nombre de negocio
      return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const referidos = getStore('referidos');
    const key = `id:${identificador}`;
    const existing = await referidos.get(key, { type: 'json' });
    if (existing) {
      return new Response(JSON.stringify({ ok: true, duplicate: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    await referidos.setJSON(key, { negocio, contacto: contactoRaw, referidoPor, fecha: new Date().toISOString() });

    const creditos = getStore('creditos-referidos');
    const credKey = `ref:${referidoPor.toLowerCase()}`;
    const current = (await creditos.get(credKey, { type: 'json' })) || { referrals: 0 };
    current.referrals += 1;
    await creditos.setJSON(credKey, current);

    return new Response(JSON.stringify({ ok: true, bonusDaysAwarded: 20 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

export const config = { path: '/api/referral' };
