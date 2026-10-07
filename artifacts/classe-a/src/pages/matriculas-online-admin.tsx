import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetResumoMatriculaOnlineQueryKey,
  getListarSolicitacoesMatriculaOnlineQueryKey,
  getListAlunosQueryKey,
  getListTurmasQueryKey,
  useAprovarSolicitacaoMatriculaOnline,
  useGetResumoMatriculaOnline,
  useListarSolicitacoesMatriculaOnline,
  useListTurmas,
  useRejeitarSolicitacaoMatriculaOnline,
  type DuplicidadesMatriculaOnline,
  type SolicitacaoMatriculaOnline,
} from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, ArrowUpRight, Check, ChevronDown, CircleAlert, Clock3, RefreshCw, Search, ShieldCheck, X } from "lucide-react";

type Filter = "Todas" | "Pendente" | "Aprovada" | "Rejeitada";
const statusTone: Record<string, string> = {
  Pendente: "bg-amber-100 text-amber-900",
  Aprovada: "bg-emerald-100 text-emerald-900",
  Rejeitada: "bg-rose-100 text-rose-900",
};

const formatDate = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR").format(date);
};
const formatDateTime = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date);
};

function duplicatePayload(error: unknown): DuplicidadesMatriculaOnline | null {
  const err = error as { error?: unknown; possiveisDuplicados?: unknown; data?: unknown; response?: { data?: unknown } } | undefined;
  const body = (err?.data ?? err?.response?.data ?? err) as { error?: unknown; possiveisDuplicados?: unknown } | undefined;
  if (body?.error === "possible_duplicate" && Array.isArray(body.possiveisDuplicados)) return body as DuplicidadesMatriculaOnline;
  return null;
}

export default function MatriculasOnlineAdmin() {
  const [filter, setFilter] = useState<Filter>("Pendente");
  const [activeRequest, setActiveRequest] = useState<SolicitacaoMatriculaOnline | null>(null);
  const [classId, setClassId] = useState("");
  const [duplicates, setDuplicates] = useState<DuplicidadesMatriculaOnline | null>(null);
  const [confirmedDuplicates, setConfirmedDuplicates] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState("");
  const queryClient = useQueryClient();
  const params = filter === "Todas" ? undefined : { status: filter as "Pendente" | "Aprovada" | "Rejeitada" };
  const list = useListarSolicitacoesMatriculaOnline(params, { query: { queryKey: getListarSolicitacoesMatriculaOnlineQueryKey(params), staleTime: 0 } });
  const summary = useGetResumoMatriculaOnline({ query: { queryKey: getGetResumoMatriculaOnlineQueryKey(), staleTime: 0 } });
  const classes = useListTurmas({ query: { queryKey: getListTurmasQueryKey() } });
  const approve = useAprovarSolicitacaoMatriculaOnline();
  const reject = useRejeitarSolicitacaoMatriculaOnline();
  const activeClasses = (classes.data ?? []).filter((item) => item.status === "Ativa");
  const invalidateEnrollmentData = () => {
    void queryClient.invalidateQueries({ queryKey: getListarSolicitacoesMatriculaOnlineQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetResumoMatriculaOnlineQueryKey() });
  };

  const openRequest = (request: SolicitacaoMatriculaOnline) => {
    setActiveRequest(request);
    setClassId("");
    setDuplicates(null);
    setConfirmedDuplicates(false);
    setRejectReason("");
    setActionError("");
  };
  const closeRequest = () => {
    setActiveRequest(null);
    setDuplicates(null);
    setConfirmedDuplicates(false);
    setActionError("");
  };
  const handleApprove = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeRequest || !classId) return;
    setActionError("");
    approve.mutate({ id: activeRequest.id, data: { turmaId: Number(classId), ...(confirmedDuplicates ? { confirmarPossivelDuplicidade: true } : {}) } }, {
      onSuccess: () => {
        invalidateEnrollmentData();
        void queryClient.invalidateQueries({ queryKey: getListAlunosQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getListTurmasQueryKey() });
        closeRequest();
      },
      onError: (error) => {
        const found = duplicatePayload(error);
        if (found) setDuplicates(found);
        else setActionError("Não foi possível aprovar este pedido. Tente novamente.");
      },
    });
  };
  const handleReject = () => {
    if (!activeRequest) return;
    setActionError("");
    reject.mutate({ id: activeRequest.id, data: rejectReason.trim() ? { motivo: rejectReason.trim() } : {} }, {
      onSuccess: () => { invalidateEnrollmentData(); closeRequest(); },
      onError: () => setActionError("Não foi possível recusar este pedido. Tente novamente."),
    });
  };

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 pb-8 pt-6 sm:px-6 lg:px-9 lg:pt-9">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-primary">Atendimento · Área restrita</p>
            <h1 className="font-editorial text-3xl tracking-tight sm:text-4xl" data-testid="heading-enrollment-review">Interesses de matrícula</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Acompanhe cada pedido, converse com a família e decida os próximos passos.</p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-xl border border-border bg-card px-3 py-2 sm:self-auto" data-testid="status-private-area">
            <ShieldCheck className="h-4 w-4 text-primary" /><span className="text-xs font-semibold">Visível somente à equipe</span>
          </div>
        </div>

        {summary.isLoading ? (
          <div className="mb-6 h-24 animate-pulse rounded-2xl bg-secondary/70" data-testid="skeleton-enrollment-summary" />
        ) : summary.isError ? (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/5 p-4" role="alert" data-testid="status-summary-error">
            <span className="text-sm text-destructive">Não foi possível carregar o resumo.</span>
            <Button size="sm" variant="outline" onClick={() => summary.refetch()} data-testid="button-retry-summary">Tentar novamente</Button>
          </div>
        ) : (
          <section className="mb-7 grid gap-3 sm:grid-cols-[1fr_2fr]" data-testid="content-enrollment-summary">
            <div className="relative overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground sm:p-6">
              <div className="absolute -right-3 -top-8 h-28 w-28 rounded-full border border-white/15" />
              <p className="text-xs font-semibold uppercase tracking-[.17em] text-primary-foreground/75">Aguardando análise</p>
              <div className="mt-2 flex items-end gap-2"><span className="font-editorial text-5xl leading-none" data-testid="text-pending-count">{summary.data?.pendentes ?? 0}</span><span className="pb-1 text-sm text-primary-foreground/80">pedidos</span></div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 sm:px-6">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-primary"><Clock3 className="h-5 w-5" /></div>
              <div><p className="text-sm font-semibold">Uma decisão de cada vez</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Revise os dados antes de criar o cadastro ativo da aluna.</p></div>
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div><h2 className="font-editorial text-2xl">Pedidos recebidos</h2><p className="mt-1 text-xs text-muted-foreground">Dados pessoais disponíveis somente nesta área autenticada.</p></div>
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-muted p-1" role="group" aria-label="Filtrar pedidos" data-testid="group-request-filters">
              {(["Pendente", "Todas", "Aprovada", "Rejeitada"] as Filter[]).map((item) => (
                <button key={item} type="button" onClick={() => setFilter(item)} aria-pressed={filter === item} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${filter === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`} data-testid={`button-filter-${item.toLowerCase()}`}>{item}</button>
              ))}
            </div>
          </div>

          {list.isLoading ? (
            <div className="space-y-3 p-4 sm:p-6" data-testid="skeleton-enrollment-list">{[0, 1, 2].map((n) => <div key={n} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
          ) : list.isError ? (
            <div className="mx-4 my-6 flex flex-col items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-5 sm:mx-6" role="alert" data-testid="status-list-error">
              <CircleAlert className="h-5 w-5 text-destructive" /><p className="text-sm font-medium">A lista não pôde ser carregada.</p>
              <Button size="sm" variant="outline" onClick={() => list.refetch()} data-testid="button-retry-list"><RefreshCw className="mr-2 h-4 w-4" />Tentar novamente</Button>
            </div>
          ) : !list.data?.length ? (
            <div className="px-5 py-14 text-center" data-testid="content-enrollment-empty">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary"><Search className="h-5 w-5" /></div>
              <h3 className="font-editorial mt-4 text-2xl">{filter === "Pendente" ? "Tudo em dia por aqui." : "Nenhum pedido nesta seleção."}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{filter === "Pendente" ? "Quando uma família enviar interesse, o pedido aparecerá nesta lista." : "Experimente outro filtro para ver os pedidos registrados."}</p>
            </div>
          ) : (
            <div className="divide-y divide-border" data-testid="list-enrollment-requests">
              {list.data.map((request) => (
                <article key={request.id} className="flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-background/60 sm:flex-row sm:items-center sm:justify-between sm:px-6" data-testid={`card-enrollment-request-${request.id}`}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-semibold">{request.nome}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone[request.status] ?? "bg-muted text-muted-foreground"}`} data-testid={`status-request-${request.id}`}>{request.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Protocolo <span className="font-mono font-semibold text-foreground/80">{request.protocolo}</span><span className="mx-2">·</span>Recebido {formatDateTime(request.createdAt)}</p>
                    <p className="mt-2 truncate text-sm text-muted-foreground">{request.turmaInteresse} <span className="mx-1">·</span> Responsável: {request.nomeResponsavel}</p>
                  </div>
                  <Button variant="outline" className="w-full shrink-0 sm:w-auto" onClick={() => openRequest(request)} data-testid={`button-review-request-${request.id}`}>
                    Revisar pedido <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                </article>
              ))}
            </div>
          )}
        </section>
        <p className="mt-4 flex items-center gap-2 px-1 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" /> Informações pessoais protegidas pela sessão da equipe.</p>
      </div>

      {activeRequest && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-foreground/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRequest(); }} data-testid="dialog-review-request">
          <section role="dialog" aria-modal="true" aria-labelledby="review-title" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[1.5rem] border border-border bg-card p-5 shadow-2xl sm:rounded-[1.5rem] sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[.17em] text-primary">Protocolo {activeRequest.protocolo}</p><h2 id="review-title" className="font-editorial mt-2 text-3xl">{activeRequest.nome}</h2></div>
              <Button variant="ghost" size="icon" onClick={closeRequest} aria-label="Fechar revisão" data-testid="button-close-review"><X className="h-4 w-4" /></Button>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 rounded-2xl bg-muted/70 p-4 sm:p-5">
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Nascimento</p><p className="mt-1 text-sm font-medium" data-testid="text-request-birthdate">{formatDate(activeRequest.dataNascimento)}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Interesse</p><p className="mt-1 text-sm font-medium">{activeRequest.turmaInteresse}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Responsável</p><p className="mt-1 break-words text-sm font-medium">{activeRequest.nomeResponsavel}</p></div>
              <div><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Telefone</p><a className="mt-1 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline" href={`tel:${activeRequest.telefoneResponsavel}`} data-testid="link-request-phone">{activeRequest.telefoneResponsavel}</a></div>
              <div className="col-span-2 border-t border-border pt-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Consentimento</p><p className="mt-1 text-sm">Registrado em {formatDateTime(activeRequest.consentimentoEm)}</p></div>
              {activeRequest.motivoRejeicao && <div className="col-span-2"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Motivo informado</p><p className="mt-1 text-sm">{activeRequest.motivoRejeicao}</p></div>}
            </div>
            {activeRequest.status === "Pendente" ? (
              <div className="mt-6 space-y-5">
                <form onSubmit={handleApprove} className="space-y-3" data-testid="form-approve-request">
                  <div className="space-y-2">
                    <Label htmlFor="approval-class">Turma ativa para cadastro</Label>
                    <select id="approval-class" value={classId} onChange={(event) => setClassId(event.target.value)} required className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" data-testid="select-active-class">
                      <option value="" disabled>Selecione uma turma ativa</option>
                      {activeClasses.map((turma) => <option key={turma.id} value={turma.id}>{turma.nome} · {turma.diasSemana} · {turma.horario}</option>)}
                    </select>
                    {!classes.isLoading && !classes.isError && !activeClasses.length && <p className="text-xs text-amber-800" data-testid="status-no-active-classes">Não há turmas ativas. Cadastre ou ative uma turma antes de aprovar.</p>}
                    {classes.isError && <p className="text-xs text-destructive" role="alert" data-testid="status-classes-admin-error">Não foi possível carregar as turmas.</p>}
                    {classes.isLoading && <p className="text-xs text-muted-foreground" data-testid="status-admin-classes-loading">Carregando turmas...</p>}
                  </div>
                  {duplicates && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4" data-testid="content-possible-duplicates">
                      <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" /><div><p className="text-sm font-bold text-amber-950">Possíveis cadastros existentes</p><p className="mt-1 text-xs leading-5 text-amber-900">Confira os registros abaixo antes de continuar. A confirmação cria uma nova aluna ativa mesmo assim.</p></div></div>
                      <ul className="mt-3 space-y-2">
                        {duplicates.possiveisDuplicados.map((candidate) => <li key={candidate.id} className="rounded-lg border border-amber-200 bg-card/70 p-3 text-xs leading-5 text-foreground" data-testid={`item-possible-duplicate-${candidate.id}`}>
                          <p className="font-semibold">{candidate.nome} <span className="font-normal text-muted-foreground">· {candidate.status}</span></p>
                          <p>Nascimento: {formatDate(candidate.dataNascimento)} · Responsável: {candidate.nomeResponsavel}</p>
                          <p>Telefone: {candidate.telefoneResponsavel}{candidate.turmaDescricao ? ` · ${candidate.turmaDescricao}` : ""}</p>
                        </li>)}
                      </ul>
                      <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs font-medium leading-5 text-amber-950">
                        <input type="checkbox" className="mt-1 accent-amber-800" checked={confirmedDuplicates} onChange={(event) => setConfirmedDuplicates(event.target.checked)} data-testid="checkbox-confirm-duplicates" />
                        Revisei os possíveis registros e confirmo que devo criar uma nova aluna.
                      </label>
                    </div>
                  )}
                  {actionError && <p className="text-sm text-destructive" role="alert" data-testid="status-review-action-error">{actionError}</p>}
                  <Button type="submit" className="w-full" disabled={approve.isPending || classes.isLoading || classes.isError || !activeClasses.length || (Boolean(duplicates) && !confirmedDuplicates)} data-testid="button-approve-request">
                    <Check className="mr-2 h-4 w-4" />{approve.isPending ? "Aprovando..." : "Aprovar e criar aluna ativa"}
                  </Button>
                </form>
                <div className="border-t border-border pt-4">
                  <Label htmlFor="rejection-reason">Recusar pedido <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                  <Input id="rejection-reason" className="mt-2" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} maxLength={500} placeholder="Motivo para registro interno" data-testid="input-rejection-reason" />
                  <Button type="button" variant="outline" className="mt-3 w-full border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive" disabled={reject.isPending} onClick={handleReject} data-testid="button-reject-request">
                    {reject.isPending ? "Registrando recusa..." : "Recusar pedido"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-border bg-muted/50 p-4 text-sm text-muted-foreground" data-testid="status-request-decided">Este pedido foi {activeRequest.status.toLowerCase()} em {activeRequest.decididoEm ? formatDateTime(activeRequest.decididoEm) : "data não informada"}.</div>
            )}
            <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground"><ChevronDown className="h-3.5 w-3.5" /> Revise todos os dados antes de confirmar uma decisão.</div>
          </section>
        </div>
      )}
    </Layout>
  );
}
