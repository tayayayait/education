export type ClassValue = string | undefined | null | false;

export const cn = (...classes: ClassValue[]) => classes.filter(Boolean).join(' ');
