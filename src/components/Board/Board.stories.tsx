import { Meta, StoryObj } from '@storybook/react';
import Board, { newBoardData, BoardProps } from './Board';

export default {
  component: Board,
  argTypes: {
    boardSize: {
      control: false
    },
    displayContents: { 
      control: 'radio', 
      options: ['Empty With Grid', 'Random Stones'],
    }
  },
  args: {
    displayContents: 'Empty With Grid',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  }
} as Meta<typeof Board>;

// Type that adds custom args for story controls.
interface BoardStoryProps extends BoardProps {
  displayContents: string
}

const Default: StoryObj<BoardStoryProps> = {
  render: ({boardData, displayContents, ...otherArgs}) => {
    const displayStones = (displayContents === 'Random Stones');
    return (
      <Board boardData={newBoardData(otherArgs.boardSize, displayStones)} {...otherArgs} />
    );
  },
  args: {
    turn: false
  }
};

export const Board7x7 = {
  ...Default,
  args: {
    boardSize: 7
  }
};
