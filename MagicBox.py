import random

# Provides all the information and interactions required to simulate
# a game of "Shut the Box", with any configuration of dice and 
# numbers to flip down. 

class MagicBox:
	def __init__(self, dice_sides=6, num_dice=2, box_high_num=9):
		self.dice_sides = dice_sides
		self.num_dice = num_dice
		self.box_high_num = box_high_num
		self.current_box = [True for _ in range(self.box_high_num)]

	# CORE GAMEPLAY FUNCTIONS
	def reset(self):
		self.current_box = [True for _ in range(self.box_high_num)]

	def solved(self):
		return not any(self.current_box)

	# Get sum of rolling all dice
	def roll_dice(self):
		sum = 0
		for i in range(self.num_dice):
			sum += random.randint(1, self.dice_sides)
		return sum

	# Update game state with an action
	# 'moves' param is a list box values to flip down
	def move(self, moves):
		for a in moves:
			self.current_box[a-1] = False

	# Return a copy of the current box represented as a list of 
	# boolean switches
	def get_box(self):
		return list(self.current_box)

	# Return a list of the values of active box switches
	# Optionally provide a box for evaluation
	def get_active_numbers(self, box=None):
		numbers = []
		box = self.current_box if box is None else box

		for i, switch in enumerate(box):
			if switch:
				numbers.append(i+1)

		return numbers

	# Return a list of all possible dice roll outcomes. 
	def get_all_possible_rolls(self):
		return list(range(self.num_dice, self.num_dice*self.dice_sides + 1))

	# Return a list of all possible moves, each move is a list of 
	# values to flip down. 
	def get_actions(self, roll):
		numbers = [n for n in self.get_active_numbers() if n <= roll]
		actions = []

		self._get_actions(roll, numbers, actions)

		return actions if len(actions) > 0 else None

	# The same but from a provided hash of a box
	def get_actions_from_hash(self, box_hash, roll):
		box = self.get_box_from_hash(box_hash)
		numbers = [n for n in self.get_active_numbers(box) if n <= roll]
		actions = []

		self._get_actions(roll, numbers, actions)

		return actions if len(actions) > 0 else None

	# Recursively generate all possible actions given the 
	# state of the box and roll
	def _get_actions(self, roll, numbers, actions, path=None):
		if roll == 0 and path is not None:
			actions.append(tuple(path))
			return
		if len(numbers) == 0:
			return

		path = [] if path is None else path

		for i, num in enumerate(numbers):
			if num <= roll:
				new_path = list(path)
				new_path.append(num)
				new_roll = roll - num 
				# Use numbers[:i] so that we only consider completing the path
				# with lower numbers, which avoids duplicate paths.
				new_numbers = [n for n in numbers[:i] if n <= roll] 

				self._get_actions(new_roll, new_numbers, actions, new_path)


	# Print the box for a nice visualization. 
	def print_box(self):
		box_string = ''

		for i, switch in enumerate(self.current_box):
			if switch:
				box_string += '[{}]'.format(i+1)
			else:
				box_string += '[ ]'

		print('BOX:', box_string)


	# HASH FUNCTIONS
	# The following functions can be used to encode and decode the state
	# of a box or set of moves. These are used to simplify box states and
	# options in database queries and dictionary fields. 

	# They are all essentially encode/decode the box as binary. 

	def get_box_hash(self):
		hash_sum = 0 

		for i, switch in enumerate(self.current_box):
			if switch:
				hash_sum += 2**(i)

		return hash_sum

	def get_box_from_hash(self, box_hash):
		box = []

		for _ in range(self.box_high_num):
			if box_hash > 1:
				box.append(True if box_hash % 2 == 1 else False)
				box_hash = int(box_hash / 2)
			elif box_hash == 1:
				box.append(True)
				box_hash = 0
			else:
				box.append(False)

		return box

	def get_moves_hash(self, moves):
		hash_sum = 0 
		for m in moves:
			hash_sum += 2**m
		return hash_sum

	def get_moves_from_hash(self, moves_hash):
		moves = []

		for _ in range(self.box_high_num + 1):
			if moves_hash > 1:
				moves.append(True if moves_hash % 2 == 1 else False)
				moves_hash = int(moves_hash / 2)
			elif moves_hash == 1:
				moves.append(True)
				moves_hash = 0
			else:
				moves.append(False)
		return [i for i, v in enumerate(moves) if v]
		
	# Getters
	def get_dice_sides(self):
		return self.dice_sides
	def get_num_dice(self):
		return self.num_dice
	def get_box_high_num(self):
		return self.box_high_num




