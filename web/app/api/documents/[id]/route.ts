import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(
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

    // 1. Verify document exists and belongs to the authenticated user
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

    // 2. Remove all references in claim_documents table
    const { error: claimDocErr } = await supabase
      .from('claim_documents')
      .delete()
      .eq('document_id', documentId)
      .eq('user_id', user.id);

    if (claimDocErr) {
      console.error('Error removing claim_documents association:', claimDocErr);
    }

    // 2b. Clean up document chunks and policy sections for this document
    await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId)
      .eq('user_id', user.id);

    await supabase
      .from('policy_sections')
      .delete()
      .eq('document_id', documentId)
      .eq('user_id', user.id);

    // 3. Remove physical file from private Supabase Storage
    if (doc.storage_path) {
      const { error: storageErr } = await supabase.storage
        .from('policy-documents')
        .remove([doc.storage_path]);

      if (storageErr) {
        console.error('Error removing storage file:', storageErr);
      }
    }

    // 4. Delete the document metadata row
    const { error: deleteDocErr } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id);

    if (deleteDocErr) {
      return NextResponse.json(
        { error: deleteDocErr.message || 'Failed to delete document record.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while deleting the document.',
      },
      { status: 500 }
    );
  }
}
