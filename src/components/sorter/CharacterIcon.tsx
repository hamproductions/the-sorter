import { useEffect, useState } from 'react';
import { HTMLStyledProps } from 'styled-system/types';
import { styled } from 'styled-system/jsx';
import { Character } from '~/types';
import { getPicUrl } from '~/utils/assets';

export function CharacterIcon(props: HTMLStyledProps<'img'> & { character: Character }) {
  const { character, ...rest } = props;
  const [isError, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [character.id]);

  if (isError) return null;

  return (
    <styled.img
      src={getPicUrl(character.id, 'icons')}
      onError={() => {
        setError(true);
      }}
      {...rest}
    />
  );
}
