# MagicBox
Check out the website here: https://magicboxgame.herokuapp.com/

This a small collection of critical files from the more complex framework that supports this website. 

It includes:
- MagicBox.py, a class that provides an interface to simulate the game
- MagicBoxAgent.py, a class that provides a SARSA learning agent to learn how to play the game
- grid_search_example.py, a script that grid searches the best hyperparamaters for learning the game
- game.js, the webapp script that powers the online version of the game
- game.css, some styling

If you are interested in getting this all running together, the first three files can be used to create a JSON file ready to import into a database of AI advice. You must then figure out how you want to host the website and database. My version on heroku uses the django framework, but any RESTful API and database hosting should work. 

Thanks for checking it out! 
