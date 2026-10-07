import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Check, ChevronLeft, CircleCheck, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useCriarSolicitacaoMatriculaOnline, useGetOpcoesMatriculaOnline, getGetOpcoesMatriculaOnlineQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const today = new Date();
const maxBirthDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

export default function MatriculaOnline() {
  const options = useGetOpcoesMatriculaOnline({ query: { queryKey: getGetOpcoesMatriculaOnlineQueryKey(), staleTime: 60_000 } });
  const submitRequest = useCriarSolicitacaoMatriculaOnline();
  const [form, setForm] = useState({ nome: "", dataNascimento: "", nomeResponsavel: "", telefoneResponsavel: "", turmaInteresse: "", consentimento: false, website: "" });
  const [protocol, setProtocol] = useState("");
  const setField = (field: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitRequest.mutate({
      data: {
        nome: form.nome.trim(),
        dataNascimento: form.dataNascimento,
        nomeResponsavel: form.nomeResponsavel.trim(),
        telefoneResponsavel: form.telefoneResponsavel.trim(),
        turmaInteresse: form.turmaInteresse,
        consentimento: true,
        website: form.website,
      },
    }, { onSuccess: (result) => setProtocol(result.protocolo) });
  };

  return (
    <main className="dance-paper min-h-[100dvh] px-4 pb-12 pt-5 text-foreground sm:px-8 sm:pt-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <Link href="/matricula" className="flex items-center gap-3 rounded-lg" data-testid="link-studio-home">
            <img src="/logo.png" alt="Studio de Dança Classe A" className="h-12 w-12 object-contain" />
            <div><p className="text-sm font-bold tracking-[0.13em] text-primary">CLASSE A</p><p className="text-[11px] tracking-wide text-muted-foreground">STUDIO DE DANÇA</p></div>
          </Link>
          <Link href="/login" className="hidden items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary sm:inline-flex" data-testid="link-staff-login">
            Acesso da equipe <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="mt-8 grid gap-9 lg:mt-14 lg:grid-cols-[.9fr_1.1fr] lg:items-start lg:gap-16">
          <section className="soft-enter pt-1 lg:sticky lg:top-12 lg:pt-9">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/70 px-3 py-1.5 text-xs font-semibold tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" /> UM PRIMEIRO PASSO
            </div>
            <h1 className="font-editorial max-w-xl text-[2.75rem] leading-[1.04] tracking-[-0.035em] text-foreground sm:text-5xl lg:text-[3.65rem]">
              Toda dança começa com <span className="text-primary">um sim.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">
              Conte um pouquinho sobre sua família. Nossa equipe vai entrar em contato para conversar sobre a turma ideal.
            </p>
            <div className="mt-8 grid max-w-md grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border/80 bg-card/70 p-4">
                <ShieldCheck className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">Seus dados protegidos</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Apenas a equipe do studio terá acesso.</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card/70 p-4">
                <CircleCheck className="mb-3 h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">Sem compromisso</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">Este pedido não confirma a matrícula.</p>
              </div>
            </div>
            <p className="mt-8 hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><LockKeyhole className="h-3.5 w-3.5" /> Formulário seguro do Studio Classe A</p>
          </section>

          <section className="soft-enter rounded-[1.65rem] border border-border/80 bg-card p-5 shadow-[0_22px_70px_-38px_hsl(337_48%_42%/.35)] sm:p-8" style={{ animationDelay: "90ms" }}>
            {protocol ? (
              <div className="py-5 sm:py-10" data-testid="content-request-success">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-800"><Check className="h-7 w-7" /></div>
                <p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-primary">Pedido recebido</p>
                <h2 className="font-editorial mt-2 text-3xl leading-tight sm:text-4xl">Vamos conversar em breve.</h2>
                <p className="mt-4 max-w-md leading-7 text-muted-foreground">Seu interesse foi enviado para nossa equipe. Anote o protocolo abaixo para referência. O envio não significa que a matrícula foi concluída.</p>
                <div className="mt-7 rounded-2xl border border-primary/20 bg-primary/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">Seu protocolo</p>
                  <p className="mt-2 break-all font-mono text-xl font-bold tracking-wide text-primary" data-testid="text-enrollment-protocol">{protocol}</p>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">A equipe Classe A entrará em contato com o responsável informado.</p>
              </div>
            ) : (
              <>
                <div className="mb-7 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">Interesse em aulas</p>
                    <h2 className="font-editorial mt-2 text-3xl">Vamos conhecer vocês</h2>
                    <p className="mt-2 text-sm text-muted-foreground">Preencha os dados para nossa equipe retornar.</p>
                  </div>
                  <span className="mt-1 hidden rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground sm:inline">1 de 1</span>
                </div>
                <form className="space-y-5" onSubmit={handleSubmit} data-testid="form-online-enrollment">
                  <div aria-hidden="true" className="fixed -left-[10000px] top-auto h-px w-px overflow-hidden">
                    <label htmlFor="website">Não preencha este campo</label>
                    <input id="website" name="website" type="text" autoComplete="off" tabIndex={-1} value={form.website} onChange={(event) => setField("website", event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="child-name">Nome da criança</Label>
                    <Input id="child-name" data-testid="input-child-name" autoComplete="name" maxLength={120} value={form.nome} onChange={(event) => setField("nome", event.target.value)} placeholder="Nome completo" required minLength={2} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birth-date">Data de nascimento</Label>
                    <Input id="birth-date" data-testid="input-child-birthdate" type="date" max={maxBirthDate} value={form.dataNascimento} onChange={(event) => setField("dataNascimento", event.target.value)} required />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="guardian-name">Nome do responsável</Label>
                      <Input id="guardian-name" data-testid="input-guardian-name" autoComplete="name" maxLength={120} value={form.nomeResponsavel} onChange={(event) => setField("nomeResponsavel", event.target.value)} placeholder="Seu nome completo" required minLength={2} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardian-phone">Telefone do responsável</Label>
                      <Input id="guardian-phone" data-testid="input-guardian-phone" type="tel" autoComplete="tel" maxLength={24} minLength={10} value={form.telefoneResponsavel} onChange={(event) => setField("telefoneResponsavel", event.target.value)} placeholder="(00) 00000-0000" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="class-interest">Turma de interesse</Label>
                    <select id="class-interest" data-testid="select-class-interest" className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60" value={form.turmaInteresse} onChange={(event) => setField("turmaInteresse", event.target.value)} required disabled={options.isLoading || options.isError || !options.data?.opcoes.length}>
                      <option value="" disabled>{options.isLoading ? "Carregando turmas..." : "Selecione uma turma"}</option>
                      {options.data?.opcoes.map((choice) => <option key={choice.valor} value={choice.valor}>{choice.rotulo}</option>)}
                    </select>
                    {options.isLoading && <p className="text-xs text-muted-foreground" data-testid="status-classes-loading">Buscando turmas disponíveis...</p>}
                    {options.isError && <div className="flex items-center justify-between gap-3 text-xs text-destructive" role="alert" data-testid="status-classes-error"><span>Não foi possível carregar as turmas.</span><button type="button" className="font-semibold underline underline-offset-2" onClick={() => options.refetch()} data-testid="button-retry-classes">Tentar novamente</button></div>}
                    {!options.isLoading && !options.isError && !options.data?.opcoes.length && <p className="text-xs text-muted-foreground" data-testid="status-classes-empty">No momento, não há turmas disponíveis para seleção.</p>}
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/70 p-4" data-testid="label-consent">
                    <input className="mt-1 h-4 w-4 shrink-0 accent-primary" type="checkbox" checked={form.consentimento} onChange={(event) => setField("consentimento", event.target.checked)} required aria-describedby="consent-copy" data-testid="checkbox-consent" />
                    <span id="consent-copy" className="text-xs leading-5 text-muted-foreground">Autorizo o Studio Classe A a utilizar estes dados para entrar em contato sobre o interesse em aulas, conforme a finalidade deste pedido.</span>
                  </label>
                  {submitRequest.isError && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert" data-testid="status-enrollment-error">Não foi possível enviar agora. Confira sua conexão e tente novamente.</p>}
                  <Button type="submit" className="h-12 w-full rounded-xl text-sm font-semibold shadow-sm" disabled={submitRequest.isPending || options.isLoading || options.isError || !options.data?.opcoes.length} data-testid="button-submit-enrollment">
                    {submitRequest.isPending ? "Enviando pedido..." : <>Enviar interesse <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                  <p className="text-center text-[11px] leading-5 text-muted-foreground">Enviar este formulário registra seu interesse. A matrícula só acontece após o contato e confirmação com a equipe.</p>
                </form>
              </>
            )}
            <div className="mt-7 border-t border-border pt-5 sm:hidden">
              <Link href="/login" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground" data-testid="link-login-mobile"><ChevronLeft className="h-4 w-4" /> Acesso da equipe</Link>
            </div>
          </section>
        </div>
        <footer className="mt-10 border-t border-border/70 pt-5 text-center text-xs text-muted-foreground">Studio de Dança Classe A <span className="mx-1.5">·</span> Um passo de cada vez.</footer>
      </div>
    </main>
  );
}
