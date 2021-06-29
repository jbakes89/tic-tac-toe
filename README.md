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
- Added validation for color pickers and error messages for invalid input.
- Added a "Confirm changes?" dialog when the inputs on the edit menu have been changed.
- Made sure that the edit menu properly resets (confirm dialog and error messages) on opening.
- Added keyboard controls to submit/cancel edit form

### TODO (29th June, 2021)
- Resize player names suitably whenever changed (`displayController._resizePlayerNames`)
- Add a display to show the game outcome
- Show which player's turn it is.