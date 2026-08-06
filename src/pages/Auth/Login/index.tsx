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
  rememberLoginTips,
  selectLoginTips,
  type LoginTipIcon,
} from '../../../features/auth/loginTips';
import { ThemeToggle } from '../../../layouts/components/ThemeToggle';
import { LocaleSwitcher } from '../../../components/ui/LocaleSwitcher';
import { InputFloatingLabel } from '../../../components/ui/InputFloatingLabel';
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

  // Conjunto de dicas desta visita: sorteado uma vez na montagem, excluindo o
  // conjunto da visita anterior. A gravação vem depois, num efeito, para que o
  // duplo render do StrictMode não consuma duas rotações.
  const [tips] = useState(() =>
    selectLoginTips({ exclude: readLastShownTips() }),
  );
  const brandPanelRef = useRef<HTMLElement>(null);
  useScrollReveal(brandPanelRef);

  useEffect(() => {
    rememberLoginTips(tips);
  }, [tips]);

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
        className="login-brand-panel relative z-10 hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex"
      >
        <div aria-hidden="true" className="absolute inset-0 grid-pattern opacity-20" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <LogoIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">
              {t('login.title')}
            </h1>
            <div className="-mt-0.5 text-sm text-white/70">
              {t('login.hero.tagline')}
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          {/* `text-5x1` era erro de digitação: a classe não existia e o h2 caía no
              tamanho herdado. Corrigido para a escala de verdade. */}
          <h2
            data-reveal
            className="font-display text-4xl font-extrabold leading-[1.06] xl:text-5xl"
          >
            {t('login.headline.start')}{' '}
            <span className="text-lumi-100">{t('login.headline.highlight')}</span>.
          </h2>

          <p
            data-reveal
            data-reveal-delay="1"
            className="text-[17px] leading-relaxed text-white/80"
          >
            {t('login.subtitle')}
          </p>

          <div className="space-y-3">
            <div
              data-reveal
              data-reveal-delay="2"
              className="flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-white/50"
            >
              {t('login.tips.eyebrow')}
              <span aria-hidden="true" className="h-px flex-1 bg-white/15" />
            </div>

            {/* Conjunto diferente a cada acesso, nunca repetindo o anterior (ver
                `features/auth/loginTips.ts`). Empilhado em vez de duas colunas: a
                dica tem uma frase inteira de explicação, que em coluna estreita
                virava três linhas quebradas. */}
            <ul className="space-y-2.5">
              {tips.map((tip, index) => {
                const TipIcon = TIP_ICONS[tip.icon];
                return (
                  <li
                    key={tip.id}
                    data-reveal
                    data-reveal-delay={String(index + 3)}
                    className="group flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/10 p-3.5 backdrop-blur transition-[background-color,border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.16]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 transition-colors duration-300 group-hover:bg-white/25">
                      <TipIcon className="h-[18px] w-[18px] text-lumi-100" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-sm font-bold leading-tight">
                        {t(`login.tip.${tip.id}.title`)}
                      </span>
                      <span className="mt-1 block text-xs leading-snug text-white/75">
                        {t(`login.tip.${tip.id}.desc`)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/60">
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
                  className="font-semibold underline decoration-white/30 underline-offset-2 transition-colors hover:text-lumi-label"
                />
              ),
            }}
          />
        </div>
      </section>

      <section className="login-form-panel relative z-10 flex min-h-screen items-center justify-center px-5 py-20 lg:px-10">
        {/* Frosted chip lifts both controls off the mesh so the locale label
            stays legible in light mode (purple text was washing out). */}
        <div className="absolute right-5 top-5 z-20 flex items-center gap-1 rounded-full border border-black/5 bg-white/70 px-1.5 py-1 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/10">
          <LocaleSwitcher />
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:hidden">
            <LogoIcon className="mx-auto h-24 w-auto text-lumi-primary" />
            <h1 className="font-display text-4xl font-extrabold text-gray-900 dark:text-gray-100">
              {t('login.title')}
            </h1>
          </div>

          <div className="login-card rounded-3xl p-5 sm:p-8">
            <div className="mb-7 text-center">
              {/* Um degrau menor até `sm`: em 320px "Bem-Vindo(a)" quebrava em
                  duas linhas no tamanho cheio. */}
              <h2 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                {t('login.form.welcome')}
              </h2>
              <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                {t('login.form.welcome_subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="mt-4 text-center">
              <Link
                to="/forgot-password"
                className="text-base font-semibold text-gray-500 hover:text-lumi-primary dark:text-gray-400 dark:hover:text-lumi-label"
              >
                {t('login.link.forgot_password')}
              </Link>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-5 dark:border-white/10">
              <a
                {...apkLinkProps()}
                onPointerMove={handleButtonPointerMove}
                onPointerEnter={handleButtonPointerEnter}
                onPointerLeave={handleButtonPointerLeave}
                onFocus={handleButtonFocus}
                onBlur={handleButtonBlur}
                // Padding e corpo menores até `sm` para o rótulo caber inteiro em
                // 320px — o `truncate` cortava "…ANDROID" rente à borda.
                className="btn-download btn-shader group relative flex w-full items-center justify-center overflow-hidden rounded-xl px-3 py-4 text-[13px] font-extrabold text-white shadow-md transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-2xl hover:brightness-110 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 sm:px-4 sm:text-base"
              >
                {/* Same hover-driven shader light as the submit button. */}
                <ShaderBackground
                  className="absolute inset-0 z-[1] rounded-xl"
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
