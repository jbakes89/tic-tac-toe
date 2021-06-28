# Tic-Tac-Toe

Author: Joseph Bakes (created on 3rd June, 2021)

## Description
An app that lets you play Tic Tac Toe between two people, built as part of The Odin Project Full Stack Javascript Course.

Note: Since this was a learning exercise, I've avoided using certain patterns (e.g., ES6 classes, modules). The intention of this project was to practice the use of the IIFE module pattern and factories.

Note: This project was severly interrupted by the birth of my wonderful children. Between the time spent in hospital and the time taking care of my wife at home after the delivery, I wasn't able to work on this project properly for around 3 weeks. 

### Things I've learned/practised:
- Improving appearance of website on mobile devices
- Creating a coherent, scalable, fluid appearance
- Structuring code into suitable objects
- Handling colours (specifically, formulae for setting text colour of suitable contrast and for determining similarity between two colours)

### Things to add/improve:
- Build a computer opponent
- Enable custom markers
- Allow players to set a custom grid size and the number of consecutive markers required for victory
- Add a match history

### Patch Notes (29th June, 2021)
- Built the edit menu for players to change name and colour
- Built a function to set the appropriate text colour (for the player markers) based on the players' choices of background colours
- Setup rules for edit menu validation (still need to implement actual handling for invalid input - i.e., an error message)
- Started to implement error messages for invalid edit menu input

### TODO (29th June, 2021)
- Allow players to edit their names and change colour
    - Have edit form be validated on input rather than submission
        - Add real-time validation for color pickers
    - Hide error messages when the form is closed (or update whenever form is opened?)
    - Add a cancel button?
    - Allow submission/cancelling using keyboard (Enter/Esc)
- Add a display to show the game outcome