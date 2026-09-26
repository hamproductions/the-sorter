import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import type { ItemHistoryPoint } from '~/types/global-ranking';
import { Box, styled } from 'styled-system/jsx';

const WIDTH = 320;
const HEIGHT = 120;
const PAD_X = 28;
const PAD_Y = 16;

export function RankTrendChart({ points, color }: { points: ItemHistoryPoint[]; color?: string }) {
  const { t } = useTranslation();
  if (points.length === 0) {
    return (
      <Text color="fg.muted" fontSize="sm">
        {t('global_ranking.trend_empty')}
      </Text>
    );
  }

  const worst = Math.max(...points.map((p) => p.rank), 2);
  const x = (idx: number) =>
    points.length === 1 ? WIDTH / 2 : PAD_X + (idx * (WIDTH - PAD_X * 2)) / (points.length - 1);
  const y = (rank: number) => PAD_Y + ((rank - 1) * (HEIGHT - PAD_Y * 2)) / (worst - 1);
  const path = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${x(idx)},${y(p.rank)}`).join(' ');
  const label = t('global_ranking.trend');

  return (
    <Box style={{ ['--trend-color' as 'color']: color ?? 'currentColor' }} w="full" maxW="lg">
      <styled.svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT + 18}`}
        role="img"
        aria-label={label}
        w="full"
        h="auto"
        color="fg.muted"
      >
        <title>{label}</title>
        <line
          x1={PAD_X}
          x2={WIDTH - PAD_X}
          y1={y(1)}
          y2={y(1)}
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeDasharray="3 3"
        />
        <text x={2} y={y(1) + 4} fontSize="10" fill="currentColor">
          #1
        </text>
        <text x={2} y={y(worst) + 4} fontSize="10" fill="currentColor">
          #{worst}
        </text>
        <path
          d={path}
          fill="none"
          stroke="var(--trend-color)"
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {points.map((p, idx) => (
          <g key={p.month}>
            <circle cx={x(idx)} cy={y(p.rank)} r={3.5} fill="var(--trend-color)">
              <title>{`${p.month}: #${p.rank} / ${p.of}`}</title>
            </circle>
            {(idx === 0 || idx === points.length - 1 || points.length <= 6) && (
              <text
                x={x(idx)}
                y={HEIGHT + 14}
                fontSize="10"
                textAnchor="middle"
                fill="currentColor"
              >
                {p.month}
              </text>
            )}
          </g>
        ))}
      </styled.svg>
    </Box>
  );
}
