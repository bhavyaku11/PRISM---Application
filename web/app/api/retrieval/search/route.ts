import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBackendUrl } from '@/lib/backend';

const BACKEND_URL = getBackendUrl();

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (!body.query || typeof body.query !== 'string' || !body.query.trim()) {
      return NextResponse.json(
        { error: 'Query string is required.' },
        { status: 400 }
      );
    }

    // Attempt 1: Call FastAPI hybrid retrieval service
    try {
      const backendEndpoint = `${BACKEND_URL}/api/retrieval/search`;
      const response = await fetch(backendEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json().catch(() => ({}));
        return NextResponse.json(data, { status: 200 });
      }
    } catch (backendErr) {
      console.warn('FastAPI retrieval service unreachable, falling back to Supabase direct search:', backendErr);
    }

    // Attempt 2: Direct Supabase fallback for policy chunks (strictly scoped to user session via RLS)
    if (body.policy_id) {
      const topK = typeof body.top_k === 'number' ? body.top_k : 5;
      const { data: chunks, error: chunkError } = await supabase
        .from('document_chunks')
        .select('id, document_id, policy_id, page_number, section_title, content')
        .eq('policy_id', body.policy_id)
        .limit(topK * 4);

      if (!chunkError && chunks && chunks.length > 0) {
        interface RawChunkRecord {
          id: string;
          document_id: string;
          policy_id: string;
          page_number: number | null;
          section_title: string | null;
          content: string;
        }

        const queryTerms = body.query.toLowerCase().split(/\s+/).filter((t: string) => t.length > 2);
        const typedChunks = chunks as unknown as RawChunkRecord[];
        const scored = typedChunks.map((c) => {
          const content = (c.content || '').toLowerCase();
          const title = (c.section_title || '').toLowerCase();
          let score = 0.5;
          for (const t of queryTerms) {
            if (title.includes(t)) score += 0.15;
            if (content.includes(t)) score += 0.05;
          }
          return {
            chunk_id: c.id,
            document_id: c.document_id,
            policy_id: c.policy_id,
            page_number: c.page_number || 1,
            section_title: c.section_title || 'Policy Section',
            content: c.content,
            similarity: Math.min(0.96, Math.max(0.4, score)),
          };
        });

        scored.sort((a, b) => b.similarity - a.similarity);
        const results = scored.slice(0, topK);

        return NextResponse.json(
          {
            query: body.query,
            results,
            total_results: results.length,
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to execute policy retrieval.' },
      { status: 502 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not connect to PRISM retrieval service.',
      },
      { status: 500 }
    );
  }
}
