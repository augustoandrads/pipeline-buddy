export type TipoCliente = 'IMOBILIARIA' | 'CONSTRUTORA' | 'CORRETOR';

export type Etapa =
  | 'REUNIAO_REALIZADA'
  | 'PROPOSTA_ENVIADA'
  | 'EM_NEGOCIACAO'
  | 'CONTRATO_GERADO'
  | 'VENDA_FECHADA';

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

export const ETAPAS: { key: Etapa; label: string; color: string }[] = [
  { key: 'REUNIAO_REALIZADA', label: 'Reunião Realizada', color: 'etapa-reuniao' },
  { key: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada', color: 'etapa-proposta' },
  { key: 'EM_NEGOCIACAO', label: 'Em Negociação', color: 'etapa-negociacao' },
  { key: 'CONTRATO_GERADO', label: 'Contrato Gerado', color: 'etapa-contrato' },
  { key: 'VENDA_FECHADA', label: 'Venda Fechada', color: 'etapa-venda' },
];

export const TIPO_CLIENTE_LABELS: Record<TipoCliente, string> = {
  IMOBILIARIA: 'Imobiliária',
  CONSTRUTORA: 'Construtora',
  CORRETOR: 'Corretor Autônomo',
};
