import random
import json

# SARSA learning agent that learns how to maximize win rate for 
# "MagicBox" otherwise known as "Shut the Box". 

class MagicBoxAgent:
	def __init__(self, box):
		self.dice_sides = box.get_dice_sides()
		self.num_dice = box.get_num_dice()
		self.box_high_num = box.get_box_high_num()
		self.box = box
		self.Q = self.initialize_Q() 


	# Improve state-action policy "Q" for a specified number of episodes 
	# and with customizable hyperparameters. 
	def learn(self, episodes=100, epsilon=0.5, step_size=0.1, gamma_decay=0.5):		
		for i in range(episodes):
			self.box.reset()

			# Initialize S
			roll = self.box.roll_dice()
			state_0 = (self.box.get_box_hash(), roll)
				
			# Initialize A
			actions_0 = self.box.get_actions(roll)
			a_0 = self._get_action_epsilon_greedy(epsilon, state_0, actions_0)

			# Step until game ending condition met
			while True:
				self.box.move(a_0)
				reward = 1 if self.box.solved() else 0
				roll = self.box.roll_dice()
				state_1 = (self.box.get_box_hash(), roll)
				actions_1 = self.box.get_actions(roll)
				a_1 = self._get_action_epsilon_greedy(epsilon, state_1, actions_1)

				self.Q[(state_0, a_0)] += (step_size * 
											(reward + 
										 		(gamma_decay * 
										 		(self.Q[(state_1, a_1)] if a_1 is not None else 0)) - 
										 	 self.Q[(state_0, a_0)]))

				state_0 = state_1
				a_0 = a_1

				if actions_1 is None:
					break


	# Using the current state-action policy, play greedily for the specified
	# number of episodes and return the win percentage. 
	def play(self, episodes):
		total_wins = 0

		for _ in range(episodes):
			self.box.reset()

			roll = self.box.roll_dice()

			while True:
				state = (self.box.get_box_hash(), roll)
				actions = self.box.get_actions(roll)
				
				a = self._get_action_epsilon_greedy(1, state, actions)
				
				if a is not None:
					self.box.move(a)
					roll = self.box.roll_dice()
				else:
					break

			total_wins += 1 if self.box.solved() else 0

		return float(total_wins) / episodes


	# Given the current state-action pair, return an action greedily with
	# a probability equal to epsilon, otherwise return a random action. 
	def _get_action_epsilon_greedy(self, epsilon, state, actions):
		if actions is None:
			return None

		if random.random() < epsilon:
			current_high = 0
			best_action = None
			for a in actions:
				value = self.Q[(state, a)]
				if value >= current_high:
					current_high = value
					best_action = a
			return best_action
		else:
			return random.choice(actions)


	# Initialize Q(s, a) for all s in S, a in A(s). 
	# init_value specifies how to initialize values. 
	# Terminal states are initialized at 0 for losses and 1 for wins. 
	def initialize_Q(self, init_value=0):
		Q = dict()

		rolls = self.box.get_all_possible_rolls()
		
		if init_value == 0 or init_value == 1:
			value_func = lambda : init_value
		else:
			value_func = random.random

		for box_hash in range(2**self.box_high_num):
			for r in rolls:
				state = (box_hash, r)
				actions = self.box.get_actions_from_hash(box_hash, r)
				
				if actions is None:
					Q[(state, None)] = 0
				else:
					for a in actions:
						Q[(state, a)] = value_func()

		return Q


	def get_Q(self):
		return dict(self.Q)


	# Dump Q into a format ready for integration with a django
	# managed db (SQLite or PostgreSQL)
	def dump_Q_to_django_ready_json(self, model, filename):
		data = []
		rolls = self.box.get_all_possible_rolls()

		count = 1
		
		for bh in range(2**self.box.get_box_high_num()):
			for r in rolls:
				actions = self.box.get_actions_from_hash(bh, r)
						
				if actions is None:
					mh = None
				else:
					mh = self.box.get_moves_hash(random.choice(actions))
		
				data.append({
					"model": model,
					"pk": count,
					"fields": {
						"box_hash": bh,
						"roll": r,
						"moves_hash": mh
					}
				})
				count += 1

		with open(filename, "w") as write_file:
			json.dump(data, write_file)



