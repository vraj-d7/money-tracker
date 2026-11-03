export type ToastKind = 'success' | 'error' | 'info';

// Icon path for each toast kind (24×24 stroke icons)
export const toastIcons: Record<ToastKind, string> = {
  success: 'M5 12l4 4 10-10',
  error: 'M12 8v5M12 16.5v.5',
  info: 'M12 11v6M12 7.5v.5',
};
