import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type FocusEvent as ReactFocusEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import {
  Clock,
  Compass,
  FileSpreadsheet,
  FileText,
  ListOrdered,
  Keyboard,
  MapPin,
  Megaphone,
  Palette,
  ScanLine,
  SlidersHorizontal,
  Smartphone,
  ToggleRight,
  Trophy,
} from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { useIsDark } from '../../../hooks/useIsDark';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useScrollReveal } from '../../../hooks/useScrollReveal';
import {
  readLastShownTips,
  type LoginTipIcon,
} from '../../../features/auth/loginTips';
import {
  readLastShownHeadline,
  rememberLoginVisit,
  selectLoginVisit,
} from '../../../features/auth/loginHeadlines';
import { ThemeToggle } from '../../../layouts/components/ThemeToggle';
import { LocaleSwitcher } from '../../../components/ui/LocaleSwitcher';
import { InputFloatingLabel } from '../../../components/ui/InputFloatingLabel';
import { AuthCardHeader } from '../../../components/ui/AuthCardHeader';
import { AuthSubmitButton } from '../../../components/ui/AuthSubmitButton';
import {
  setButtonLight,
  setButtonLightPosition,
} from '../../../components/ui/buttonLight';
import {
  LoginMeshBackground,
  ShaderBackground,
} from '../../../components/ui/ShaderBackground';
import { login as apiLogin } from '../../../services/authService';
import { apkLinkProps } from '../../../utils/apkDownload';

import LogoIcon from '../../../assets/icons/logo.svg?react';
import UserIcon from '../../../assets/icons/users.svg?react';
import LockIcon from '../../../assets/icons/lock.svg?react';
import DownloadIcon from '../../../assets/icons/upload.svg?react';
import { getErrorMessage } from '../../../utils/errorHandler';
import { getDefaultRouteForRole } from '../../../utils/roleCapabilities';

// Download button: same lit effect on an emerald base, matching its green identity.
const DOWNLOAD_SHADER: [string, string, string] = ['#047857', '#059669', '#10B981'];
const DOWNLOAD_HIGHLIGHT = '#A7F3D0';

// Ícone por dica. O acervo (`features/auth/loginTips.ts`) guarda só o nome, para
// ficar livre de React e poder ser testado sozinho.
const TIP_ICONS: Record<LoginTipIcon, ComponentType<{ className?: string }>> = {
  scan: ScanLine,
  queue: ListOrdered,
  clock: Clock,
  toggle: ToggleRight,
  report: FileText,
  export: FileSpreadsheet,
  board: Megaphone,
  trophy: Trophy,
  phone: Smartphone,
  keyboard: Keyboard,
  filter: SlidersHorizontal,
  pin: MapPin,
  compass: Compass,
  palette: Palette,
};

export function LoginPage() {
  const { t } = useTranslation('auth');
  const isDark = useIsDark();
  // Show the interactive mesh on anything wider than a phone (≥sm). Only true
  // phones (<640px) fall back to the flat `.login-shell` color. The split look
  // (brand purple | theme bg) is reserved for the two-column lg+ layout; below
  // that the mesh runs in cohesive non-split mode. Gating at lg used to hide the
  // mesh on scaled-display laptops whose CSS viewport sits under 1024px.
  const isLgUp = useMediaQuery('(min-width: 1024px)');
  const showMesh = useMediaQuery('(min-width: 640px)');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Chamada + dicas desta visita: sorteadas juntas, uma vez na montagem,
  // excluindo o que a visita anterior mostrou. Juntas porque a chamada é escolhida
  // primeiro e as dicas só podem sair do que sobra dela — ver
  // `features/auth/loginHeadlines.ts`, que é onde essa ordem é garantida.
  // A gravação vem depois, num efeito, para que o duplo render do StrictMode não
  // consuma duas rotações.
  const [visit] = useState(() =>
    selectLoginVisit({
      excludeHeadline: readLastShownHeadline(),
      excludeTips: readLastShownTips(),
    }),
  );
  const { headline, tips } = visit;
  const brandPanelRef = useRef<HTMLElement>(null);
  useScrollReveal(brandPanelRef);

  useEffect(() => {
    rememberLoginVisit(visit);
  }, [visit]);

  const navigate = useNavigate();
  const { login: setAuthUser } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const responseData = await apiLogin({ user: usuario, senha: senha });

      const userToStore = {
        id: responseData.id,
        email: responseData.email,
        role: responseData.role,
        token: responseData.token,
        isInitialPassword: responseData.isInitialPassword,
        guidedTourCompleted: responseData.guidedTourCompleted,
      };

      setAuthUser(userToStore);

      addToast({
        type: 'success',
        title: t('login.toast.success.title'),
        description: t('login.toast.success.description'),
        duration: 3000,
      });

      setIsExiting(true);

      setTimeout(() => {
        navigate(getDefaultRouteForRole(userToStore.role));
      }, 500);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      // NÃO logar o AxiosError (o config.data carrega usuário+senha).
      console.error('Falha no login', status ?? '');

      // 403 é conta desativada ou bloqueada — não é credencial errada. A API
      // já manda o motivo traduzido; repetir "usuário ou senha inválidos"
      // mandaria a pessoa tentar de novo até queimar o rate limit por nada.
      const isBlockedAccount = status === 403;

      addToast({
        type: 'error',
        title: isBlockedAccount
          ? t('login.toast.blocked.title')
          : t('login.toast.error.title'),
        description: getErrorMessage(
          err,
          isBlockedAccount
            ? t('login.toast.blocked.description')
            : t('login.toast.error.description'),
        ),
      });

      setIsLoading(false);
    }
  };

  // Pointer-spotlight handlers for the download <a> (the submit button manages
  // its own via AuthSubmitButton).
  const handleButtonPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    setButtonLightPosition(event.currentTarget, event.clientX, event.clientY);
  };

  const handleButtonPointerEnter = (event: ReactPointerEvent<HTMLElement>) => {
    setButtonLight(event.currentTarget, true);
    setButtonLightPosition(event.currentTarget, event.clientX, event.clientY);
  };

  const handleButtonPointerLeave = (event: ReactPointerEvent<HTMLElement>) => {
    setButtonLight(event.currentTarget, false);
  };

  const handleButtonFocus = (event: ReactFocusEvent<HTMLElement>) => {
    setButtonLight(event.currentTarget, true);
  };

  const handleButtonBlur = (event: ReactFocusEvent<HTMLElement>) => {
    setButtonLight(event.currentTarget, false);
  };

  return (
    // `grid-cols-1` explícito (= minmax(0, 1fr)) em vez da coluna implícita
    // `auto`: o rótulo do botão de download usa `truncate`, e `white-space:
    // nowrap` faz a largura mínima do conteúdo ser o texto inteiro. A coluna
    // `auto` obedecia e ficava com 368px num aparelho de 320px, empurrando o
    // cartão para fora da tela (o `overflow-hidden` escondia, em vez de rolar).
    <main
      className={`
        login-shell login-enter relative min-h-screen grid grid-cols-1 select-none overflow-hidden lg:grid-cols-2
        ${isExiting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}
      `}
    >
      {showMesh && (
        <LoginMeshBackground
          isDark={isDark}
          split={isLgUp}
          // Fixa a malha à ALTURA DA VIEWPORT (não à do <main>): com min-h-screen
          // + py-20, o formulário pode deixar o <main> mais alto que a tela, e o
          // `inset-0` esticava o canvas além da viewport — só o topo aparecia
          // ("muito para cima") e o ponteiro mapeava numa área grande demais,
          // deixando a reação fraca ("estática"). Limitar a 100svh devolve a
          // cobertura e a reatividade na área visível.
          className="login-stage absolute inset-x-0 top-0 z-0 h-[100svh] max-h-[100svh]"
          quality={0.55}
        />
      )}
      <div className="login-divider hidden lg:block" aria-hidden="true" />

      <section
        ref={brandPanelRef}
        className="login-brand-panel rule-lines relative z-10 hidden flex-col justify-between gap-12 overflow-hidden px-12 py-14 text-white lg:flex"
      >
        {/* Marca em linha, sobre um filete — o mesmo cabeçalho de ficha da
            landing, lido em negativo. O quadrado de vidro de 48px que embrulhava
            o logo saiu: glassmorphism era o segundo tique da lista, e aqui ele
            não estava resolvendo nada.
            "Library Management System" saiu da direita: era etiqueta decorativa,
            dizia em inglês o que o subtítulo do formulário já diz, e empurrava a
            marca para o canto. Sem ela, logo e nome ficam centrados juntos — que
            é o que o filete precisa apoiar. */}
        <div className="relative z-10 flex items-center justify-center gap-3 border-b-2 border-white/35 pb-5">
          <LogoIcon className="h-9 w-9 shrink-0 text-white" />
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            {t('login.title')}
          </h1>
        </div>

        <div className="relative z-10 max-w-lg">
          {/* Escala de abertura igual à do herói da landing: um salto grande
              entre o título e o texto de apoio, sem degradê no texto.
              O par chamada/apoio muda a cada acesso, e nunca fala do assunto das
              dicas ao lado — a exclusão é feita no sorteio, não conferida depois. */}
          <h2
            data-reveal
            className="font-display text-[2.6rem] font-extrabold leading-[1.1] tracking-[-0.03em] xl:text-[3.1rem]"
          >
            {t(`login.headline.${headline.id}.start`)}{' '}
            <span className="text-lumi-200">
              {t(`login.headline.${headline.id}.highlight`)}
            </span>
            .
          </h2>

          <p
            data-reveal
            data-reveal-delay="1"
            className="mt-7 max-w-[46ch] text-[17px] leading-relaxed text-lumi-100"
          >
            {t(`login.headline.${headline.id}.subtitle`)}
          </p>

          <div className="mt-14">
            {/* Os textos pequenos deste painel subiram de 45–70% para 75–80% de
                branco: sobre o ponto mais claro da malha (#8B2B87) as opacidades
                antigas caíam para 3,7:1, abaixo do mínimo AA para 10–11px. */}
            <div
              data-reveal
              data-reveal-delay="2"
              className="cota mb-2 border-t border-white/30 pt-4 text-[10px] uppercase text-white/80"
            >
              {t('login.tips.eyebrow')}
            </div>

            {/* Conjunto diferente a cada acesso, nunca repetindo o anterior (ver
                `features/auth/loginTips.ts`). Empilhado em vez de duas colunas: a
                dica tem uma frase inteira de explicação, que em coluna estreita
                virava três linhas quebradas.
                Eram cartões de vidro com borda e sombra — agora são linhas
                pautadas numeradas, o mesmo desenho das quatro ações do rodapé da
                landing. Um material só nas seis superfícies públicas. */}
            <ul>
              {tips.map((tip, index) => {
                const TipIcon = TIP_ICONS[tip.icon];
                return (
                  <li
                    key={tip.id}
                    data-reveal
                    data-reveal-delay={String(index + 3)}
                    className="flex items-start gap-4 border-b border-white/20 py-5"
                  >
                    <span
                      aria-hidden="true"
                      className="cota shrink-0 pt-1 text-[10px] text-white/75"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[2px] border border-white/30">
                      <TipIcon className="h-4 w-4 text-lumi-100" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-[15px] font-bold leading-tight">
                        {t(`login.tip.${tip.id}.title`)}
                      </span>
                      <span className="mt-1 block text-[13px] leading-snug text-lumi-100">
                        {t(`login.tip.${tip.id}.desc`)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="relative z-10 font-mono text-[11px] leading-relaxed text-white/80">
          <Trans
            t={t}
            i18nKey="login.hero.footer"
            values={{ version: __APP_VERSION__, year: new Date().getFullYear() }}
            components={{
              // Aponta para a landing (rota real) em vez do endereço de
              // repositório que estava aqui e não existe.
              site: (
                <Link
                  to="/"
                  className="font-semibold underline decoration-white/40 underline-offset-2 transition-colors hover:text-lumi-label"
                />
              ),
            }}
          />
        </div>
      </section>

      <section className="login-form-panel relative z-10 flex min-h-screen items-center justify-center px-5 py-20 lg:px-10">
        {/* Mesmo material da ficha do formulário: papel opaco, borda de 1px e o
            canto de 2px. Era vidro fosco a 80% — e vidro sobre uma malha que
            muda de cor o tempo todo é justamente o que o contraste não
            perdoa. Opaco, o roxo do idioma passa de 3,7:1 para 9,4:1 no claro,
            e no escuro a pastilha vira a mesma tinta do cartão. */}
        <div className="ficha-pastilha paper-surface absolute right-5 top-5 z-20 flex items-center gap-1 px-1.5 py-1">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          {/* Cabeçalho de celular/tablet: o painel de marca da esquerda não
              existe abaixo de `lg`, então o `h1` da tela mora aqui. Antes o logo
              tinha 96px de altura e empurrava o formulário para baixo da dobra
              num aparelho de 667px — agora a marca é uma linha só, com o mesmo
              filete das outras superfícies. */}
          {/* Sem a etiqueta "Library Management System" que ficava à direita: em
              telas estreitas ela quebrava a linha em três e deixava o cabeçalho
              mais alto que o formulário. Agora marca e nome ficam centrados —
              a mesma composição do painel de marca do `lg+`. */}
          <div className="mb-8 flex items-center justify-center gap-3 border-b-2 border-paper-900 pb-4 dark:border-ink-100/80 lg:hidden">
            <LogoIcon className="h-9 w-9 shrink-0 text-lumi-primary dark:text-lumi-label" />
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-paper-900 dark:text-ink-100">
              {t('login.title')}
            </h1>
          </div>

          <div className="ficha ficha-elevada ficha-furo paper-surface bg-paper-50 px-5 pb-14 pt-6 dark:bg-ink-900 sm:px-8 sm:pt-8">
            <AuthCardHeader
              kicker={t('login.kicker')}
              title={t('login.form.welcome')}
              subtitle={t('login.form.welcome_subtitle')}
              level={2}
            />

            <form onSubmit={handleSubmit} className="space-y-5">
              <InputFloatingLabel
                id="usuario"
                type="text"
                label={t('login.field.user')}
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                icon={UserIcon}
                disabled={isExiting}
                required
              />

              <InputFloatingLabel
                id="senha"
                type="password"
                label={t('login.field.password')}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                icon={LockIcon}
                disabled={isExiting}
                required
              />

              <div className="space-y-3 pt-2">
                <AuthSubmitButton
                  loading={isLoading || isExiting}
                  loadingLabel={t('login.button.submitting')}
                >
                  {t('login.button.submit')}
                </AuthSubmitButton>
              </div>
            </form>

            <div className="mt-5 text-center">
              <Link
                to="/forgot-password"
                className="rounded-[2px] text-[15px] font-semibold text-paper-600 underline decoration-paper-400 decoration-1 underline-offset-4 transition-colors hover:text-lumi-primary hover:decoration-lumi-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-lumi-400 dark:text-ink-400 dark:decoration-white/25 dark:hover:text-lumi-label"
              >
                {t('login.link.forgot_password')}
              </Link>
            </div>

            <div className="mt-6 border-t border-paper-300 pt-5 dark:border-white/10">
              <a
                {...apkLinkProps()}
                onPointerMove={handleButtonPointerMove}
                onPointerEnter={handleButtonPointerEnter}
                onPointerLeave={handleButtonPointerLeave}
                onFocus={handleButtonFocus}
                onBlur={handleButtonBlur}
                // Padding e corpo menores até `sm` para o rótulo caber inteiro em
                // 320px — o `truncate` cortava "…ANDROID" rente à borda.
                className="btn-download btn-shader group relative flex w-full items-center justify-center overflow-hidden rounded-md px-3 py-4 text-[13px] font-extrabold text-white shadow-md transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-2xl hover:brightness-110 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:px-4 sm:text-base"
              >
                {/* Same hover-driven shader light as the submit button. */}
                <ShaderBackground
                  className="absolute inset-0 z-[1] rounded-md"
                  variant={3}
                  colors={DOWNLOAD_SHADER}
                  highlight={DOWNLOAD_HIGHLIGHT}
                  intensity={1}
                  reactivity={0.65}
                  speed={1}
                  smoothing={0.2}
                  quality={0.85}
                  hoverOnly
                  enableRipple={false}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <DownloadIcon className="h-5 w-5" />
                  <span className="truncate">{t('login.download_app')}</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
