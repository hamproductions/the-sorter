import { useTranslation } from 'react-i18next';
import { FaXmark } from 'react-icons/fa6';
import type { DragEndEvent, DragStartEvent, UniqueIdentifier } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';
import * as Dialog from '../ui/dialog';
import { IconButton } from '../ui/icon-button';
import { SortableItem } from './SortableItem';
import { Stack } from 'styled-system/jsx';
import type { Character } from '~/types';
import { stateToCharacterList } from '~/utils/character';

export function EditResultsModal(
  props: Dialog.RootProps & {
    charactersData?: Character[];
    order: string[][];
    setOrder: (item: string[][]) => void;
    originalOrder: string[][];
    isSeiyuu: boolean;
  }
) {
  const { charactersData, order, setOrder, isSeiyuu, ...rest } = props;
  const [items, setItems] = useState<UniqueIdentifier[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const { t, i18n } = useTranslation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const lang = i18n.language;

  const characters = useMemo(() => {
    if (!order || !charactersData) return [];
    return stateToCharacterList(order, charactersData, isSeiyuu);
  }, [order, charactersData, isSeiyuu]);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;

    setActiveId(active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = over?.id ? items.indexOf(over.id) : undefined;

        return arrayMove(items, oldIndex, newIndex ?? items.length);
      });
    }

    setActiveId(null);
  }

  return (
    <Dialog.Root lazyMount unmountOnExit {...rest}>
      <Dialog.Backdrop />
      <Dialog.Positioner py="6" px="4">
        <Dialog.Content>
          <Stack>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={characters} strategy={verticalListSortingStrategy}>
                {items.map((item) => (
                  <SortableItem key={item} id={item} />
                ))}
              </SortableContext>
              <DragOverlay>{activeId ? activeId : null}</DragOverlay>
            </DndContext>
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
