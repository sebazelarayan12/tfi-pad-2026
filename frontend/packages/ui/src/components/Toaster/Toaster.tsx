import { CheckCircleIcon } from '@phosphor-icons/react/dist/csr/CheckCircle';
import { WarningCircleIcon } from '@phosphor-icons/react/dist/csr/WarningCircle';
import { Toaster as Sonner, toast } from 'sonner';

const TOAST =
  'flex w-[356px] max-w-[calc(100vw-32px)] items-center gap-sp-12 rounded-card border border-border-strong bg-surface-panel px-sp-16 py-sp-12 text-body-sm text-text-primary shadow-lg';

/**
 * Avisos efímeros (Sonner con los tokens del design system). Se monta una sola vez en la raíz de la
 * app; cada pantalla dispara `toast.success(...)` o `toast.error(...)`. El texto lo define la pantalla.
 * Los errores que el usuario debe corregir siguen en `AlertaError` (inline): el toast desaparece solo.
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      duration={5000}
      visibleToasts={3}
      theme="light"
      containerAriaLabel="Notificaciones"
      icons={{
        success: <CheckCircleIcon size={20} weight="fill" aria-hidden="true" />,
        error: <WarningCircleIcon size={20} weight="fill" aria-hidden="true" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: TOAST,
          success: '!border-transparent !bg-status-vigente-bg !text-status-vigente-text',
          error: '!border-transparent !bg-status-cancelada-bg !text-status-cancelada-text',
          icon: 'shrink-0',
          content: 'flex-1',
          title: 'text-body-sm font-semibold',
        },
      }}
    />
  );
}

export { toast };
