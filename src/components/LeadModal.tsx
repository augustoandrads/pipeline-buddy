import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Lead } from "@/types/crm";
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  empresa: z.string().min(1, "Empresa é obrigatória"),
  tipo_cliente: z.enum(["IMOBILIARIA", "CONSTRUTORA", "CORRETOR"]),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  telefone: z.string().optional(),
  quantidade_imoveis: z.coerce.number().optional(),
  valor_estimado_contrato: z.coerce.number().optional(),
  origem: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LeadModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Omit<Lead, "id" | "criado_em">) => void;
  isLoading: boolean;
}

export function LeadModal({ open, onClose, onSubmit, isLoading }: LeadModalProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      empresa: "",
      tipo_cliente: "IMOBILIARIA",
      email: "",
      telefone: "",
      origem: "",
      observacoes: "",
    },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      nome: values.nome,
      empresa: values.empresa,
      tipo_cliente: values.tipo_cliente,
      email: values.email || undefined,
      telefone: values.telefone || undefined,
      quantidade_imoveis: values.quantidade_imoveis,
      valor_estimado_contrato: values.valor_estimado_contrato,
      origem: values.origem || undefined,
      observacoes: values.observacoes || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nome do contato *</FormLabel>
                    <FormControl>
                      <Input placeholder="João Silva" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="empresa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa *</FormLabel>
                    <FormControl>
                      <Input placeholder="Imobiliária XYZ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipo_cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de cliente *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IMOBILIARIA">Imobiliária</SelectItem>
                        <SelectItem value="CONSTRUTORA">Construtora</SelectItem>
                        <SelectItem value="CORRETOR">Corretor Autônomo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input placeholder="joao@empresa.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input placeholder="(11) 99999-9999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantidade_imoveis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qtd. de imóveis</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="150" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_estimado_contrato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor estimado (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="origem"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Origem do lead</FormLabel>
                    <FormControl>
                      <Input placeholder="LinkedIn, Indicação, Evento..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informações relevantes sobre o lead..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Cadastrar Lead
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
