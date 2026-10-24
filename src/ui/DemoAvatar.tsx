import React, { useMemo } from 'react';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { useAccent } from './AccentTheme';

/**
 * Original demo-user avatar: a friendly rounded "botanical bot" — a soft disc,
 * a rounded head with two expressive cream eyes and a small sprout. Organic
 * abstract forms + big eyes, inspired by https://x.ai/news/designing-grok-bot
 * (original character, not a copy).
 *
 * Colours follow the session accent from `<AccentProvider>`, so changing the
 * accent in Profile recolours the avatar live. Geometry is static; the drawn
 * children are memoized on the accent colours. React.memo keeps unchanged
 * renders free.
 *
 * Owned separately from the shared `ui/index` barrel so Profile can import it
 * directly without a barrel ownership conflict.
 */

export type DemoAvatarProps = {
  size?: number;
};

// Static geometry — never changes at runtime.
const STEM = 'M23.8 14.6 C23.4 12 23.6 9.8 24.2 8.2';
const LEAF_LEFT = 'M23.9 11.6 C21.3 11.4 19.1 9.7 18.8 7.2 C21.5 6.9 23.6 8.9 23.9 11.6 Z';
const LEAF_RIGHT = 'M24.2 11.2 C24.7 8.9 26.9 7.3 29.4 7.8 C29.1 10.3 26.9 12 24.2 11.2 Z';
const HEAD =
  'M23.6 14.2 C30.4 13.9 35.6 17.2 36.5 23.3 C37.3 28.6 36.4 33.6 32.4 36 C28.9 38.1 24.4 38.3 20.2 37.3 C15.3 36.1 11.9 32.4 11.3 27.3 C10.7 22.2 12.7 17.5 17.3 15.4 C19.2 14.6 21.4 14.2 23.6 14.2 Z';
const HEAD_LIGHT =
  'M17.9 17.4 C19.9 15.6 22.4 15.2 24.6 15.4 C22.5 16.6 20.4 18.4 19.2 20.6 C18.1 20.1 17.4 18.8 17.9 17.4 Z';
const SMILE = 'M21.6 31.1 C22.6 32.1 25.3 32.2 26.4 31.1';

const CREAM = '#F7F1DF';

export const DemoAvatar = React.memo(function DemoAvatar({ size = 48 }: DemoAvatarProps) {
  const { accent } = useAccent();
  const { strong, soft, ink } = accent;

  // Only the colour props vary; geometry is constant.
  const art = useMemo(
    () => (
      <>
        {/* sprout */}
        <Path d={STEM} stroke={strong} strokeWidth={1.7} strokeLinecap="round" fill="none" />
        <Path d={LEAF_LEFT} fill={soft} stroke={strong} strokeWidth={0.5} strokeOpacity={0.35} />
        <Path d={LEAF_RIGHT} fill={strong} opacity={0.72} />

        {/* organic head, slightly asymmetric for a friendly tilt */}
        <Path d={HEAD} fill={strong} />
        {/* gentle top light for depth */}
        <Path d={HEAD_LIGHT} fill={soft} opacity={0.34} />

        {/* expressive cream eyes */}
        <Ellipse cx={20.1} cy={25.8} rx={1.95} ry={3.15} fill={CREAM} transform="rotate(-7 20.1 25.8)" />
        <Ellipse cx={27.8} cy={25.4} rx={2.05} ry={3.35} fill={CREAM} transform="rotate(7 27.8 25.4)" />
        {/* catchlights keep the eyes alive at sidebar scale */}
        <Circle cx={19.4} cy={24.4} r={0.62} fill={ink} opacity={0.5} />
        <Circle cx={27.1} cy={24} r={0.62} fill={ink} opacity={0.5} />

        {/* quiet smile */}
        <Path
          d={SMILE}
          stroke={CREAM}
          strokeWidth={1.15}
          strokeLinecap="round"
          fill="none"
          opacity={0.9}
        />
      </>
    ),
    [strong, soft, ink],
  );

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      accessible
      accessibilityRole="image"
      accessibilityLabel="Demo farmer avatar"
    >
      {/* soft sage disc + hairline rim */}
      <Circle cx={24} cy={24} r={24} fill={soft} opacity={0.42} />
      <Circle cx={24} cy={24} r={23} fill="none" stroke={strong} strokeWidth={1} opacity={0.2} />
      {art}
    </Svg>
  );
});
