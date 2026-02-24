export type TipoCliente = 'IMOBILIARIA' | 'CONSTRUTORA' | 'CORRETOR';

export type Etapa =
  | 'REUNIAO_REALIZADA'
  | 'PROPOSTA_ENVIADA'
  | 'EM_NEGOCIACAO'
  | 'CONTRATO_GERADO'
  | 'VENDA_FECHADA'
  | 'PERDIDO';

export type LossReason = 'PRICE' | 'COMPETITOR' | 'NO_URGENCY' | 'NO_RESPONSE' | 'WRONG_PROFILE' | 'OTHER';

export type TaskType = 'CALL' | 'MESSAGE' | 'MEETING' | 'EMAIL' | 'OTHER';

export type TaskStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE';

export interface Lead {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  empresa: string;
  tipo_cliente: TipoCliente;
  quantidade_imoveis?: number;
  valor_estimado_contrato?: number;
  origem?: string;
  observacoes?: string;
  criado_em: string;
}

export interface Card {
  id: string;
  lead_id: string;
  etapa: Etapa;
  data_entrada_etapa: string;
  criado_em: string;
  leads?: Lead;
}

export interface Movimentacao {
  id: string;
  card_id: string;
  etapa_anterior: string;
  etapa_nova: string;
  criado_em: string;
}

export interface LeadLoss {
  id: string;
  lead_id: string;
  reason: LossReason;
  other_details?: string;
  criado_em: string;
}

export interface Task {
  id: string;
  lead_id: string;
  title: string;
  type: TaskType;
  due_date: string;
  assignee?: string;
  status: TaskStatus;
  result?: string;
  criado_em: string;
  updated_at: string;
}

export const ETAPAS: { key: Etapa; label: string; color: string }[] = [
  { key: 'REUNIAO_REALIZADA', label: 'Reunião Realizada', color: 'etapa-reuniao' },
  { key: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada', color: 'etapa-proposta' },
  { key: 'EM_NEGOCIACAO', label: 'Em Negociação', color: 'etapa-negociacao' },
  { key: 'CONTRATO_GERADO', label: 'Contrato Gerado', color: 'etapa-contrato' },
  { key: 'VENDA_FECHADA', label: 'Venda Fechada', color: 'etapa-venda' },
  { key: 'PERDIDO', label: 'Perdido', color: 'etapa-perdido' },
];

export const LOSS_REASON_LABELS: Record<LossReason, string> = {
  PRICE: 'Preço',
  COMPETITOR: 'Concorrente',
  NO_URGENCY: 'Sem urgência',
  NO_RESPONSE: 'Sem resposta',
  WRONG_PROFILE: 'Perfil não adequado',
  OTHER: 'Outro',
};

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  CALL: 'Ligação',
  MESSAGE: 'Mensagem',
  MEETING: 'Reunião',
  EMAIL: 'E-mail',
  OTHER: 'Outro',
};

export const TIPO_CLIENTE_LABELS: Record<TipoCliente, string> = {
  IMOBILIARIA: 'Imobiliária',
  CONSTRUTORA: 'Construtora',
  CORRETOR: 'Corretor Autônomo',
};

export type AttachmentMimeType =
  | 'application/pdf'
  | 'image/jpeg'
  | 'image/png'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/vnd.ms-excel';

export interface LeadAttachment {
  id: string;
  lead_id: string;
  file_name: string;
  file_size: number;
  mime_type: AttachmentMimeType;
  storage_path: string;
  uploaded_by?: string;
  criado_em: string;
}

export const ATTACHMENT_MIME_TYPE_LABELS: Record<AttachmentMimeType, string> = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/vnd.ms-excel': 'Excel',
};

// File upload validation constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes
export const MAX_ATTACHMENTS_PER_LEAD = 5;
export const ALLOWED_MIME_TYPES: AttachmentMimeType[] = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];
