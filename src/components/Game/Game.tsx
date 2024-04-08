import React, {useState, MouseEvent} from 'react';
import styles from './Game.module.css';
import Board, { newBoardData } from 'components/Board/Board';
import TurnIndicator from 'components/TurnIndicator/TurnIndicator';
import { StoneType } from 'components/Stone/Stone';
import { PointClickHandler } from 'components/Point/Point';
import { canPlaceStone } from 'services/gameLogic';
import { IPlayer, newPlayer } from 'services/player';

const AWSLambdaUrl = ""

/**
 * JSON returned from aws lambda backend
 */
interface Message {
  'Agent-Move'?: number;
  'Has-End'?: boolean;
  'Winner'?: number; // -1 for tie, 1 for player, 2 for ai-agent
}

/**
 * Phases / stages of gameplay.
 */
export enum GamePhase {
  ChooseBoard,
  ChooseOptions,
  PlayingGame,
  GameOver
}
/**
 * Main Game (App).
 */
function Game() {
  const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.ChooseBoard);
  const [turn, setTurn] = useState<boolean>(false);
  const boardSize = 7;

  const [boardData, setBoardData] = useState<StoneType[][]>(newBoardData(boardSize));
  const [players] = useState<IPlayer[]>(
    [
      newPlayer('You'),
      newPlayer('AI Agent')
    ]
  );
  const [winner, setWinner] = useState<String>("");
  /**
   * Start game with currently selected board size.
   */
  const startGame = () => {
    setBoardData(newBoardData(boardSize));
    setGamePhase(GamePhase.PlayingGame);
  };

  /**
   * Place or remove a stone; change the StoneType at a single point on the board.
   */
  const changeStone = (gridX: number, gridY: number, stone: StoneType) => {
    const newBoardData: StoneType[][] = [...boardData];
    newBoardData[gridX][gridY] = stone;
    setBoardData(newBoardData);
  }

  /**
   * Player clicked a point on the board; try to place a stone.
   */

  const handleClickPoint: PointClickHandler = (
    e: MouseEvent<HTMLButtonElement>,
    gridX: number,
    gridY: number
  ): void => {
    e.preventDefault();

    // Check if stone can be placed:
    if (gamePhase !== GamePhase.PlayingGame || e.currentTarget.disabled){
      return;
    }
    const currentPlayerStone = (!turn ? StoneType.Black : StoneType.White);
    if (!canPlaceStone(boardData, currentPlayerStone, gridX, gridY)){
      return;
    }

    // Place stone, and end current player's turn.
    changeStone(gridX, gridY, currentPlayerStone);
    setTurn(!turn);

    // After player's turn, immediately post a request to get AI-Agent's turn
    const results = getAIAgentMove();
    setTurn(turn);
  };

  const convertBoardToDict = (boardStatus: number[][]): { states: { [key: number]: number } } => {
    let states: { [key: number]: number } = {};
    boardStatus.forEach((row, gridX) => {
      row.forEach((stone, gridY) => {
        if (stone !== 0) {
          const key = (boardSize - gridY - 1) * boardSize + gridX;
          states[key] = stone;
        }
      });
    });
    return { states };
  }
  let responseData;
  const getAIAgentMove = async () => {
    // {"states": {1: 1, 2: 1, 3: 1, 4: 1, 8: 1, 9: 1, 18: 2, 22: 2, 23: 2, 24: 2, 25: 2, 26: 2}}
    const boardStatus: number[][] = boardData.map(row => row.map(stone => stone as number));
    const resultDict = convertBoardToDict(boardStatus);
    const postData = {
      "states": resultDict
    }
    try {
      const response = await fetch(AWSLambdaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(`Error! status: ${response.status}`);
      }
      const responseData = await response.json();
      handleMessage(responseData);
    } catch (error) {
      console.error('Failed to get AI agent move:', error);
    }
  }

  const handleMessage = (response: Message) => {
    if (typeof response['Agent-Move'] === 'number') {
      const gridX = (response['Agent-Move'] % boardSize);
      const gridY = boardSize - 1 - Math.floor(response['Agent-Move'] / boardSize);
      const currentPlayerStone = (turn ? StoneType.Black : StoneType.White);
      changeStone(gridX, gridY, currentPlayerStone);
    }
    if (response['Has-End']) {
      let winner: 'player' | 'ai-agent' | 'tie';
      switch (response['Winner']) {
        case 1:
          winner = 'player';
          break;
        case 2:
          winner = 'ai-agent';
          break;
        default:
          winner = 'tie';
      }
      setWinner(winner);
      setGamePhase(GamePhase.GameOver);
    }
  };

  /**
   * Render main game contents, based on current phase of game.
   */
  const renderGamePhase = (phase: GamePhase): React.ReactElement | null => {
    switch (phase) {

      case GamePhase.GameOver:
        return (
            <div className={styles.gameIntro}>
              <h1 className={styles.title}>
                <small>Game Over</small>
              </h1>
              <p className={styles.subtitle}>{winner ? `Winner: ${winner}` : "It's a tie!"}</p>
              <button className={styles.button} onClick={() => setGamePhase(GamePhase.ChooseBoard)}>Restart</button>
            </div>
        );

      case GamePhase.PlayingGame:
        return (
          <>
            <TurnIndicator turn={turn} players={players} />
            {winner !== '' && <p>Winner is {winner}!</p>}
            <Board
              boardSize={boardSize}
              boardData={boardData}
              handleClickPoint={handleClickPoint}
              turn={turn} />
          </>
        );

      case GamePhase.ChooseBoard:
      default:
        return (
          <>
            <header className={styles.gameIntro}>
              <h1 className={styles.title}>
                <small>The Game of</small> Wuziqi
              </h1>
            </header>

            <article className={styles.content}>
              <fieldset>
                <legend>Board Size</legend>
                    <div
                      className={styles.radioGridItemSelected}
                      key={boardSize}
                    >
                      <label htmlFor={`boardSize-${boardSize}`}>
                        <div className={styles.itemHeading}>
                          {boardSize}&nbsp;<span className={styles.by}><span aria-hidden="true">x</span><span className='screen-reader-text'>by</span></span>&nbsp;{boardSize}
                        </div>
                      </label>
                    </div>
              </fieldset>

              <p>
                <button type="button" className={styles.button} onClick={() => startGame()}>Start Game</button>
              </p>
            </article>
          </>
        );
    }
  };

  return (
    <main className={styles.game} data-testid="Game">
      {renderGamePhase(gamePhase)}
    </main>
  );
}

export default Game;
