import { BarcodeIcon } from '@phosphor-icons/react/dist/csr/Barcode';
import { CalculatorIcon } from '@phosphor-icons/react/dist/csr/Calculator';
import { CarIcon } from '@phosphor-icons/react/dist/csr/Car';
import { FileTextIcon } from '@phosphor-icons/react/dist/csr/FileText';
import { HouseIcon } from '@phosphor-icons/react/dist/csr/House';
import { ListIcon } from '@phosphor-icons/react/dist/csr/List';
import { ReceiptIcon } from '@phosphor-icons/react/dist/csr/Receipt';
import { UserCircleIcon } from '@phosphor-icons/react/dist/csr/UserCircle';
import { UsersIcon } from '@phosphor-icons/react/dist/csr/Users';
import type { Icon } from '@phosphor-icons/react';

export type NavIcon =
  | 'house'
  | 'users'
  | 'car'
  | 'calculator'
  | 'file-text'
  | 'receipt'
  | 'barcode'
  | 'list'
  | 'user-circle';

/** Íconos del NavItem (`design-system §6.2`). */
export const NAV_ICONOS: Record<NavIcon, Icon> = {
  house: HouseIcon,
  users: UsersIcon,
  car: CarIcon,
  calculator: CalculatorIcon,
  'file-text': FileTextIcon,
  receipt: ReceiptIcon,
  barcode: BarcodeIcon,
  list: ListIcon,
  'user-circle': UserCircleIcon,
};
