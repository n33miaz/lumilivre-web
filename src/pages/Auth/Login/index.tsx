import {
  useState,
  type FocusEvent as ReactFocusEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { ScanLine, Smartphone } from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { useIsDark } from '../../../hooks/useIsDark';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
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

import LogoIcon from '../../../assets/icons/logo.svg?react';
import UserIcon from '../../../assets/icons/users.svg?react';
import LockIcon from '../../../assets/icons/lock.svg?react';
import DownloadIcon from '../../../assets/icons/upload.svg?react';
import { getErrorMessage } from '../../../utils/errorHandler';
import { getDefaultRouteForRole } from '../../../utils/roleCapabilities';

// Download button: same lit effect on an emerald base, matching its green identity.
const DOWNLOAD_SHADER: [string, string, string] = ['#047857', '#059669', '#10B981'];
const DOWNLOAD_HIGHLIGHT = '#A7F3D0';

const heroFeatures = [
  {
    Icon: ScanLine,
    titleKey: 'login.hero.feature.isbn.title',
    descKey: 'login.hero.feature.isbn.desc',
  },
  {
    Icon: Smartphone,
    titleKey: 'login.hero.feature.app.title',
    descKey: 'login.hero.feature.app.desc',
  },
];

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
      // NÃO logar o AxiosError (o config.data carrega usuário+senha).
      console.error('Falha no login', (err as { response?: { status?: number } })?.response?.status ?? '');

      addToast({
        type: 'error',
        title: t('login.toast.error.title'),
        description: getErrorMessage(err, t('login.toast.error.description')),
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
    <main
      className={`
        login-shell login-enter relative min-h-screen grid select-none overflow-hidden lg:grid-cols-2
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

      <section className="login-brand-panel relative z-10 hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div className="absolute inset-0 grid-pattern opacity-20" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <LogoIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-3xl tracking-tight">
              {t('login.title')}
            </h1>
            <div className="text-sm text-white/70 -mt-0.5">
              {t('login.hero.tagline')}
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-5">
          <h2 className="font-display font-extrabold text-5x1 xl:text-6xl leading-[1.05]">
            {t('login.headline.start')}{' '}
            <span className="text-lumi-100">
              {t('login.headline.highlight')}
            </span>
            .
          </h2>
          <p className="text-white/80 text-lg leading-relaxed">
            {t('login.subtitle')}
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            {heroFeatures.map(({ Icon, titleKey, descKey }) => (
              <div
                key={titleKey}
                className="flex items-start gap-3 rounded-xl bg-white/10 backdrop-blur p-3.5"
              >
                <Icon className="h-5 w-5 shrink-0 text-lumi-100" />
                <div>
                  <div className="text-sm font-display font-bold leading-tight">
                    {t(titleKey)}
                  </div>
                  <div className="text-xs text-white/70 leading-tight mt-0.5">
                    {t(descKey)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-sm text-white/60">
          <Trans
            t={t}
            i18nKey="login.hero.footer"
            values={{ version: __APP_VERSION__ }}
            components={{
              repo: (
                <a
                  href="https://github.com/n33miaz/lumilivre"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold transition-colors hover:text-lumi-label"
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
              <h2 className="font-display text-4xl font-extrabold text-gray-900 dark:text-white">
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
                href="/lumilivre.apk"
                download="LumiLivre.apk"
                onPointerMove={handleButtonPointerMove}
                onPointerEnter={handleButtonPointerEnter}
                onPointerLeave={handleButtonPointerLeave}
                onFocus={handleButtonFocus}
                onBlur={handleButtonBlur}
                className="btn-download btn-shader group relative flex w-full items-center justify-center overflow-hidden rounded-xl px-4 py-4 text-base font-extrabold text-white shadow-md transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-2xl hover:brightness-110 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
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
