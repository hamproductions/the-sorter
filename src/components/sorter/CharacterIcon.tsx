import { HTMLStyledProps } from 'styled-system/types';
import { styled } from 'styled-system/jsx';
import { Character } from '~/types';
import { getPicUrl } from '~/utils/assets';
import { useEffect, useState } from 'react';

export const CharacterIcon = (props: HTMLStyledProps<'img'> & { character: Character }) => {
  const { character, ...rest } = props;
  const [isError, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [character.id]);

  if (isError) return null;

  return (
    <styled.img
      src={getPicUrl(character.id, 'icons')}
      onLoad={() => {
        setError(false);
      }}
      onError={() => {
        setError(true);
      }}
      {...rest}
    />
  );
};
