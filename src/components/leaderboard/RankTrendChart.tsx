import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from '../ui/text';
import type { ItemHistoryPoint } from '~/types/global-ranking';
import { Box, Stack, styled } from 'styled-system/jsx';

const WIDTH = 320;
const HEIGHT = 120;
const PAD_LEFT = 32;
const PAD_RIGHT = 16;
const PAD_Y = 12;
const AXIS_HEIGHT = 18;
export const TREND_CHART_ASPECT = `${WIDTH} / ${HEIGHT + AXIS_HEIGHT}`;

const yTicks = (worst: number) =>
  [...new Set([1, ...[1 / 3, 2 / 3].map((f) => Math.round(1 + f * (worst - 1))), worst])].filter(
    (tick) => tick >= 1 && tick <= worst
  );

export function RankTrendChart({ points, color }: { points: ItemHistoryPoint[]; color?: string }) {
  const { t, i18n } = useTranslation();
  const [active, setActive] = useState<number>();

  const formatMonth = useMemo(() => {
    const short = new Intl.DateTimeFormat(i18n.language, { month: 'short', timeZone: 'UTC' });
    const long = new Intl.DateTimeFormat(i18n.language, {
      year: 'numeric',
      month: 'long',
      timeZone: 'UTC'
    });
    return (month: string, full?: boolean) =>
      (full ? long : short).format(new Date(`${month}-01T00:00:00Z`));
  }, [i18n.language]);

  if (points.length === 0) {
    return (
      <Text color="fg.muted" fontSize="sm">
        {t('global_ranking.trend_empty')}
      </Text>
    );
  }

  const worst = Math.max(...points.map((p) => p.rank), 2);
  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const x = (idx: number) =>
    points.length === 1
      ? PAD_LEFT + plotWidth / 2
      : PAD_LEFT + (idx * plotWidth) / (points.length - 1);
  const y = (rank: number) => PAD_Y + ((rank - 1) * (HEIGHT - PAD_Y * 2)) / (worst - 1);
  const path = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'}${x(idx)},${y(p.rank)}`).join(' ');
  const labelEvery = Math.ceil(points.length / 6);
  const step = points.length === 1 ? plotWidth : plotWidth / (points.length - 1);
  const activePoint = active === undefined ? undefined : points[active];
  const label = t('global_ranking.trend');

  const move = (delta: number) =>
    setActive((idx) => Math.max(0, Math.min(points.length - 1, (idx ?? points.length) + delta)));

  return (
    <Stack gap="1" w="full" maxW="lg">
      <Box
        style={{ ['--trend-color' as 'color']: color ?? 'currentColor' }}
        position="relative"
        w="full"
      >
        <styled.svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT + AXIS_HEIGHT}`}
          role="img"
          aria-label={label}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft') move(-1);
            else if (e.key === 'ArrowRight') move(1);
            else if (e.key === 'Home') setActive(0);
            else if (e.key === 'End') setActive(points.length - 1);
            else return;
            e.preventDefault();
          }}
          onFocus={() => setActive((idx) => idx ?? points.length - 1)}
          onBlur={() => setActive(undefined)}
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setActive(undefined);
          }}
          display="block"
          w="full"
          h="auto"
          color="fg.muted"
          _focusVisible={{ outline: '2px solid', outlineColor: 'colorPalette.default' }}
        >
          <title>{label}</title>
          {yTicks(worst).map((tick) => (
            <g key={tick}>
              <line
                x1={PAD_LEFT}
                x2={WIDTH - PAD_RIGHT}
                y1={y(tick)}
                y2={y(tick)}
                stroke="currentColor"
                strokeOpacity={tick === 1 ? 0.3 : 0.12}
                strokeDasharray="3 3"
              />
              <text
                x={PAD_LEFT - 6}
                y={y(tick) + 3.5}
                fontSize="10"
                textAnchor="end"
                fill="currentColor"
              >
                #{tick}
              </text>
            </g>
          ))}
          {activePoint && active !== undefined && (
            <line
              x1={x(active)}
              x2={x(active)}
              y1={PAD_Y / 2}
              y2={HEIGHT - PAD_Y / 2}
              stroke="currentColor"
              strokeOpacity={0.4}
            />
          )}
          <path
            d={path}
            fill="none"
            stroke="var(--trend-color)"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
          {points.map((p, idx) => (
            <g key={p.month}>
              <circle
                cx={x(idx)}
                cy={y(p.rank)}
                r={idx === active ? 6 : 3.5}
                fill="var(--trend-color)"
                stroke={idx === active ? 'white' : 'none'}
                strokeWidth={2}
              />
              {(idx % labelEvery === 0 || idx === points.length - 1) && (
                <text
                  x={x(idx)}
                  y={HEIGHT + 13}
                  fontSize="10"
                  textAnchor="middle"
                  fill="currentColor"
                >
                  {formatMonth(p.month)}
                </text>
              )}
              <rect
                data-testid="trend-hit-area"
                x={x(idx) - step / 2}
                y={0}
                width={step}
                height={HEIGHT}
                fill="transparent"
                onPointerEnter={() => setActive(idx)}
                onPointerDown={() => setActive(idx)}
              />
            </g>
          ))}
        </styled.svg>
        {activePoint && active !== undefined && (
          <Box
            data-testid="trend-tooltip"
            role="status"
            style={{
              left: `${(x(active) / WIDTH) * 100}%`,
              transform: `translateX(${active === 0 ? '-10%' : active === points.length - 1 ? '-90%' : '-50%'})`
            }}
            zIndex="1"
            position="absolute"
            bottom="100%"
            borderColor="border.default"
            borderRadius="l2"
            borderWidth="1px"
            py="1.5"
            px="2.5"
            fontSize="xs"
            bg="bg.default"
            shadow="md"
            whiteSpace="nowrap"
            pointerEvents="none"
          >
            <Text fontWeight="bold">{formatMonth(activePoint.month, true)}</Text>
            <Text>
              {t('global_ranking.trend_rank', { rank: activePoint.rank, of: activePoint.of })}
            </Text>
            <Text color="fg.muted">
              {t('global_ranking.score')} {(activePoint.score * 100).toFixed(1)}% ·{' '}
              {t('global_ranking.submissions', { count: activePoint.appearances })}
            </Text>
          </Box>
        )}
      </Box>
    </Stack>
  );
}
