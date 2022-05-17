/**
 * Star Points are the dots that appear at specific points on the game board, as a visual aid.
 * There is usually one in the center (tengen), and at least four in corners spaced out from there.
 * The spacing and number of star points depends on the board size.
 */

export interface StarPoints {
	boardSize: number,
	stars: number[][]
}

/**
 * Location of star points (dots), based on game-based grid starting value of 1.
 */
 export const boardStarPoints: StarPoints[] = [
	{
		boardSize: 9,
		stars: [[3,3], [3,7], [5,5], [7,7], [7,3]]
	},
	{
		boardSize: 13,
		stars: [[4,4], [4,7], [4,10], [7,4], [7,7], [7,10], [10,4], [10,7], [10,10]]
	},
	{
		boardSize: 19,
		stars: [[4,4], [4,10], [4,16], [10,4], [10,10], [10,16], [16,4], [16,10], [16,16]]
	},
];

/**
 * Whether point on the board is a "star point" (intersection has a dot).
 */
export const isStarPoint = (boardSize: number, gridX: number, gridY: number) => {
	let starPoints: StarPoints | undefined = boardStarPoints.find(point => point.boardSize === boardSize);
	if (starPoints === undefined){
		throw new Error(`StarPoints data is not defined for board size ${boardSize}x${boardSize}`);
	}
	starPoints.stars.forEach(point => {
		if (point[0] === gridX + 1 && point[1] === gridY + 1){
			return true;
		}
	});
	return false;
}