import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { alpha } from '@/theme/tokens';

/** Flat presenter illustration standing in for teacher photos on the hero cards. */
export function TeacherFigure({
  width,
  color,
  variant = 0,
  teacherName,
}: {
  width: number;
  color: string;
  variant?: number;
  teacherName?: string | null;
}) {
  const skin = ['#B9784F', '#A86B45', '#C68B59'][variant % 3];
  const hair = '#1E1916';
  const longHair = /^(ms|mrs|miss)\.?\s/i.test(teacherName ?? '');
  return (
    <Svg width={width} height={width * 1.15} viewBox="0 0 120 138">
      <Circle cx="60" cy="66" r="54" fill={alpha(color, 0.28)} />
      <Circle cx="60" cy="66" r="40" fill={alpha('#FFFFFF', 0.06)} />
      {longHair && <Path d="M33 60C33 34 46 26 60 26C76 26 88 36 87 62L89 96H31Z" fill={hair} />}
      <Path d="M12 138C12 106 32 90 60 90C88 90 108 106 108 138Z" fill={color} />
      <Path d="M48 91L60 109L72 91Z" fill={alpha('#FFFFFF', 0.92)} />
      <Rect x="51" y="74" width="18" height="20" rx="7" fill={skin} />
      <Ellipse cx="60" cy="57" rx="22" ry="25" fill={skin} />
      {!longHair && <Path d="M37 55C37 37 48 30 60 30C73 30 84 37 83 55C79 45 71 41 60 41C50 41 42 46 37 55Z" fill={hair} />}
      {longHair && <Path d="M38 52C40 38 50 33 60 33C71 33 80 39 82 52C75 45 67 42 58 43C50 44 43 47 38 52Z" fill={hair} />}
    </Svg>
  );
}
