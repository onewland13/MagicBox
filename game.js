/*****************************************************************************
 *																			 *
 *								   Welcome! 								 *
 *																			 *
 *		   My name is Oliver Newland and I made this little web game  		 *
 *	    to learn Django and sharpen my reinforcement learning and object     *
 * 	   oriented programming skills. The basic idea of the game is to roll    *
 *	  game is to roll the dice and remove the numbers that add up to your    *
 *      roll until there are none left. The game features advice from a      *
 *	   learning agent whose opinions are stored in a database. This advice   *
 * 		can be turned on and off, depending on how you want to play. The     *
 * 	   features a very low win rate, as the dice are rarely kind, but the    *
 *        RL agent wins about 10% of the time. See if you can beat it!       *
 *                 															 *
 * 						   Thanks for checking it out!						 * 
 *																			 *
 *****************************************************************************/

 /*		What you need to know to read this file:
  *
  *		What technologies are used? 
  * 
  *			This webapp features only pure JS and a graphics package called 
  *			p5.js. p5.js provides tons of nice functions for drawing on an 
  *			html canvas, and a 'game loop' that is called at 60fps, called 
  *			'draw()'. Documentation for p5.js can be found here: 
  * 		https://p5js.org/reference/
  *
  * 	Why is this file so long? Where do I start?
  * 
  * 		p5.js's main strength is that it dumps all its functions and useful 
  *  		variables in the global scope, so that any part of the program can 
  * 		access the information it needs and call the functions that are
  * 		relevant. This is great for building a game with dynamic objects 
  * 		that generally manage themselves, and doing so quickly, but it means
  * 		that p5.js does not support splitting an application into multiple 
  * 		files. 
  * 
  * 		I have organized the code and commented extensively so that you, 
  * 		the reader, can get a grasp on the whole project quickly. 
  *
  * 	Let me give you a brief overview now: 
  * 
  * 		1. After some global constants, we have a section of code that manages
  * 		the html canvas and helps us draw objects to a consistent scale. It
  * 		initializes p5.js's connection to the DOM object in 'setup()', which 
  * 		is the first function called at the beginning of any p5.js project. 
  * 		It manages the size of the canvas any time the window is resized, and
  * 		provides two functions 'v_r()' and 'r_v()', that map our virtual
  * 		coordinate system to the unique real size of your window. 
  *
  *			2. Next we have a section that initializes our game objects. These are
  * 		individual blocks, buttons, dice, and text messages that interact 
  * 		to play our game. They are all stored in a global state variable 
  * 		named 'gs'. Alongside them is a parameter called 'gs.stage', which 
  * 		keeps track of where we are in an episode of the game, so that our
  * 		game loop can more easily direct the traffic of function calls. 
  *
  * 		3. Then we have our core game loop, p5.js's 'draw()' function. This 
  * 		function is called 60 times a second, and everytime it is called,
  * 		it calls the 'update()' function, which examines the current game
  * 		state, and updates objects and 'gs' accordingly. Once the update
  * 		is complete, 'draw()' simply draws each object using the objects' 
  * 		individual 'draw()' functions. There are also event listeners, 
  * 		that change the state of the game and various objects appropriately
  * 		when the mouse is clicked or a key is typed. 
  *
  * 		4. There is a section of helper functions that compile useful
  * 		information, like 'get_dice_roll()', abstract away loops and state 
  *			checks, like 'check_if_lost()', and transform data, like 'hash_blocks()'. 
  * 
  * 		5. Finally, rather than storing our object classes in modules like
  * 		we usually would, we bow to p5.js's demands and include them all 
  * 		at the bottom of the file. The classes {Block, Dice, AiTab, Button,
  *			ProgressText} all inherit from a class called 'GameObject', which 
  * 		stores information every gui fixture needs and provides a function 
  * 		for checking if an object was clicked on. 
  * 
  * 		The objects all have 'mode' parameters that keep track of their 
  * 		individual state. Most functions involve getting, setting, and toggling
  * 		these modes, which is how the game loop interacts with these objects. 
  * 		Their 'draw()' methods manage object animation and the specifics of 
  * 		adding each object to the canvas. 
  * 
  * 	And that's about all there is to it. Enjoy!
  */

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 400;
const CANVAS_RATIO = Math.floor(DEFAULT_WIDTH / DEFAULT_HEIGHT);
const NUM_BLOCKS = 9;
const NUM_DICE = 2;
const NUM_DICE_SIDES = 6;

const BLOCK_ROW_Y = 30; 
const DICE_ROW_Y = 220;
const AI_TAB_ROW_Y = 175;
const RESULT_TEXT_Y = 350;

const PROGRESS_BUTTON_X = 540;
const PROGRESS_BUTTON_Y = 215;
const SHOW_AI_BUTTON_X = 30;
const SHOW_AI_BUTTON_Y = 215;

const KEY_CODES = {
	ONE: 49,
	NINE: 57,
	SPACE: 32,
	RETURN: 13,
	R: 82
}

const GAME_STAGE = {
	START: 'start',
	ROLLING: 'rolling', 
	ROLLED: 'rolled',
	BASE: 'base',
	WON: 'won',
	LOST: 'lost'
}

/**************** CANVAS AND SCALE MANAGEMENT *****************/

// setup() is called once by p5.js as soon as the webpage loads.
// 
// Create and manage canvas size, we want the game screen to fit 
// our user's window exactly. 
function setup() {
	let myCanvas;

	if (window.innerWidth < 300 || window.innerHeight < 150) { // minimum size
		myCanvas = createCanvas(300, 150);
	} else if (window.innerWidth > CANVAS_RATIO * window.innerHeight) { // fit to window vertically
		myCanvas = createCanvas(CANVAS_RATIO * window.innerHeight, window.innerHeight);
	} else { // fit to window horizontally
		myCanvas = createCanvas(window.innerWidth, window.innerWidth / CANVAS_RATIO);
	}

	myCanvas.parent('gameScreen');
}

// Maintain our chosen ratio for game screen on window resizing
function windowResized() {
	if (window.innerWidth < 300 || window.innerHeight < 150) {
		resizeCanvas(300, 150);
	} else if (window.innerWidth > CANVAS_RATIO * window.innerHeight) { 
		resizeCanvas(CANVAS_RATIO * window.innerHeight, window.innerHeight);
	} else {
		resizeCanvas(window.innerWidth, window.innerWidth / CANVAS_RATIO);
	}
}

// Scale virtual coordinate to real coordinate. Use when feeding
// game state values into draw functions.
function v_r(val) { return Math.floor(val * width / DEFAULT_WIDTH); }

// Scale real coordinate to virtual coordinate. Use when getting 
// a value from the dom, like a click location, and comparing
// to game state values. 
function r_v(val) { return Math.floor(val * DEFAULT_WIDTH / width); }




/********************** GAME INITIATION ************************/

// Init the global game state that keeps track of all the objects 
// that render each frame and a 'stage' parameter that helps
// direct game flow. 

// Set as null, then initiate at the end of the file so that 
// our classes are declared. 
let gs = null; 

function init_game_state() {
	let game_state = {
		blocks: init_blocks(NUM_BLOCKS),
		dice: init_dice(NUM_DICE, NUM_DICE_SIDES),
		ai_tabs: init_ai_tabs(NUM_BLOCKS),
		progress_button: new ProgressButton(PROGRESS_BUTTON_X, PROGRESS_BUTTON_Y),
		show_ai_button: new ShowAiButton(SHOW_AI_BUTTON_X, SHOW_AI_BUTTON_Y),
		result_text: new ResultText(DEFAULT_WIDTH / 2, RESULT_TEXT_Y),
		stage: GAME_STAGE.START
	}	
	return game_state;
}

function init_blocks(num_blocks) {
	let blocks = new Array();

	for (let i = 0; i < num_blocks; i++) {
		// Evenly space blocks out across the screen
		let x = (((DEFAULT_WIDTH - (Block.WIDTH * num_blocks)) / (num_blocks + 1)) * (i + 1)) + (Block.WIDTH * i);
		let y = BLOCK_ROW_Y;
		let b = new Block(i + 1, x, y);
		blocks.push(b);
	}
	return blocks; 
}

function init_ai_tabs(num_blocks) {
	let tabs = new Array();

	for (let i = 0; i < num_blocks; i++) {
		// Evenly space the ai tabs out across the screen
		let x = (((DEFAULT_WIDTH - (AiTab.WIDTH * num_blocks)) / (num_blocks + 1)) * (i + 1)) + (AiTab.WIDTH * i);
		let y = AI_TAB_ROW_Y;
		let b = new AiTab(x, y);
		tabs.push(b);
	}
	return tabs; 
}

function init_dice(num_dice, num_dice_sides) {
	let dice = new Array();

	for (let i = 0; i < num_dice; i++) {
		// Space our dice from the center of the screen
		let x = (DEFAULT_WIDTH / 2 - (num_dice * Dice.WIDTH + (num_dice - 1) * Dice.WIDTH / 2) / 2 + i * Dice.WIDTH * 3 / 2);
		let y = DICE_ROW_Y; 
		let d = new Dice(x, y, num_dice_sides);
		dice.push(d);
	}

	return dice; 
}

/********************** CORE GAME LOOP ************************/

// draw() is called at 60fps by p5.js, it is the starting point
// of every game loop. 
function draw() {
	// Do nothing until game objects are instantiated. 
	if (gs == null) { return; }

	update(); 
	clear();

	for (let i = 0; i < gs.blocks.length; i++) {
		gs.blocks[i].draw();
		gs.ai_tabs[i].draw(); 
	}

	for (let i = 0; i < gs.dice.length; i++) {
		gs.dice[i].draw();
	}

	gs.progress_button.draw();
	gs.show_ai_button.draw();
	gs.result_text.draw(); 
}

// There are several places where the state of the game 
// and objects changes. Mouse/keyboard events, the passage 
// of time, and our database call all exist outside of this 
// update() function. 

// Rather, update() examines the games current state and reacts
// accordingly. This includes resetting objects when the game is
// sent back to the start, progressing the game when the dice 
// finish rolling, checking to see if the player has won or lost,
// and displaying the 'You won/lost' message. 
function update() {
	switch (gs.stage) {
		// NEW GAME
		case GAME_STAGE.START:
			gs.result_text.to_playing(); 
			for (let i = 0; i < gs.blocks.length; i++) {
				gs.blocks[i].reset(); 
			}
			gs.stage = GAME_STAGE.BASE; 
			// Fall through to rest of setup...

		// MIDGAME: BASE -> ROLLING -> ROLLED -> BASE
		case GAME_STAGE.BASE:
			if (check_if_won(gs.blocks)) {
				gs.stage = GAME_STAGE.WON;
			}

			for (let i = 0; i < gs.dice.length; i++) {
				gs.dice[i].reset(); 
			}
			for (let i = 0; i < gs.ai_tabs.length; i++) {
				gs.ai_tabs[i].reset(); 
			}
			gs.progress_button.to_roll();
			break; 

		case GAME_STAGE.ROLLING:
			if (! check_if_dice_rolling(gs.dice)) {
				gs.stage = GAME_STAGE.ROLLED;
			}
			break; 

		case GAME_STAGE.ROLLED:
			// Reveal AI suggestions
			for (let i = 0; i < gs.ai_tabs.length; i++) {
				gs.ai_tabs[i].to_populated();
			}

			if (check_if_lost(gs.blocks, get_dice_roll(gs.dice))) {
				gs.stage = GAME_STAGE.LOST;
			}
			gs.progress_button.to_enter(); 
			break; 

		// ENDGAME
		case GAME_STAGE.WON:
			gs.result_text.to_won();
			gs.progress_button.to_reset();
			break; 

		case GAME_STAGE.LOST:
			gs.result_text.to_lost();
			gs.progress_button.to_reset();
			break; 
	}
}

// keyTyped() listens for key presses and launches game events 
// accordingly. This is a method provided by p5.js. 
function keyTyped() {
	if (keyCode == KEY_CODES.SPACE || keyCode == KEY_CODES.RETURN) {
		progress_button_click();
	} 

	if (keyCode >= KEY_CODES.ONE && keyCode <= KEY_CODES.NINE) {
		gs.blocks[keyCode - KEY_CODES.ONE].toggle_selected(); 
	}

	if (keyCode == KEY_CODES.R) {
		for (let i = 0; i < gs.ai_tabs.length; i++) {
			gs.ai_tabs[i].toggle_visible(); 
		}
		gs.show_ai_button.toggle_value();
	}
}

// mouseClicked() listens for mouse clicks and launches game events 
// accordingly. This is a method provided by p5.js. 
function mouseClicked() { 
	// Map DOM coordinates to our virtual coordinate system. 
	let _mouseX = r_v(mouseX);
	let _mouseY = r_v(mouseY);

	for (let i = 0; i < gs.blocks.length; i++) {
		if (gs.blocks[i].overlap(_mouseX, _mouseY)) {
			gs.blocks[i].toggle_selected();
		}
	}

	if (gs.progress_button.overlap(_mouseX, _mouseY)) {
		progress_button_click();
	}

	if (gs.show_ai_button.overlap(_mouseX, _mouseY)) {
		for (let i = 0; i < gs.ai_tabs.length; i++) {
			gs.ai_tabs[i].toggle_visible(); 
		}
		gs.show_ai_button.toggle_value(); 
	}
}

// The game is driven forward by the progress button, used to
// roll the dice, confirm your block selection, and reset the 
// game upon a win or loss. 

// progress_button_click() maps the state of the progress button
// to the actions it must take to progress the game. 
function progress_button_click() {
	// Roll each of the dice, update our stage in the game, and 
	// make a call to our server API to update our AI recommendation.
	if (gs.progress_button.is_roll()) {
		for (let i = 0; i < gs.dice.length; i++) {
			gs.dice[i].start_roll(); 
		}
		gs.stage = GAME_STAGE.ROLLING; 

		// Note that although the dice rolling animation is shown for a few
		// seconds, the eventual value is set when the roll begins and is 
		// accessible by 'get_dice_roll()'. The spinning and the changing of 
		// the dice faces is purely for show, and hides any latency on 
		// the API call. 
		fetch(`https://magicboxgame.herokuapp.com/ai/?box_hash=${hash_blocks(gs.blocks)}&roll=${get_dice_roll(gs.dice)}`)
			.then((response) => { 
				return response.json(); 
			})
			.then((myJson) => {
				load_ai_tabs(gs.ai_tabs, unhash_moves(myJson.moves_hash));
			});

	// If clicking the button to confirm a move, first check that the sum of
	// the selected blocks equals the roll. If we have a valid move, retire
	// those blocks, and update our stage in the game. Otherwise, do nothing. 
	} else if (gs.progress_button.is_enter()) {
		if (check_if_valid_move(gs.blocks, get_dice_roll(gs.dice))) {
			retire_selected(gs.blocks); 
			gs.stage = GAME_STAGE.BASE;
		}

	// If we win or lose, we will have to reset the game back to the 
	// beginning. 
	} else if (gs.progress_button.is_reset()) {
		gs.stage = GAME_STAGE.START;
	}
}

/******************** HELPER FUNCTIONS **********************/

function check_if_won(blocks) {
	for (let i = 0; i < blocks.length; i++) {
		if (! blocks[i].is_retired()) {
			return false; 
		}
	}
	return true; 
}

function check_if_dice_rolling(dice) {
	for (let i = 0; i < dice.length; i++) {
		if (dice[i].is_rolling()) {
			return true;
		}
	}
	return false; 
}

function check_if_valid_move(blocks, roll) {
	let selected_sum = 0; 
	for (let i = 0; i < blocks.length; i++) {
		if (blocks[i].is_selected()) {
			selected_sum += blocks[i].get_value();
		}
	}
	return (roll == selected_sum); 
}

// check_if_lost() takes a list of blocks and a roll and generates
// all possible moves to determine whether the player has run out of
// options or not. 
function check_if_lost(blocks, roll) {
	let values = [];
	for (let i = 0; i < blocks.length; i++) {
		if (! blocks[i].is_retired() && blocks[i].get_value() <= roll) {
			values.push(blocks[i].get_value());
		}
	}

	let actions = [];

	const action_combos = (remaining_sum, index=0, path=[]) => {
		if (remaining_sum < 0) {
			return;
		} else if (remaining_sum == 0) {
			actions.push(path.slice());
			return;
		} 

		for (let i = index; i < values.length; i++) {
			if (path.length > 0 && values[i] == path[path.length - 1]) continue;
			path.push(values[i]);
			action_combos(remaining_sum - values[i], index + 1, path.slice());
			path.pop(); 
		}
	}

	action_combos(roll);

	return (actions.length == 0);
}

// load_ai_tabs takes in a list of ai_tabs and a list of move
// recommendations (block values).
// 
// Each tab is turned to 'unpopulated' and then given a value, so 
// that if the database call returns before the end of the 
// animation, we do not spoil the eventual roll. Once the game 
// enters the 'ROLLED' stage, these tabs will be turned back on and
// will display the value recieved here. 
function load_ai_tabs(ai_tabs, moves) {
	for (let i = 0; i < ai_tabs.length; i++) {
		ai_tabs[i].reset(); 
	}

	for (let i = 0; i < moves.length; i++) {
		ai_tabs[moves[i] - 1].set_value(true); 
	}
}

function get_dice_roll(dice) {
	roll_sum = 0;
	for (let i = 0; i < dice.length; i++) {
		if (dice[i].get_value() != null) {
			roll_sum += dice[i].get_value(); 
		}
	}
	return roll_sum;
}

function retire_selected(blocks) {
	for (let i = 0; i < blocks.length; i++) {
		if (blocks[i].is_selected()) {
			blocks[i].to_retired();
		}
	}
}

// hash_blocks() takes a list of blocks and turns them into an 
// integer that can then be sent to the database. It essentially
// treats retired and not-retired as 0s and 1s, in order, and 
// treats that as a binary encoding of an integer. 
function hash_blocks(blocks) {
	hash_sum = 0;
	for (let i = 0; i < blocks.length; i++) {
		if (! blocks[i].is_retired()) {
			hash_sum += Math.pow(2, i);
		}
	}
	return hash_sum;
}

// unhash_moves() takes in an integer and turns its
// binary encoding into indices of blocks that the AI 
// recommends moving. 
function unhash_moves(hash_sum) {
	let moves = [];
	for (let i = 0; i < NUM_BLOCKS + 1; i++) {
		if (hash_sum > 1) {
			if (hash_sum % 2 == 1) {
				moves.push(i);
			}
			hash_sum = int(hash_sum / 2)
		} else if (hash_sum == 1) {
			moves.push(i);
			hash_sum = 0;
		}
	}
	return moves;
}

/*********************** CLASSES **************************/

/* p5.js, the graphics library used to create this game, does 
 * not play nicely with modules. It's ease of use relies on 
 * maintaining useful functions and variables in the global 
 * scope, so any work-around that allows us to split our game
 * into multiple files requires that we abandon p5.js's main 
 * feature. Instead, all classes are included below.
 */


// GameObject provides a base class for any game object. 
// It takes in physical descriptors, a value, and provides
// a method for checking whether a pair of coordinates 
// overlaps with the object. 
class GameObject {
	constructor(value, x, y, width, height, 
				corner_diam, stroke_width, text_size, 
				fill_color, stroke_color, text_color) {
		this.value = value;

		this.x = x;
		this.y = y;
		this.width = width; 
		this.height = height;
		this.corner_diam = corner_diam;
		this.stroke_width = stroke_width;
		this.text_size = text_size;

		this.fill_color = fill_color;
		this.stroke_color = stroke_color;
		this.text_color = text_color;
	}

	overlap(x, y) {
		return (x >= this.x && x <= this.x + this.width &&
				y >= this.y && y <= this.y + this.height)
	}
}

// Blocks are the game pieces that we are trying to eliminate with
// each roll. They can exist in three different states, their base state
// in which they just sit in line, selected in which they are animated
// downward (sliding in a groove on the board, so to speak), and retired,
// in which they are blacked out and unmoveable until the game is reset. 
class Block extends GameObject {
	static WIDTH = 70;
	static HEIGHT = 100;
	static CORNER_DIAM = 10;
	static STROKE_WIDTH = 8;
	static TEXT_STROKE_WIDTH = 3;
	static TEXT_SIZE = 50;
	static Y_SPEED = 2;
		
	static Y_RANGE = {
		base: 0,
		selected: 30,
		retired: 30
	};

	static FILL_COLOR = {
		base: "#FFFFFF",
		selected: "#FFFFFF",
		retired: "#222222"
	};
	static STROKE_COLOR = {
		base: "#004225",
		selected: "#004225",
		retired: "#111111"
	};
	static TEXT_COLOR = {
		base: "#004225",
		selected: "#004225",
		retired: "#111111"
	};
	static BACKGROUND_COLOR = "#AAA880";

	static MODE = {			
		BASE: 'base',
		SELECTED: 'selected',
		RETIRED: 'retired'
	};

	constructor(value, x, y) {
		super(value, x, y, Block.WIDTH, Block.HEIGHT,
			  Block.CORNER_DIAM, Block.STROKE_WIDTH, Block.TEXT_SIZE, 
			  Block.FILL_COLOR, Block.STROKE_COLOR, Block.TEXT_COLOR);
		
		this.mode = Block.MODE.BASE;

		this.background_color = Block.BACKGROUND_COLOR; 
		this.text_stroke_width = Block.TEXT_STROKE_WIDTH;
		this.y_offset = 0; 
		this.y_range = Block.Y_RANGE;
		this.y_speed = Block.Y_SPEED;
	}

	toggle_selected() { 
		switch(this.mode) {
			case Block.MODE.BASE:
				this.mode = Block.MODE.SELECTED;
				break;
			case Block.MODE.SELECTED:
				this.mode = Block.MODE.BASE;
				break;
		}
	}

	to_retired() {
		this.mode = Block.MODE.RETIRED;
	}

	is_retired() {
		return this.mode == Block.MODE.RETIRED;
	}

	is_selected() {
		return this.mode == Block.MODE.SELECTED;
	}

	reset() {
		this.mode = Block.MODE.BASE;
	}

	// The base and selected/retired modes are differentiated
	// visually by their position on the board. If a mode has been
	// set and the block is not aligned properly, move it towards 
	// alignment one step. 
	animate() {
		switch(this.mode) {
			case Block.MODE.SELECTED:
			case Block.MODE.RETIRED:
				if (this.y_offset < this.y_range[this.mode]) {
					this.y_offset = Math.min(this.y_offset + this.y_speed, this.y_offset + this.y_range[this.mode]);
				}
				break;
			case Block.MODE.BASE:
				if (this.y_offset > this.y_range[this.mode]) {
					this.y_offset = Math.max(this.y_offset - this.y_speed, this.y_range[this.mode]);
				}
				break;
		}
	}

	// We override the GameObject.overlap() here because this.x and this.y
	// refer to our base coordinates, but a selected block will have an offset.
	overlap(x, y) {
		return (x >= this.x && x <= this.x + this.width &&
				y >= this.y + this.y_offset && y <= this.y + this.y_offset + this.height)
	}

	draw() {
		this.animate();
		// Shapes
		strokeWeight(v_r(this.stroke_width));

		// Background
		fill(this.background_color);
		stroke(this.background_color); 
		rect(v_r(this.x), v_r(this.y), v_r(this.width), v_r(this.height + this.y_range.selected), v_r(this.corner_diam));

		// Block
		fill(this.fill_color[this.mode]);
		stroke(this.stroke_color[this.mode]);
		rect(v_r(this.x), v_r(this.y + this.y_offset), v_r(this.width), v_r(this.height), v_r(this.corner_diam));

		// Text
		fill(this.text_color[this.mode]);
		strokeWeight(v_r(this.text_stroke_width));
		textSize(v_r(this.text_size));
		textAlign(CENTER);
		text(String(this.value), v_r(this.x + this.width / 2), v_r(this.y + this.y_offset + this.height * 2 / 3));
	}

	get_value() {
		return this.value; 
	}
}

// The Dice class represents a single die, which can either be rolling
// or rolled. If rolling, the dice spins for a specified number of rolls, 
// after which the mode is set back to rolled. 
// A roll's eventual value is generated at the beginning of the roll, but 
// during the roll it's display_value changes randomly. 
class Dice extends GameObject {
	static MODE = {
		ROLLING: 'rolling',
		ROLLED: 'rolled'
	};

	static WIDTH = 70; 
	static CORNER_DIAM = 6;

	static FILL_COLOR = "#FFFFFF";
	static PIP_COLOR = "#000000";
	static STROKE_COLOR = "#000000";
	static STROKE_WIDTH = 5;

	static SPEED = 24;
	static ROLL_SPIN = 4 * 360; 

	// These are used to determine where to draw each pip for a certain
	// die face value. 
	static PIP_SPACING = Dice.WIDTH / 4;
	static PIP_DIAM = Dice.WIDTH / 6;
	static PIP_MAP = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8], [0, 1, 2, 6, 7, 8], 
					  [0, 1, 2, 4, 6, 7, 8], [0, 1, 2, 3, 5, 6, 7, 8], [0, 1, 2, 3, 4, 5, 6, 7, 8]];
	static PIP_OFFSETS = [[-1, -1], [0, -1], [1, -1],
					  	  [-1,  0], [0,  0], [1,  0],
					  	  [-1,  1], [0,  1], [1,  1]];

	constructor(x, y, num_dice_sides) {
		super(null, x, y, Dice.WIDTH, Dice.WIDTH,
			  Dice.CORNER_DIAM, Dice.STROKE_WIDTH, null, 
			  Dice.FILL_COLOR, Dice.STROKE_COLOR, null);

		this.mode = Dice.MODE.ROLLED;
		this.max_value = num_dice_sides;

		this.angle = 0;

		this.value = this.generate_value(); 
		this.display_value = this.value; 
	}

	reset() {
		this.mode = Dice.MODE.ROLLED;
	}

	generate_value() {
		return Math.floor(Math.random() * this.max_value + 1);
	}

	get_value() {
		return this.value; 
	}

	start_roll() {
		if (this.mode == Dice.MODE.ROLLED) {
			this.value = this.generate_value()
			this.mode = Dice.MODE.ROLLING;
			return this.value;
		} else {
			return 0; 
		}
	}

	animate() {
		switch(this.mode) {
			case Dice.MODE.ROLLING:
				this.angle = Math.min(Dice.ROLL_SPIN, this.angle + Dice.SPEED);
				if (this.angle >= Dice.ROLL_SPIN) {
					this.mode = Dice.MODE.ROLLED;
				} else {
					this.display_value = this.generate_value(); 
				}
				break;
			case Dice.MODE.ROLLED:
				this.display_value = this.value;
				this.angle = 0; 
				break;
		}
	}

	draw() {
		this.animate(); 

		rectMode(CENTER);

		// Dice
		strokeWeight(v_r(this.stroke_width));
		fill(this.fill_color);
		stroke(this.stroke_color); 

		translate(v_r(this.x + this.width / 2), v_r(this.y + this.height / 2));
		rotate(radians(this.angle));
		rect(0, 0, v_r(this.width), v_r(this.height), v_r(this.corner_diam));

		// Draw pips
		for (let i = 0; i < Dice.PIP_MAP[this.display_value].length; i++) {
			ellipseMode(CENTER);
			fill(Dice.PIP_COLOR);
			circle(v_r(Dice.PIP_OFFSETS[Dice.PIP_MAP[this.display_value][i]][0] * Dice.PIP_SPACING),
				   v_r(Dice.PIP_OFFSETS[Dice.PIP_MAP[this.display_value][i]][1] * Dice.PIP_SPACING),
				   v_r(Dice.PIP_DIAM));
		}

		// Reset translation
		rectMode(CORNER);
		resetMatrix(); 
	}

	get_mode() {
		return this.mode;
	}

	is_rolling() {
		return this.mode == Dice.MODE.ROLLING; 
	}
}

// The Button class provides everything needed to display and click 
// a button. It gives visual feedback when the user mouses over or clicks 
// the button. To change the text of a button, or give it more specific
// methods, subclasses must be used (see next classes!). 
class Button extends GameObject {
	static WIDTH = 230; 
	static HEIGHT = 120;
	static CORNER_DIAM = 10;
	static STROKE_WIDTH = 8;
	static TEXT_STROKE_WIDTH = 3; 
	static TEXT_SIZE = 45;
	
	static FILL_COLOR = {
		base: '#FFFFFF',
		mouse_over: '#DFC6DF',
		clicked: '#EDB0EB'
	};
	static STROKE_COLOR = "#004225"; 
	static TEXT_COLOR = "#004225";
	
	static MOUSE_MODE = {
		BASE: 'base',
		MOUSE_OVER: 'mouse_over',
		CLICKED: 'clicked'
	};

	constructor(value, x, y) {
		super(value, x, y, Button.WIDTH, Button.HEIGHT, 
			  Button.CORNER_DIAM, Button.STROKE_WIDTH, Button.TEXT_SIZE, 
			  Button.FILL_COLOR, Button.STROKE_COLOR, Button.TEXT_COLOR);

		this.mouse_mode = Button.MOUSE_MODE.BASE;
		this.text_stroke_width = Button.TEXT_STROKE_WIDTH;
	}

	animate() {
		// mouseX and mouseY are constantly updating coordinate values provided
		// by p5.js. 
		if (mouseIsPressed && this.overlap(r_v(mouseX), r_v(mouseY))) {
			this.mouse_mode = Button.MOUSE_MODE.CLICKED;
		} else if (this.overlap(r_v(mouseX), r_v(mouseY))) {
			this.mouse_mode = Button.MOUSE_MODE.MOUSE_OVER;
		} else {
			this.mouse_mode = Button.MOUSE_MODE.BASE;
		}
	}

	draw() {
		this.animate(); 
		// Button
		fill(this.fill_color[this.mouse_mode]);
		strokeWeight(v_r(this.stroke_width));
		stroke(this.stroke_color);
		rect(v_r(this.x), v_r(this.y), v_r(this.width), v_r(this.height), v_r(this.corner_diam));

		// Button text
		fill(this.text_color);
		strokeWeight(v_r(this.text_stroke_width));
		textSize(v_r(this.text_size));
		textAlign(CENTER);
		text(String(this.value).toUpperCase(), v_r(this.x + this.width / 2), v_r(this.y + this.height * 0.63));
	}
}

class ShowAiButton extends Button {
	static VALUE = {
		SHOW_AI: 'show ai',
		HIDE_AI: 'hide ai'
	};

	constructor(x, y) {
		super(ShowAiButton.VALUE.HIDE_AI, x, y);
	}

	toggle_value() {
		switch(this.value) {
			case ShowAiButton.VALUE.SHOW_AI:
				this.value = ShowAiButton.VALUE.HIDE_AI; 
				break; 
			case ShowAiButton.VALUE.HIDE_AI:
				this.value = ShowAiButton.VALUE.SHOW_AI; 
		}
	}
}

class ProgressButton extends Button {
	static VALUE = {
		ROLL: 'roll',
		ENTER: 'enter',
		RESET: 'reset'
	};

	constructor(x, y) {
		super(ProgressButton.VALUE.ROLL, x, y);
	}

	to_roll() {
		this.value = ProgressButton.VALUE.ROLL;
	}

	is_roll() {
		return this.value == ProgressButton.VALUE.ROLL;
	}

	to_enter() {
		this.value = ProgressButton.VALUE.ENTER;
	}

	is_enter() {
		return this.value == ProgressButton.VALUE.ENTER;
	}

	to_reset() {
		this.value = ProgressButton.VALUE.RESET;
	}

	is_reset() {
		return this.value == ProgressButton.VALUE.RESET;
	}
}

// The AiTab class is essentially a little light bulb that 
// we can affix to our game board. It can light up with a 
// positive color, a negative color, or a neutral color. 
// It can also be made invisible. 

// To determine the correct draw, we use display_mode, value_mode,
// and the value itself. If display_mode is 'invisible', we draw nothing. 
// If 'visible', we proceed to value_mode, which whether we 
// should reveal our value or display a neutral color instead. 
// Finally, value itself indicates a positive or negative light. 

// These 3 concurrent states allow us to set a value, mess around
// with display options without removing said value, and remember 
// our display settings across display_mode and value_mode toggles. 
class AiTab extends GameObject {
	static DISPLAY_MODE = {
		INVISIBLE: 'invisible',
		VISIBLE: 'visible'
	};

	static VALUE_MODE = {
		POPULATED: 'populated',
		UNPOPULATED: 'unpopulated'
	};

	static WIDTH = 70;
	static HEIGHT = 10;
	static CORNER_DIAM = 5;
	static STROKE_WIDTH = 3;
	static FILL_COLOR = {
		populated: {
			false: "#CC0000", 
			true: "#00CC00"
		},
		unpopulated: "#BBBBBB"
	};
	static STROKE_COLOR = "#000000";

	constructor(x, y) {
		super(false, x, y, AiTab.WIDTH, AiTab.HEIGHT,
			  AiTab.CORNER_DIAM, AiTab.STROKE_WIDTH, null, 
			  AiTab.FILL_COLOR, AiTab.STROKE_COLOR, null);

		this.display_mode = AiTab.DISPLAY_MODE.VISIBLE;
		this.value_mode = AiTab.VALUE_MODE.UNPOPULATED;
	}

	reset() {
		this.value_mode = AiTab.VALUE_MODE.UNPOPULATED;
		this.value = false; 
	}

	to_unpopulated() {
		this.value_mode = AiTab.VALUE_MODE.UNPOPULATED;
	}

	to_populated() {
		this.value_mode = AiTab.VALUE_MODE.POPULATED;
	}

	toggle_visible() {
		if (this.display_mode == AiTab.DISPLAY_MODE.INVISIBLE) {
			this.display_mode = AiTab.DISPLAY_MODE.VISIBLE;
		} else {
			this.display_mode = AiTab.DISPLAY_MODE.INVISIBLE;
		}
	}

	set_value(v) {
		this.value = v;
	}

	draw() {
		if (this.display_mode == AiTab.DISPLAY_MODE.INVISIBLE) {
			return;
		}

		// Scope of switch cases does not play nicely with fill(), so we set
		// the parameter and use it later. 
		let current_fill_color; 
		switch(this.value_mode) {
			case AiTab.VALUE_MODE.POPULATED:
				current_fill_color = this.fill_color[AiTab.VALUE_MODE.POPULATED][this.value];
				break;
			case AiTab.VALUE_MODE.UNPOPULATED:
				current_fill_color = this.fill_color[AiTab.VALUE_MODE.UNPOPULATED];
				break;
		}

		fill(current_fill_color);
		strokeWeight(v_r(this.stroke_width));
		stroke(this.stroke_color);
		rect(v_r(this.x), v_r(this.y), v_r(this.width), v_r(this.height), v_r(this.corner_diam));		
	}
}

// The ResultText class displays text that indicates whether 
// the player has won, lost, or is still playing (in which case,
// it displays no text). 
class ResultText extends GameObject {
	static MODE = {
		WON: 'won',
		LOST: 'lost',
		PLAYING: 'playing'
	};

	static VALUE = {
		won: 'You won!',
		lost: 'You lost! Try again!',
		playing: ''
	};

	static TEXT_SIZE = 20; 
	static STROKE_WIDTH = 0; 
	static STROKE_COLOR = "#000000";
	static TEXT_COLOR = {
		won: '#00BB00',
		lost: '#BB0000',
		playing: '#FFFFFF'
	};

	constructor(x, y) {
		super(ResultText.VALUE[ResultText.MODE.PLAYING], x, y, null, null,
			  null, ResultText.STROKE_WIDTH, ResultText.TEXT_SIZE, 
			  null, ResultText.STROKE_COLOR, ResultText.TEXT_COLOR);

		this.mode = ResultText.MODE.PLAYING; 
	}

	to_lost() {
		this.mode = ResultText.MODE.LOST;
		this.value = ResultText.VALUE[this.mode];
	}

	to_won() {
		this.mode = ResultText.MODE.WON;
	}

	to_playing() {
		this.mode = ResultText.MODE.PLAYING;
	}

	draw() {
		this.value = ResultText.VALUE[this.mode];

		fill(this.text_color[this.mode]);
		stroke(this.stroke_color);
		strokeWeight(v_r(this.stroke_width));
		textSize(v_r(this.text_size));
		textAlign(CENTER);
		text(String(this.value).toUpperCase(), v_r(this.x), v_r(this.y));
	}

}

gs = init_game_state();
