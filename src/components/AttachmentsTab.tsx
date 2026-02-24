/**
 * Attachments Tab for Lead Card
 * Displays attachments (PDFs, images, documents) related to a lead
 * with upload, download, and delete functionality
 */

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, Download, Trash2, File, FileImage } from "lucide-react";
import {
  getLeadAttachments,
  uploadAttachment,
  deleteAttachment,
  getAttachmentDownloadUrl,
  formatFileSize,
  AttachmentValidationError,
} from "@/services/attachmentsService";
import {
  ATTACHMENT_MIME_TYPE_LABELS,
  MAX_FILE_SIZE,
  MAX_ATTACHMENTS_PER_LEAD,
} from "@/types/crm";
import type { LeadAttachment } from "@/types/crm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface AttachmentsTabProps {
  leadId: string;
}

export function AttachmentsTab({ leadId }: AttachmentsTabProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch attachments
  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ["leadAttachments", leadId],
    queryFn: () => getLeadAttachments(leadId),
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadAttachment(leadId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leadAttachments", leadId] });
      toast({ title: "Arquivo enviado com sucesso!" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsUploading(false);
    },
    onError: (error: Error) => {
      if (error instanceof AttachmentValidationError) {
        toast({ title: error.message, variant: "destructive" });
      } else {
        toast({ title: "Erro ao enviar arquivo", variant: "destructive" });
      }
      setIsUploading(false);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leadAttachments", leadId] });
      toast({ title: "Arquivo deletado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao deletar arquivo", variant: "destructive" });
    },
  });

  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  // Handle download
  const handleDownload = async (attachment: LeadAttachment) => {
    try {
      const url = await getAttachmentDownloadUrl(attachment.storage_path);
      window.open(url, "_blank");
    } catch (error) {
      toast({ title: "Erro ao baixar arquivo", variant: "destructive" });
    }
  };

  // Get file icon based on MIME type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <FileImage className="w-5 h-5 text-blue-600" />;
    }
    if (mimeType === "application/pdf") {
      return <FileText className="w-5 h-5 text-red-600" />;
    }
    return <File className="w-5 h-5 text-gray-600" />;
  };

  const canUploadMore = attachments.length < MAX_ATTACHMENTS_PER_LEAD;

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="space-y-2">
        <Input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={!canUploadMore || isUploading}
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          className="hidden"
          id={`file-upload-${leadId}`}
        />
        <label htmlFor={`file-upload-${leadId}`} className="block">
          <Button
            size="sm"
            className="gap-2 w-full"
            disabled={!canUploadMore || isUploading}
            asChild
          >
            <span>
              <Upload className="w-4 h-4" />
              {isUploading ? "Enviando..." : "Adicionar Arquivo"}
            </span>
          </Button>
        </label>
        <p className="text-xs text-muted-foreground text-center">
          {attachments.length}/{MAX_ATTACHMENTS_PER_LEAD} arquivos • Máx{" "}
          {MAX_FILE_SIZE / 1024 / 1024}MB por arquivo
        </p>
        <p className="text-xs text-muted-foreground text-center">
          PDF, JPG, PNG, Word, Excel
        </p>
      </div>

      {/* Attachments List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Carregando anexos...
        </div>
      ) : attachments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhum arquivo anexado. Clique em "Adicionar Arquivo" para começar.
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment: LeadAttachment) => (
            <div
              key={attachment.id}
              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                {/* File Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {getFileIcon(attachment.mime_type)}
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium text-sm truncate"
                      title={attachment.file_name}
                    >
                      {attachment.file_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {ATTACHMENT_MIME_TYPE_LABELS[attachment.mime_type]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(attachment.criado_em).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => handleDownload(attachment)}
                    title="Baixar arquivo"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      if (
                        confirm(
                          "Tem certeza que deseja deletar este arquivo? Esta ação não pode ser desfeita."
                        )
                      ) {
                        deleteMutation.mutate(attachment.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    title="Deletar arquivo"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
