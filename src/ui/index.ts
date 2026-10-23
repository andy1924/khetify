/**
 * Khetify shared UI.
 *
 * Feature screens import everything from `@/ui`:
 *
 * ```tsx
 * import { Screen, Header, Text, Button, Card, Field, Chip, Icon } from '@/ui';
 * ```
 *
 * Visual language: quiet leaf-green surfaces, 24pt gutters, 20pt section gaps,
 * pill actions 48dp tall, 10–12pt supporting copy. Tokens mirror the final
 * Pencil frame Qx0SG (390 × 844).
 */

export {
  colors,
  spacing,
  radii,
  fonts,
  typography,
  textColors,
  touchTarget,
  contentPadding,
  sectionGap,
} from './tokens';
export type { TextVariant } from './tokens';

export { Text, SectionLabel } from './Text';
export type { TextProps, TextTone } from './Text';

export { Icon, iconMap } from './Icon';
export type { IconName, IconProps } from './Icon';
export type { LucideIcon } from 'lucide-react-native';

export { Screen } from './Screen';
export type { ScreenProps } from './Screen';

export { Button } from './Button';
export type { ButtonProps, ButtonVariant } from './Button';

export { Card } from './Card';
export type { CardProps, CardTone } from './Card';

export { Field } from './Field';
export type { FieldProps } from './Field';

export { Chip } from './Chip';
export type { ChipProps, ChipTone } from './Chip';

export { Header } from './Header';
export type { HeaderProps } from './Header';

export { Sheet } from './Sheet';
export type { SheetProps } from './Sheet';

export {
  Row,
  Divider,
  Notice,
  KeyValue,
  IconSurface,
  IconButton,
  LinkText,
  Avatar,
  ProgressBar,
  SegmentedProgress,
  Toggle,
  ListRow,
  Footnote,
} from './primitives';
export type {
  RowProps,
  NoticeProps,
  NoticeTone,
  KeyValueProps,
  IconSurfaceProps,
  IconButtonProps,
  ToggleProps,
  ListRowProps,
} from './primitives';
