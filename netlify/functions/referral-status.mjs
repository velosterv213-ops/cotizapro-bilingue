import { getStore } from '@netlify/blobs';

export default async (req) => {
  const url = new URL(req.url);
  const ref = (url.searchParams.get('ref') || '').trim().toLowerCase();
  if (!ref) {
    return new Response(JSON.stringify({ error: 'missing ref' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const creditos = getStore('creditos-referidos');
  const data = (await creditos.get(`ref:${ref}`, { type: 'json' })) || { referrals: 0 };
  return new Response(JSON.stringify({ referrals: data.referrals || 0, bonusDays: (data.referrals || 0) * 20 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

export const config = { path: '/api/referral-status' };
