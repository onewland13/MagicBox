from MagicBox import MagicBox
from MagicBoxAgent import MagicBoxAgent
import random 
import pickle

box = MagicBox()

# Hyperparameters
EPSILONS = [0.1, 0.5, 0.9, 1]
STEP_SIZES = [0.001, 0.01, 0.1, 0.5, 0.9, 1]
GAMMA_DECAYS = [0.05, 0.25, 0.5, 0.75, 0.95, 1]

TRAINING_EPISODES = 1000
TESTING_EPISODES = 50

AGENT_PICKLE_FILE = './agent_pickled.dat'
JSON_FILE = './json_dump.json'
DJANGO_MODEL_NAME = 'game.BoxQ'

def main():
	# Train and test across all hyperparameters
	agents = []
	scores = []
	params = []

	for e in EPSILONS:
		for ss in STEP_SIZES:
			for gd in GAMMA_DECAYS:
				print("TRAINING: ({}, {}, {})".format(e, ss, gd))

				agent = MagicBoxAgent(box)
				agent.learn(episodes=TRAINING_EPISODES, epsilon=e, step_size=ss, gamma_decay=gd)
				score = agent.play(TESTING_EPISODES)

				print("SCORED: {}".format(score))

				agents.append(agent)
				scores.append(score)
				params.append((e, ss, gd))

	# Organize and report results
	results = list(zip(agents, scores, params))
	results.sort(key=lambda x : x[1], reverse=True)

	print("ALL RESULTS")
	for a, s, p in results:
		print("{} YIELDS {}".format(p, s))

	# Pickle best agent
	with open(AGENT_PICKLE_FILE, "wb") as f:
		pickle.dump(results[0], f)

	# Save best agent's data to django ready json
	best_agent = results[0][0]
	best_agent.dump_Q_to_django_ready_json(DJANGO_MODEL_NAME, JSON_FILE)

if __name__ == '__main__':
	main()




