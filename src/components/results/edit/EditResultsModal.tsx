import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import type { DragEndEvent, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  defaultDropAnimationSideEffects,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useEffect, useMemo, useState } from 'react';
import { isEqual } from 'lodash-es';
import { Dialog } from '../../ui/dialog';
import { IconButton } from '../../ui/icon-button';
import { Button } from '../../ui/button';
import { SortableItem } from './SortableItem';
import { HStack, Stack } from 'styled-system/jsx';
import type { Character } from '~/types';
import { getCastName, stateToCharacterList } from '~/utils/character';

export function EditResultsModal(
  props: Dialog.RootProps & {
    charactersData?: Character[];
    order: string[][];
    setOrder: (item: string[][]) => void;
    originalOrder: string[][];
    isSeiyuu: boolean;
  }
) {
  const { charactersData, order, originalOrder, setOrder, isSeiyuu, ...rest } = props;
  const [items, setItems] = useState<UniqueIdentifier[]>([]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const { t, i18n } = useTranslation();

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const lang = i18n.language;

  const charactersMap = useMemo(() => {
    if (!order || !charactersData) return {};
    return Object.fromEntries(
      stateToCharacterList(order, charactersData, isSeiyuu)
        .map((e) => [e[0]?.id, e] as const)
        .filter((i) => !!i[0])
    );
  }, [charactersData, isSeiyuu, order]);

  useEffect(() => {
    const ids = originalOrder.map((o) => o[0]).filter((i) => !!i);
    let timeoutId: ReturnType<typeof setTimeout>;

    if (!rest.open) {
      timeoutId = setTimeout(() => setItems([]), 200);
      return () => clearTimeout(timeoutId);
    }

    if (
      !order ||
      !isEqual(new Set(order.flatMap((o) => o)), new Set(originalOrder.flatMap((o) => o)))
    ) {
      setItems(ids);
      setOrder(originalOrder);
    } else {
      setItems(order.map((o) => o[0]).filter((i) => !!i));
    }
    return () => clearTimeout(timeoutId);
  }, [order, originalOrder, rest.open, setOrder]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.indexOf(active.id);
        const newIndex = over?.id ? currentItems.indexOf(over.id) : undefined;

        return arrayMove(currentItems, oldIndex, newIndex ?? currentItems.length);
      });
    }

    setActiveId(null);
  }

  const handleSave = () => {
    const res = items.map((i) => charactersMap[i].map((a) => a.id));
    setOrder(res);
    rest.onOpenChange?.({ open: false });
  };

  const handleCancel = () => {
    rest.onOpenChange?.({ open: false });
  };

  return (
    <Dialog.Root lazyMount unmountOnExit {...rest}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Stack p="4">
            <Dialog.Title>{t('results.edit')}</Dialog.Title>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              {import.meta.env.TEST && (
                <div style={{ fontSize: 0 }}>
                  {items.map((i) => getCastName(charactersMap[i]?.[0]?.casts?.[0], lang)).join(' ')}
                </div>
              )}
              <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <Stack maxH="80vh" overflowY="auto">
                  {items.map((item, idx) => (
                    <SortableItem
                      key={item}
                      rank={idx + 1}
                      id={item}
                      characters={charactersMap[item]}
                      isSeiyuu={isSeiyuu}
                      locale={lang}
                    />
                  ))}
                </Stack>
              </SortableContext>
              <DragOverlay
                dropAnimation={{
                  sideEffects: defaultDropAnimationSideEffects({
                    styles: {
                      active: {
                        opacity: '0.4'
                      }
                    }
                  })
                }}
              >
                {activeId ? (
                  <SortableItem
                    id={activeId}
                    characters={charactersMap[activeId]}
                    isSeiyuu={isSeiyuu}
                    locale={lang}
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
            <HStack w="full" justifyItems="flex-end">
              <Button onClick={handleCancel} variant="subtle">
                {t('cancel')}
              </Button>
              <Button onClick={handleSave}>{t('save')}</Button>
            </HStack>
          </Stack>
          <Dialog.CloseTrigger asChild position="absolute" top="2" right="2">
            <IconButton aria-label="Close Dialog" variant="ghost" size="sm">
              <FaXmark />
            </IconButton>
          </Dialog.CloseTrigger>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
