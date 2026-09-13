import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    // Verify document ownership strictly scoped to the authenticated user
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (docError || !doc) {
      return NextResponse.json(
        { error: 'Document not found or access denied.' },
        { status: 404 }
      );
    }

    if (!doc.storage_path) {
      return NextResponse.json(
        { error: 'Document file storage path not found.' },
        { status: 404 }
      );
    }

    const requestUrl = new URL(request.url);
    const isPreview = requestUrl.searchParams.get('preview') === 'true';

    // Generate a secure 300-second (5 minute) signed URL from private Supabase Storage
    const { data: signedData, error: signedError } = await supabase.storage
      .from('policy-documents')
      .createSignedUrl(
        doc.storage_path,
        300,
        isPreview ? undefined : { download: doc.document_name || 'document.pdf' }
      );

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json(
        {
          error:
            signedError?.message ||
            'Failed to generate secure document download URL.',
        },
        { status: 500 }
      );
    }

    if (requestUrl.searchParams.get('redirect') === 'true') {
      return NextResponse.redirect(signedData.signedUrl);
    }

    return NextResponse.json(
      {
        url: signedData.signedUrl,
        filename: doc.document_name,
        expires_in: 300,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while accessing the document.',
      },
      { status: 500 }
    );
  }
}
