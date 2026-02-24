/**
 * Service for managing lead attachments (file uploads to Supabase Storage)
 * Handles validation, upload, download, and deletion of PDFs, images, and documents
 */

import { supabase } from "@/integrations/supabase/client";
import {
  LeadAttachment,
  AttachmentMimeType,
  MAX_FILE_SIZE,
  MAX_ATTACHMENTS_PER_LEAD,
  ALLOWED_MIME_TYPES,
} from "@/types/crm";

/**
 * Custom error class for attachment validation failures
 */
export class AttachmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AttachmentValidationError";
  }
}

/**
 * Validate file before upload
 * Checks size and MIME type against allowed values
 */
export function validateFile(file: File): void {
  // Check file size (5 MB max)
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    throw new AttachmentValidationError(
      `Arquivo muito grande. Tamanho máximo: 5 MB. Tamanho atual: ${sizeMB} MB`
    );
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as AttachmentMimeType)) {
    throw new AttachmentValidationError(
      `Tipo de arquivo não permitido. Tipos aceitos: PDF, JPG, PNG, Word (DOC, DOCX), Excel (XLS, XLSX)`
    );
  }
}

/**
 * Get all attachments for a lead, ordered by newest first
 */
export async function getLeadAttachments(leadId: string): Promise<LeadAttachment[]> {
  try {
    const { data, error } = await supabase
      .from("lead_attachments")
      .select("*")
      .eq("lead_id", leadId)
      .order("criado_em", { ascending: false });

    if (error) throw error;
    return (data || []) as LeadAttachment[];
  } catch (error) {
    console.error("Error fetching lead attachments:", error);
    return [];
  }
}

/**
 * Upload a file to Supabase Storage and create database record
 * Storage path: lead-attachments/{leadId}/{uuid}-{filename}
 */
export async function uploadAttachment(
  leadId: string,
  file: File
): Promise<LeadAttachment | null> {
  try {
    // Validate file first
    validateFile(file);

    // Check current attachment count
    const existingAttachments = await getLeadAttachments(leadId);
    if (existingAttachments.length >= MAX_ATTACHMENTS_PER_LEAD) {
      throw new AttachmentValidationError(
        `Limite de ${MAX_ATTACHMENTS_PER_LEAD} arquivos por lead atingido. Remova um arquivo existente para continuar.`
      );
    }

    // Generate unique storage path to prevent collisions
    const uniqueId = crypto.randomUUID();
    const storagePath = `${leadId}/${uniqueId}-${file.name}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("lead-attachments")
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get current user for audit trail
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Create database record with file metadata
    const { data, error: dbError } = await supabase
      .from("lead_attachments")
      .insert({
        lead_id: leadId,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
        uploaded_by: user?.id || null,
      })
      .select()
      .single();

    if (dbError) {
      // Rollback storage upload if database insert fails
      await supabase.storage.from("lead-attachments").remove([storagePath]);
      throw dbError;
    }

    return data as LeadAttachment;
  } catch (error) {
    console.error("Error uploading attachment:", error);
    throw error;
  }
}

/**
 * Generate a signed download URL for an attachment
 * URL expires after 1 hour
 */
export async function getAttachmentDownloadUrl(
  storagePath: string
): Promise<string> {
  try {
    const { data, error } = await supabase.storage
      .from("lead-attachments")
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw error;
  }
}

/**
 * Delete an attachment (both from storage and database)
 * First deletes from storage, then removes database record
 */
export async function deleteAttachment(attachmentId: string): Promise<boolean> {
  try {
    // Get attachment details (storage path) before deletion
    const { data: attachment, error: fetchError } = await supabase
      .from("lead_attachments")
      .select("storage_path")
      .eq("id", attachmentId)
      .single();

    if (fetchError) throw fetchError;
    if (!attachment) throw new Error("Attachment not found");

    // Delete file from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("lead-attachments")
      .remove([attachment.storage_path]);

    if (storageError) throw storageError;

    // Delete database record
    const { error: dbError } = await supabase
      .from("lead_attachments")
      .delete()
      .eq("id", attachmentId);

    if (dbError) throw dbError;

    return true;
  } catch (error) {
    console.error("Error deleting attachment:", error);
    return false;
  }
}

/**
 * Format file size in bytes to human-readable format
 * Examples: "1.2 KB", "5.3 MB"
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
